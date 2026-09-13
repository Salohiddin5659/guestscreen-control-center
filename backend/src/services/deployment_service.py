# -*- coding: utf-8 -*-
"""17-step deployment orchestrator executing atomic signage updates on cashier monoblocks (T046)."""
import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import List, Optional
import uuid

import asyncssh
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.adapters.command_adapter import (
    SCENE_GUID_FULL,
    SCENE_GUID_SPLIT,
    CashboxCommandAdapter,
)
from src.adapters.command_parsers import ProcessInfo
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.media_storage import StorageProvider
from src.adapters.scene_serializer import build_gallery_scene, build_static_scene
from src.adapters.sftp_storage import SFTPStorageClient
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.adapters.ssh_client import SSHConnectionPool
from src.adapters.staging_manager import StagingManager
from src.core.exceptions import (
    CashboxOfflineError,
    EntityNotFoundError,
    GuestScreenError,
    ProcessCrashDetectedError,
    SafetyBoundaryViolationError,
    StagingVerificationFailedError,
    ValidationDomainError,
)
from src.core.safety_guard import RetailSafetyGuard
from src.core.security import MasterKey
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.configuration import AdConfiguration
from src.models.credential import SSHCredential
from src.models.deployment import (
    Deployment,
    DeploymentStatus,
    DeploymentStep,
    RollbackSnapshot,
    StepStatus,
)
from src.models.media import AdMode, MediaAsset
from src.models.playlist import Playlist, PlaylistItem
from src.services.credential_service import CredentialService
from src.services.idempotency_service import IdempotencyService
from src.services.rollback_service import RollbackService
from src.services.verification_service import VerificationService

logger = logging.getLogger("guestscreen.deployment_orchestrator")


class DeploymentOrchestrator:
    """Executes the authoritative 17-step retail advertising deployment pipeline."""

    STEP_NAMES = {
        1: "VALIDATE_DESIRED_CONFIG",
        2: "VALIDATE_CENTRAL_MEDIA",
        3: "SSH_HANDSHAKE",
        4: "GET_CASHBOX_INVENTORY",
        5: "CALCULATE_DIFF",
        6: "UPLOAD_TO_STAGING",
        7: "VERIFY_HASH_ON_CASHBOX",
        8: "MOVE_FILES_ATOMICALLY",
        9: "SNAPSHOT_CURRENT_SCENE",
        10: "VALIDATE_SCENE_GUID",
        11: "UPDATE_ADVERTISING_SCENE",
        12: "COMMIT_TRANSACTION",
        13: "TOUCH_RELOAD",
        14: "WAIT_FOR_HOT_RELOAD",
        15: "VERIFY_PROCESS_STABILITY",
        16: "READ_SCENE_BACK",
        17: "MARK_SUCCESS",
    }

    def __init__(
        self,
        ssh_pool: Optional[SSHConnectionPool] = None,
        command_adapter: Optional[CashboxCommandAdapter] = None,
        sqlite_adapter: Optional[SQLiteSceneAdapter] = None,
        staging_manager: Optional[StagingManager] = None,
        storage_provider: Optional[StorageProvider] = None,
        credential_service: Optional[CredentialService] = None,
        idempotency_service: Optional[IdempotencyService] = None,
        verification_service: Optional[VerificationService] = None,
        rollback_service: Optional[RollbackService] = None,
    ) -> None:
        self.ssh_pool = ssh_pool or SSHConnectionPool()
        self.command_adapter = command_adapter or CashboxCommandAdapter()
        self.sqlite_adapter = sqlite_adapter or SQLiteSceneAdapter(self.command_adapter)
        self.staging_manager = staging_manager or StagingManager(self.command_adapter)
        self.storage_provider = storage_provider or LocalFileSystemStorageProvider()
        self.credential_service = credential_service or CredentialService()
        self.idempotency_service = idempotency_service or IdempotencyService()
        self.verification_service = verification_service or VerificationService(
            self.command_adapter, self.sqlite_adapter
        )
        self.rollback_service = rollback_service or RollbackService(
            self.sqlite_adapter, self.command_adapter
        )

    async def _record_step(
        self,
        db: AsyncSession,
        deployment: Deployment,
        step_number: int,
        status: StepStatus,
        details: Optional[dict] = None,
        error_message: Optional[str] = None,
    ) -> DeploymentStep:
        """Create or update progress for a specific deployment pipeline step."""
        step_name = self.STEP_NAMES.get(step_number, f"STEP_{step_number}")
        now = datetime.now(timezone.utc)

        existing_step = await db.scalar(
            select(DeploymentStep).where(
                DeploymentStep.deployment_id == deployment.id,
                DeploymentStep.step_number == step_number,
            )
        )

        if existing_step:
            existing_step.status = status.value
            if details:
                existing_step.details = details
            if error_message:
                existing_step.error_message = error_message
            if status in (StepStatus.SUCCESS, StepStatus.FAILED, StepStatus.SKIPPED):
                existing_step.finished_at = now
            await db.flush()
            return existing_step

        step = DeploymentStep(
            id=uuid.uuid4(),
            deployment_id=deployment.id,
            step_number=step_number,
            step_name=step_name,
            status=status.value,
            details=details,
            error_message=error_message,
            started_at=now,
            finished_at=now if status in (StepStatus.SUCCESS, StepStatus.FAILED, StepStatus.SKIPPED) else None,
        )
        db.add(step)
        deployment.current_step = step_number
        await db.flush()
        return step

    async def execute_deployment(
        self,
        db: AsyncSession,
        deployment_id: uuid.UUID,
        master_key: Optional[MasterKey] = None,
        active_connection: Optional[asyncssh.SSHClientConnection] = None,
    ) -> Deployment:
        """Execute the 17-step deployment pipeline for the specified deployment."""
        deployment = await db.scalar(
            select(Deployment)
            .where(Deployment.id == deployment_id)
            .options(
                selectinload(Deployment.cashbox),
                selectinload(Deployment.configuration)
                .selectinload(AdConfiguration.full_playlist)
                .selectinload(Playlist.items)
                .selectinload(PlaylistItem.media),
                selectinload(Deployment.configuration)
                .selectinload(AdConfiguration.split_playlist)
                .selectinload(Playlist.items)
                .selectinload(PlaylistItem.media),
            )
        )
        if not deployment:
            raise EntityNotFoundError(f"Deployment with ID '{deployment_id}' not found.")

        cashbox = deployment.cashbox
        config = deployment.configuration

        deployment.status = DeploymentStatus.RUNNING.value
        deployment.started_at = datetime.now(timezone.utc)
        await db.flush()

        conn: Optional[asyncssh.SSHClientConnection] = active_connection
        snapshot_taken = False
        snapshot_obj: Optional[RollbackSnapshot] = None
        dep_id_str = str(deployment.id)

        try:
            # =================================================================
            # STEP 1: VALIDATE_DESIRED_CONFIG
            # =================================================================
            await self._record_step(db, deployment, 1, StepStatus.RUNNING)
            if not config.full_playlist and not config.split_playlist:
                raise ValidationDomainError("AdConfiguration must contain at least one active playlist.")

            desired_media: List[MediaAsset] = []
            if config.full_playlist:
                for it in config.full_playlist.items:
                    desired_media.append(it.media)
            if config.split_playlist:
                for it in config.split_playlist.items:
                    desired_media.append(it.media)

            await self._record_step(
                db, deployment, 1, StepStatus.SUCCESS, {"media_count": len(desired_media)}
            )

            # =================================================================
            # STEP 2: VALIDATE_CENTRAL_MEDIA (PRE-FLIGHT DISK GATE)
            # =================================================================
            await self._record_step(db, deployment, 2, StepStatus.RUNNING)
            for media in desired_media:
                exists = await self.storage_provider.exists(media.storage_path)
                if not exists:
                    raise ValidationDomainError(
                        f"Media file '{media.filename}' missing from central storage at '{media.storage_path}'."
                    )
            await self._record_step(db, deployment, 2, StepStatus.SUCCESS)

            # =================================================================
            # STEP 3: SSH_HANDSHAKE
            # =================================================================
            await self._record_step(db, deployment, 3, StepStatus.RUNNING)
            if conn is None:
                # Retrieve credentials and establish connection
                if not cashbox.credential_id:
                    raise ValidationDomainError(f"Cashbox '{cashbox.name}' has no assigned SSH credential.")
                cred = await self.credential_service.get_credential(db, cashbox.credential_id)
                password = await self.credential_service.get_decrypted_secret(
                    db, cred.id, master_key=master_key
                )

                conn = await self.ssh_pool.get_connection(
                    cashbox_id=cashbox.id,
                    host=cashbox.ip_address,
                    port=cashbox.ssh_port,
                    username=cred.username,
                    password=password,
                )

            # PING verification
            ping_ok = await self.command_adapter.ping(conn)
            if not ping_ok:
                raise CashboxOfflineError(f"CMD_PING returned false on cashbox {cashbox.ip_address}")

            # Capture process baseline
            proc_baseline = await self.verification_service.get_process_baseline(conn)
            await self._record_step(
                db,
                deployment,
                3,
                StepStatus.SUCCESS,
                {"baseline_pid": proc_baseline.pid if proc_baseline else None},
            )

            # =================================================================
            # STEP 4: GET_CASHBOX_INVENTORY
            # =================================================================
            await self._record_step(db, deployment, 4, StepStatus.RUNNING)
            actual_inventory = await self.command_adapter.inventory(conn)
            cashbox.last_inventory_at = datetime.now(timezone.utc)
            await self._record_step(
                db, deployment, 4, StepStatus.SUCCESS, {"inventory_files_count": len(actual_inventory)}
            )

            # =================================================================
            # STEP 5: CALCULATE_DIFF & IDEMPOTENCY EVALUATION
            # =================================================================
            await self._record_step(db, deployment, 5, StepStatus.RUNNING)
            diff = self.idempotency_service.calculate_media_diff(desired_media, actual_inventory)

            # Prepare desired scenes
            desired_full_scene: Optional[str] = None
            if config.full_playlist:
                if not config.full_playlist.is_dynamic:
                    desired_full_scene = build_static_scene(
                        AdMode.FULL, config.full_playlist.items[0].media.filename
                    )
                else:
                    full_fns = [it.media.filename for it in config.full_playlist.items]
                    desired_full_scene = build_gallery_scene(
                        AdMode.FULL, full_fns, interval_sec=config.full_playlist.default_interval_sec
                    )

            desired_split_scene: Optional[str] = None
            if config.split_playlist:
                if not config.split_playlist.is_dynamic:
                    desired_split_scene = build_static_scene(
                        AdMode.SPLIT, config.split_playlist.items[0].media.filename
                    )
                else:
                    split_fns = [it.media.filename for it in config.split_playlist.items]
                    desired_split_scene = build_gallery_scene(
                        AdMode.SPLIT, split_fns, interval_sec=config.split_playlist.default_interval_sec
                    )

            # Read actual scenes to test idempotency
            actual_full_scene: Optional[str] = None
            if config.full_playlist:
                try:
                    actual_full_scene = await self.sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
                except Exception:
                    actual_full_scene = None

            actual_split_scene: Optional[str] = None
            if config.split_playlist:
                try:
                    actual_split_scene = await self.sqlite_adapter.read_scene(conn, SCENE_GUID_SPLIT)
                except Exception:
                    actual_split_scene = None

            # Check if this deployment is a zero-impact NO_OP
            if self.idempotency_service.is_idempotent_noop(
                cashbox=cashbox,
                target_config=config,
                diff=diff,
                actual_full_scene_raw=actual_full_scene,
                desired_full_scene_raw=desired_full_scene,
                actual_split_scene_raw=actual_split_scene,
                desired_split_scene_raw=desired_split_scene,
            ):
                await self._record_step(
                    db, deployment, 5, StepStatus.SUCCESS, {"idempotent_noop": True}
                )
                deployment.status = DeploymentStatus.NO_OP.value
                deployment.finished_at = datetime.now(timezone.utc)
                await db.flush()
                logger.info("Deployment %s resolved as NO_OP (<1s).", deployment.id)
                return deployment

            await self._record_step(
                db,
                deployment,
                5,
                StepStatus.SUCCESS,
                {"missing": len(diff.missing), "outdated": len(diff.outdated)},
            )

            # =================================================================
            # STEP 6: UPLOAD MISSING/OUTDATED TO STAGING VIA SFTP
            # =================================================================
            await self._record_step(db, deployment, 6, StepStatus.RUNNING)
            staged_files: List[MediaAsset] = diff.missing + diff.outdated
            sftp = SFTPStorageClient(conn)

            for asset in staged_files:
                staging_remote_path = self.staging_manager.get_staging_file_path(
                    dep_id_str, asset.filename
                )
                file_bytes = await self.storage_provider.get(asset.storage_path)
                await sftp.upload_bytes(file_bytes, staging_remote_path)

            await self._record_step(
                db, deployment, 6, StepStatus.SUCCESS, {"staged_count": len(staged_files)}
            )

            # =================================================================
            # STEP 7: VERIFY SHA-256 ON CASHBOX (MANDATORY STAGING GATE)
            # =================================================================
            await self._record_step(db, deployment, 7, StepStatus.RUNNING)
            for asset in staged_files:
                actual_hash = await self.command_adapter.hash_verify(
                    conn, dep_id_str, asset.filename
                )
                if actual_hash.lower() != asset.sha256.lower():
                    raise StagingVerificationFailedError(
                        f"SHA-256 mismatch for staged file '{asset.filename}': "
                        f"expected '{asset.sha256}', got '{actual_hash}'"
                    )
            await self._record_step(db, deployment, 7, StepStatus.SUCCESS)

            # =================================================================
            # STEP 8: MOVE FILES ATOMICALLY TO UPLOADS\
            # =================================================================
            await self._record_step(db, deployment, 8, StepStatus.RUNNING)
            for asset in staged_files:
                await self.staging_manager.promote_staging_file(
                    conn, dep_id_str, asset.filename
                )
            await self._record_step(db, deployment, 8, StepStatus.SUCCESS)

            # =================================================================
            # STEP 9: SNAPSHOT ADVERTISING SCENE (gs.db)
            # =================================================================
            await self._record_step(db, deployment, 9, StepStatus.RUNNING)
            prev_full_json: Optional[dict] = None
            if config.full_playlist and actual_full_scene:
                try:
                    prev_full_json = json.loads(actual_full_scene)
                except Exception:
                    pass

            prev_split_json: Optional[dict] = None
            if config.split_playlist and actual_split_scene:
                try:
                    prev_split_json = json.loads(actual_split_scene)
                except Exception:
                    pass

            snapshot_obj = RollbackSnapshot(
                id=uuid.uuid4(),
                deployment_id=deployment.id,
                previous_version=cashbox.actual_version,
                previous_full_scene=prev_full_json,
                previous_split_scene=prev_split_json,
            )
            db.add(snapshot_obj)
            await db.flush()
            snapshot_taken = True
            await self._record_step(db, deployment, 9, StepStatus.SUCCESS)

            # =================================================================
            # STEP 10: VALIDATE SCENE GUID
            # =================================================================
            await self._record_step(db, deployment, 10, StepStatus.RUNNING)
            if config.full_playlist:
                RetailSafetyGuard.validate_scene_guid(SCENE_GUID_FULL)
            if config.split_playlist:
                RetailSafetyGuard.validate_scene_guid(SCENE_GUID_SPLIT)
            await self._record_step(db, deployment, 10, StepStatus.SUCCESS)

            # =================================================================
            # STEP 11: UPDATE ADVERTISING SCENE VIA sqlite3.exe
            # =================================================================
            await self._record_step(db, deployment, 11, StepStatus.RUNNING)
            if desired_full_scene:
                await self.sqlite_adapter.update_scene(conn, SCENE_GUID_FULL, desired_full_scene)
            if desired_split_scene:
                await self.sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, desired_split_scene)
            await self._record_step(db, deployment, 11, StepStatus.SUCCESS)

            # =================================================================
            # STEP 12: COMMIT TRANSACTION (VERIFIED BY sqlite3.exe EXIT STATUS 0)
            # =================================================================
            await self._record_step(db, deployment, 12, StepStatus.RUNNING)
            # Checked implicitly by non-zero exit code validation in sqlite_adapter
            await self._record_step(db, deployment, 12, StepStatus.SUCCESS)

            # =================================================================
            # STEP 13: UPDATE sync_version.txt
            # =================================================================
            await self._record_step(db, deployment, 13, StepStatus.RUNNING)
            await self.command_adapter.touch_reload(conn)
            await self._record_step(db, deployment, 13, StepStatus.SUCCESS)

            # Transition deployment to VERIFYING state
            deployment.status = DeploymentStatus.VERIFYING.value
            await db.flush()

            # =================================================================
            # STEP 14: WAIT FOR HOT RELOAD (OBSERVABLE WINDOW)
            # =================================================================
            await self._record_step(db, deployment, 14, StepStatus.RUNNING)
            await asyncio.sleep(0.5)  # Observable window pause
            await self._record_step(db, deployment, 14, StepStatus.SUCCESS)

            # =================================================================
            # STEP 15: VERIFY PROCESS STABILITY
            # =================================================================
            await self._record_step(db, deployment, 15, StepStatus.RUNNING)
            await self.verification_service.verify_process_stability(conn, proc_baseline)
            await self._record_step(db, deployment, 15, StepStatus.SUCCESS)

            # =================================================================
            # STEP 16: READ SCENE BACK
            # =================================================================
            await self._record_step(db, deployment, 16, StepStatus.RUNNING)
            if desired_full_scene:
                await self.verification_service.verify_scene_readback(
                    conn, SCENE_GUID_FULL, desired_full_scene
                )
            if desired_split_scene:
                await self.verification_service.verify_scene_readback(
                    conn, SCENE_GUID_SPLIT, desired_split_scene
                )
            await self._record_step(db, deployment, 16, StepStatus.SUCCESS)

            # =================================================================
            # STEP 17: MARK SUCCESS
            # =================================================================
            await self._record_step(db, deployment, 17, StepStatus.RUNNING)
            cashbox.actual_version = config.version
            cashbox.last_deployment_at = datetime.now(timezone.utc)
            deployment.status = DeploymentStatus.SUCCESS.value
            deployment.finished_at = datetime.now(timezone.utc)
            await self._record_step(db, deployment, 17, StepStatus.SUCCESS)
            await db.flush()
            logger.info("Deployment %s completed successfully on cashbox %s", deployment.id, cashbox.name)
            return deployment

        except Exception as exc:
            logger.error("Deployment %s failed: %s", deployment.id, exc, exc_info=True)
            curr_step = deployment.current_step
            await self._record_step(
                db, deployment, curr_step, StepStatus.FAILED, error_message=str(exc)
            )

            deployment.status = DeploymentStatus.FAILED.value
            deployment.error_message = str(exc)
            deployment.finished_at = datetime.now(timezone.utc)
            await db.flush()

            # If staging directory was created, purge it cleanly
            if conn is not None:
                try:
                    await self.staging_manager.cleanup_staging(conn, dep_id_str)
                except Exception as clean_err:
                    logger.warning("Failed to clean up staging directory: %s", clean_err)

            # If failure occurred after scene update, trigger emergency rollback
            if snapshot_taken and snapshot_obj is not None and conn is not None:
                logger.warning("Initiating automated rollback for deployment %s", deployment.id)
                try:
                    await self.rollback_service.execute_rollback(
                        db, conn, deployment, snapshot_obj
                    )
                except Exception as rb_exc:
                    logger.critical("Automated rollback failed: %s", rb_exc)

            raise

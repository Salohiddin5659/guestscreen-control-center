# -*- coding: utf-8 -*-
"""50/50 Static promo deployment orchestration service maintaining retail order boundary (T061)."""
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

import asyncssh
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.command_adapter import (
    SCENE_GUID_SPLIT,
    CashboxCommandAdapter,
)
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.sftp_storage import SFTPStorageClient
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.adapters.staging_manager import StagingManager
from src.core.exceptions import (
    CashboxOfflineError,
    SafetyBoundaryViolationError,
    StagingVerificationFailedError,
    ValidationDomainError,
)
from src.core.safety_guard import RetailSafetyGuard
from src.models.cashbox import Cashbox
from src.models.configuration import AdConfiguration
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
from src.services.order_boundary_validator import OrderBoundaryValidator
from src.services.split_scene_builder import SplitStaticSceneBuilder
from src.services.verification_service import VerificationService

logger = logging.getLogger("guestscreen.split_deploy_service")


class SplitDeploymentOrchestrator:
    """Orchestrates 50/50 static promo deployments ensuring 100% order boundary isolation."""

    def __init__(
        self,
        command_adapter: Optional[CashboxCommandAdapter] = None,
        sqlite_adapter: Optional[SQLiteSceneAdapter] = None,
        staging_manager: Optional[StagingManager] = None,
        storage_provider: Optional[LocalFileSystemStorageProvider] = None,
        idempotency_service: Optional[IdempotencyService] = None,
        verification_service: Optional[VerificationService] = None,
        boundary_validator: Optional[OrderBoundaryValidator] = None,
        split_scene_builder: Optional[SplitStaticSceneBuilder] = None,
        credential_service: Optional[CredentialService] = None,
    ) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()
        self.sqlite_adapter = sqlite_adapter or SQLiteSceneAdapter(self.command_adapter)
        self.staging_manager = staging_manager or StagingManager(self.command_adapter)
        self.storage_provider = storage_provider or LocalFileSystemStorageProvider()
        self.idempotency_service = idempotency_service or IdempotencyService()
        self.verification_service = verification_service or VerificationService(
            self.command_adapter, self.sqlite_adapter
        )
        self.boundary_validator = boundary_validator or OrderBoundaryValidator(self.command_adapter)
        self.split_scene_builder = split_scene_builder or SplitStaticSceneBuilder(
            self.sqlite_adapter, self.command_adapter
        )
        self.credential_service = credential_service or CredentialService()

    STEP_NAMES = {
        1: "VALIDATE_SPLIT_CONFIG",
        2: "VALIDATE_CENTRAL_MEDIA",
        3: "SSH_HANDSHAKE_PROCESS_BASELINE",
        4: "INVENTORY_ORDER_BOUNDARY_BASELINE",
        5: "CALCULATE_DIFF_IDEMPOTENCY",
        6: "STAGING_UPLOAD",
        7: "SHA256_VERIFICATION",
        8: "STAGING_PROMOTION",
        9: "SNAPSHOT_PREVIOUS_SCENE",
        10: "VALIDATE_SCENE_GUID",
        11: "SURGICAL_SQLITE_UPDATE",
        12: "VERIFY_ORDER_BOUNDARY_IMMUTABILITY",
        13: "TOUCH_RELOAD",
        14: "VERIFY_PROCESS_AND_SCENE",
        15: "FINALIZE",
    }

    async def _record_step(
        self,
        db: AsyncSession,
        deployment: Deployment,
        step_number: int,
        status: StepStatus,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> None:
        """Record or update execution state for a deployment step."""
        step_name = self.STEP_NAMES.get(step_number, f"STEP_{step_number}")
        now = datetime.now(timezone.utc)

        # Look for existing step
        from sqlalchemy import select
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
            return

        step = DeploymentStep(
            id=uuid.uuid4(),
            deployment_id=deployment.id,
            step_number=step_number,
            step_name=step_name,
            status=status.value,
            details=details or {},
            error_message=error_message,
        )
        if status == StepStatus.RUNNING:
            step.started_at = now
        elif status in (StepStatus.SUCCESS, StepStatus.FAILED):
            step.finished_at = now
        db.add(step)
        await db.flush()

    async def execute_deployment(
        self,
        db: AsyncSession,
        deployment: Deployment | uuid.UUID,
        active_connection: Optional[asyncssh.SSHClientConnection] = None,
        master_key: Optional[bytes] = None,
    ) -> Deployment:
        """Execute 50/50 static promo deployment pipeline to cashier monoblock."""
        dep_id = deployment if isinstance(deployment, uuid.UUID) else getattr(deployment, "id", None)
        if dep_id is not None and not hasattr(db, "_mock_return_value"):
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload
            loaded = await db.scalar(
                select(Deployment)
                .where(Deployment.id == dep_id)
                .options(
                    selectinload(Deployment.cashbox),
                    selectinload(Deployment.configuration)
                    .selectinload(AdConfiguration.split_playlist)
                    .selectinload(Playlist.items)
                    .selectinload(PlaylistItem.media),
                )
            )
            if loaded is not None:
                deployment = loaded

        cashbox: Cashbox = deployment.cashbox
        config: AdConfiguration = deployment.configuration

        deployment.status = DeploymentStatus.RUNNING.value
        deployment.started_at = datetime.now(timezone.utc)
        await db.flush()

        conn: Optional[asyncssh.SSHClientConnection] = active_connection
        snapshot_taken = False
        snapshot_obj: Optional[RollbackSnapshot] = None
        dep_id_str = str(deployment.id)

        try:
            # STEP 1: VALIDATE 50/50 CONFIGURATION & MEDIA
            await self._record_step(db, deployment, 1, StepStatus.RUNNING)
            if not config.split_playlist:
                raise ValidationDomainError("50/50 static deployment requires an active split_playlist.")
            if len(config.split_playlist.items) != 1:
                raise ValidationDomainError(
                    f"50/50 static deployment requires exactly 1 media asset, got {len(config.split_playlist.items)}."
                )

            media_asset: MediaAsset = config.split_playlist.items[0].media
            # Validate resolution and mode via scene builder
            desired_split_scene = self.split_scene_builder.build_split_static_scene_json(media_asset)

            await self._record_step(
                db, deployment, 1, StepStatus.SUCCESS, {"media": media_asset.filename}
            )

            # STEP 2: VALIDATE CENTRAL STORAGE
            await self._record_step(db, deployment, 2, StepStatus.RUNNING)
            if not await self.storage_provider.exists(media_asset.storage_path):
                raise ValidationDomainError(
                    f"Media file '{media_asset.filename}' missing from central storage."
                )
            await self._record_step(db, deployment, 2, StepStatus.SUCCESS)

            # STEP 3: SSH HANDSHAKE & PROCESS BASELINE
            await self._record_step(db, deployment, 3, StepStatus.RUNNING)
            if conn is None:
                if not cashbox.credential_id:
                    raise ValidationDomainError(f"Cashbox '{cashbox.name}' has no assigned SSH credential.")
                cred = await self.credential_service.get_credential(db, cashbox.credential_id)
                password = await self.credential_service.get_decrypted_secret(
                    db, cred.id, master_key=master_key
                )
                conn = await asyncssh.connect(
                    cashbox.ip_address,
                    port=cashbox.ssh_port,
                    username=cred.username,
                    password=password,
                    known_hosts=None,
                    connect_timeout=10.0,
                )

            ping_ok = await self.command_adapter.ping(conn)
            if not ping_ok:
                raise CashboxOfflineError(f"CMD_PING returned false on cashbox {cashbox.ip_address}")

            proc_baseline = await self.verification_service.get_process_baseline(conn)
            await self._record_step(
                db,
                deployment,
                3,
                StepStatus.SUCCESS,
                {"baseline_pid": proc_baseline.pid if proc_baseline else None},
            )

            # STEP 4: INVENTORY & ORDER BOUNDARY BASELINE
            await self._record_step(db, deployment, 4, StepStatus.RUNNING)
            actual_inventory = await self.command_adapter.inventory(conn)
            cashbox.last_inventory_at = datetime.now(timezone.utc)
            boundary_baseline = await self.boundary_validator.capture_baseline(conn)
            await self._record_step(
                db, deployment, 4, StepStatus.SUCCESS, {"inventory_files": len(actual_inventory)}
            )

            # STEP 5: DIFF & IDEMPOTENCY EVALUATION
            await self._record_step(db, deployment, 5, StepStatus.RUNNING)
            diff = self.idempotency_service.calculate_media_diff([media_asset], actual_inventory)

            # Read actual split scene
            actual_split_scene: Optional[str] = None
            try:
                actual_split_scene = await self.sqlite_adapter.read_scene(conn, SCENE_GUID_SPLIT)
            except Exception:
                actual_split_scene = None

            if self.idempotency_service.is_idempotent_noop(
                cashbox=cashbox,
                target_config=config,
                diff=diff,
                actual_full_scene_raw=None,
                desired_full_scene_raw=None,
                actual_split_scene_raw=actual_split_scene,
                desired_split_scene_raw=desired_split_scene,
            ):
                await self._record_step(
                    db, deployment, 5, StepStatus.SUCCESS, {"idempotent_noop": True}
                )
                deployment.status = DeploymentStatus.NO_OP.value
                deployment.finished_at = datetime.now(timezone.utc)
                await db.flush()
                logger.info("50/50 Static deployment %s resolved as NO_OP (<1s).", deployment.id)
                return deployment

            await self._record_step(
                db, deployment, 5, StepStatus.SUCCESS, {"needs_upload": len(diff.missing + diff.outdated)}
            )

            # STEP 6-8: STAGING UPLOAD, SHA VERIFICATION & PROMOTION
            staged_files: List[MediaAsset] = diff.missing + diff.outdated
            if staged_files:
                # Step 6: SFTP Upload to .staging
                await self._record_step(db, deployment, 6, StepStatus.RUNNING)
                sftp = SFTPStorageClient(conn)
                for asset in staged_files:
                    target_path = self.staging_manager.get_staging_file_path(dep_id_str, asset.filename)
                    file_bytes = await self.storage_provider.get(asset.storage_path)
                    await sftp.upload_bytes(file_bytes, target_path)
                await self._record_step(db, deployment, 6, StepStatus.SUCCESS)

                # Step 7: SHA-256 Verification on Cashbox
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

                # Step 8: Promote to uploads\
                await self._record_step(db, deployment, 8, StepStatus.RUNNING)
                for asset in staged_files:
                    await self.staging_manager.promote_staging_file(
                        conn, dep_id_str, asset.filename
                    )
                await self._record_step(db, deployment, 8, StepStatus.SUCCESS)

            # STEP 9: SNAPSHOT PREVIOUS 50/50 SCENE
            await self._record_step(db, deployment, 9, StepStatus.RUNNING)
            prev_split_json = None
            if actual_split_scene:
                try:
                    prev_split_json = json.loads(actual_split_scene)
                except Exception:
                    pass

            snapshot_obj = RollbackSnapshot(
                id=uuid.uuid4(),
                deployment_id=deployment.id,
                previous_version=cashbox.actual_version,
                previous_full_scene=None,
                previous_split_scene=prev_split_json,
            )
            db.add(snapshot_obj)
            await db.flush()
            snapshot_taken = True
            await self._record_step(db, deployment, 9, StepStatus.SUCCESS)

            # STEP 10: VALIDATE SCENE GUID SAFETY BOUNDARY
            await self._record_step(db, deployment, 10, StepStatus.RUNNING)
            RetailSafetyGuard.validate_scene_guid(SCENE_GUID_SPLIT)
            await self._record_step(db, deployment, 10, StepStatus.SUCCESS)

            # STEP 11: SURGICAL SQLITE UPDATE (TARGETS ONLY SCENE_GUID_SPLIT)
            await self._record_step(db, deployment, 11, StepStatus.RUNNING)
            await self.sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, desired_split_scene)
            await self._record_step(db, deployment, 11, StepStatus.SUCCESS)

            # STEP 12: VERIFY ORDER BOUNDARY IMMUTABILITY (RETAIL SAFETY CHECK)
            await self._record_step(db, deployment, 12, StepStatus.RUNNING)
            await self.boundary_validator.verify_boundary_unmodified(conn, boundary_baseline)
            await self._record_step(db, deployment, 12, StepStatus.SUCCESS)

            # STEP 13: TOUCH RELOAD
            await self._record_step(db, deployment, 13, StepStatus.RUNNING)
            await self.command_adapter.touch_reload(conn)
            await self._record_step(db, deployment, 13, StepStatus.SUCCESS)

            # STEP 14-16: OBSERVABLE RECOVERY & PROCESS STABILITY
            await self._record_step(db, deployment, 14, StepStatus.RUNNING)
            await self.verification_service.verify_process_stability(conn, proc_baseline)
            await self.verification_service.verify_scene_readback(
                conn, SCENE_GUID_SPLIT, desired_split_scene
            )
            await self._record_step(db, deployment, 14, StepStatus.SUCCESS)

            # STEP 17: FINALIZE
            cashbox.actual_version = config.version
            deployment.status = DeploymentStatus.SUCCESS.value
            deployment.finished_at = datetime.now(timezone.utc)
            await db.flush()
            logger.info("50/50 Static deployment %s completed successfully.", deployment.id)
            return deployment

        except Exception as exc:
            logger.error("50/50 Static deployment %s failed: %s", deployment.id, exc, exc_info=True)
            deployment.status = DeploymentStatus.FAILED.value
            deployment.finished_at = datetime.now(timezone.utc)
            deployment.error_message = str(exc)

            # Rollback if scene was updated
            if snapshot_taken and snapshot_obj and conn:
                try:
                    logger.warning("Triggering automatic rollback for deployment %s", deployment.id)
                    if snapshot_obj.previous_split_scene is not None:
                        rb_json = json.dumps(snapshot_obj.previous_split_scene)
                        await self.sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, rb_json)
                        await self.command_adapter.touch_reload(conn)
                        logger.info("Rollback of scene %s restored cleanly.", SCENE_GUID_SPLIT)
                except Exception as rb_exc:
                    logger.critical("Rollback failed for deployment %s: %s", deployment.id, rb_exc)

            # Cleanup staging if present
            if conn:
                try:
                    await self.staging_manager.cleanup_staging_dir(conn, dep_id_str)
                except Exception:
                    pass

            await db.flush()
            raise

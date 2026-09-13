# -*- coding: utf-8 -*-
"""Integration tests for staging failure gates and pre-flight media checks (T050)."""
import hashlib
import tempfile
import uuid
import pytest
import asyncssh
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.core.exceptions import StagingVerificationFailedError, ValidationDomainError
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.deployment import Deployment, DeploymentStatus, DeploymentStep, StepStatus
from src.models.media import AdMode, MediaAsset
from src.services.config_service import AdConfigurationService
from src.services.deployment_service import DeploymentOrchestrator
from src.services.playlist_service import PlaylistService
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_missing_central_media_fails_step_2_before_ssh(
    async_db_session: AsyncSession,
):
    """Verify that missing media on central server storage halts pipeline at Step 2."""
    with tempfile.TemporaryDirectory() as empty_storage_dir:
        storage = LocalFileSystemStorageProvider(root_dir=empty_storage_dir)

        # Register asset in DB that does NOT exist on disk
        media = MediaAsset(
            id=uuid.uuid4(),
            filename="ghost_file.jpg",
            storage_path=f"{empty_storage_dir}/ghost_file.jpg",  # Not on disk!
            sha256="0" * 64,
            file_size_bytes=1000,
            mime_type="image/jpeg",
            width=1024,
            height=768,
            aspect_ratio="4:3",
            ad_mode=AdMode.FULL.value,
        )
        async_db_session.add(media)
        await async_db_session.flush()

        pl_svc = PlaylistService()
        config_svc = AdConfigurationService()

        playlist = await pl_svc.create_static_playlist(
            async_db_session, "Ghost Playlist", media.id, ad_mode=AdMode.FULL
        )
        config = await config_svc.create_configuration(
            async_db_session, "Ghost Config", full_playlist_id=playlist.id
        )

        cb = Cashbox(
            id=uuid.uuid4(),
            name="Cashbox Ghost",
            ip_address="10.0.0.241",
            ssh_port=22,
            status=CashboxStatus.ACTIVE.value,
            desired_version=config.version,
            actual_version=0,
        )
        async_db_session.add(cb)

        dep = Deployment(
            id=uuid.uuid4(),
            cashbox_id=cb.id,
            configuration_id=config.id,
            target_version=config.version,
            status=DeploymentStatus.PENDING.value,
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        orchestrator = DeploymentOrchestrator(storage_provider=storage)

        with pytest.raises(ValidationDomainError) as exc_info:
            await orchestrator.execute_deployment(async_db_session, dep.id)

        assert "missing from central storage" in str(exc_info.value).lower()
        assert dep.status == DeploymentStatus.FAILED.value
        assert dep.current_step == 2


@pytest.mark.asyncio
async def test_sha_mismatch_in_staging_aborts_before_gs_db(
    async_db_session: AsyncSession,
    sample_jpeg_1024x768: bytes,
):
    """Verify that corrupt staged file halts pipeline at Step 7; gs.db is never touched."""
    with tempfile.TemporaryDirectory() as local_storage_dir, tempfile.TemporaryDirectory() as mock_cashbox_root:
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)
        sha256 = hashlib.sha256(sample_jpeg_1024x768).hexdigest()
        storage_path = await storage.save(sample_jpeg_1024x768, "corrupted_promo.jpg")

        media = MediaAsset(
            id=uuid.uuid4(),
            filename="corrupted_promo.jpg",
            storage_path=storage_path,
            sha256=sha256,
            file_size_bytes=len(sample_jpeg_1024x768),
            mime_type="image/jpeg",
            width=1024,
            height=768,
            aspect_ratio="4:3",
            ad_mode=AdMode.FULL.value,
        )
        async_db_session.add(media)
        await async_db_session.flush()

        pl_svc = PlaylistService()
        config_svc = AdConfigurationService()

        playlist = await pl_svc.create_static_playlist(
            async_db_session, "Corrupt Playlist", media.id, ad_mode=AdMode.FULL
        )
        config = await config_svc.create_configuration(
            async_db_session, "Corrupt Config", full_playlist_id=playlist.id
        )

        cb = Cashbox(
            id=uuid.uuid4(),
            name="Cashbox Corrupt",
            ip_address="10.0.0.241",
            ssh_port=22,
            status=CashboxStatus.ACTIVE.value,
            desired_version=config.version,
            actual_version=0,
        )
        async_db_session.add(cb)

        dep = Deployment(
            id=uuid.uuid4(),
            cashbox_id=cb.id,
            configuration_id=config.id,
            target_version=config.version,
            status=DeploymentStatus.PENDING.value,
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        # Simulate corrupt hash returned on cashbox
        bad_hash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        sqlite_updated = False

        def update_handler(cmd: str):
            nonlocal sqlite_updated
            sqlite_updated = True
            return 0, "", ""

        custom_responses = {
            "Get-ChildItem": (0, "[]\r\n", ""),
            "Get-FileHash": (0, f"{bad_hash}\r\n", ""),  # Mismatched SHA-256!
            "Move-Item": (0, "", ""),
            "UPDATE scenes SET Raw": update_handler,
            "Get-Process -Name 'GuestScreen'": (0, '{"Id": 4120, "StartTime": "2026-09-10T08:00:00.0000000Z"}\r\n', ""),
        }

        async with start_mock_cashbox_server(
            username="Administrator",
            password="test_password",
            chroot_dir=mock_cashbox_root,
            custom_responses=custom_responses,
        ) as (host, port):
            async with asyncssh.connect(
                host, port=port, username="Administrator", password="test_password", known_hosts=None
            ) as conn:
                orchestrator = DeploymentOrchestrator(storage_provider=storage)

                with pytest.raises(StagingVerificationFailedError):
                    await orchestrator.execute_deployment(
                        async_db_session,
                        dep.id,
                        active_connection=conn,
                    )

                # Verify pipeline halted at Step 7
                assert dep.status == DeploymentStatus.FAILED.value
                assert dep.current_step == 7
                assert sqlite_updated is False, "gs.db must NEVER be modified when staging verification fails!"

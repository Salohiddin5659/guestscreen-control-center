# -*- coding: utf-8 -*-
"""Integration test for 50/50 static promo banner deployment pipeline (T063)."""
import hashlib
import json
import tempfile
import uuid
import pytest
import asyncssh
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.command_adapter import SCENE_GUID_SPLIT, SCENE_GUID_FULL, CashboxCommandAdapter
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import SafetyBoundaryViolationError, StagingVerificationFailedError, ValidationDomainError
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.configuration import AdConfiguration
from src.models.credential import SSHAuthType, SSHCredential
from src.models.deployment import Deployment, DeploymentStatus
from src.models.media import AdMode, MediaAsset
from src.services.config_service import AdConfigurationService
from src.services.playlist_service import PlaylistService
from src.services.split_deploy_service import SplitDeploymentOrchestrator
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_split_static_deployment_happy_path(
    async_db_session: AsyncSession,
    sample_jpeg_512x768: bytes,
):
    """Verify that 50/50 static deployment executes cleanly targeting only SCENE_GUID_SPLIT."""
    with tempfile.TemporaryDirectory() as local_storage_dir, tempfile.TemporaryDirectory() as mock_cashbox_root:
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)
        sha256 = hashlib.sha256(sample_jpeg_512x768).hexdigest()
        storage_path = await storage.save(sample_jpeg_512x768, "upsell_combo.jpg")

        media = MediaAsset(
            id=uuid.uuid4(),
            filename="upsell_combo.jpg",
            storage_path=storage_path,
            sha256=sha256,
            file_size_bytes=len(sample_jpeg_512x768),
            mime_type="image/jpeg",
            width=512,
            height=768,
            aspect_ratio="2:3",
            ad_mode=AdMode.SPLIT.value,
        )
        async_db_session.add(media)
        await async_db_session.flush()

        pl_svc = PlaylistService()
        config_svc = AdConfigurationService()

        playlist = await pl_svc.create_static_playlist(
            async_db_session, "Split Static Playlist", media.id, ad_mode=AdMode.SPLIT
        )
        config = await config_svc.create_configuration(
            async_db_session, "Split Static Config v1", split_playlist_id=playlist.id
        )

        cred = SSHCredential(
            id=uuid.uuid4(),
            name="Cashbox Cred",
            username="Administrator",
            auth_type=SSHAuthType.PASSWORD.value,
            ciphertext=b"dummy",
            nonce=b"123456789012",
            tag=b"1234567890123456",
        )
        async_db_session.add(cred)

        cb = Cashbox(
            id=uuid.uuid4(),
            name="Acceptance Cashbox 241",
            ip_address="10.0.0.241",
            ssh_port=22,
            credential_id=cred.id,
            status=CashboxStatus.ACTIVE.value,
            desired_version=1,
            actual_version=0,
        )
        async_db_session.add(cb)

        dep = Deployment(
            id=uuid.uuid4(),
            cashbox_id=cb.id,
            configuration_id=config.id,
            target_version=1,
            status=DeploymentStatus.PENDING.value,
            cashbox=cb,
            configuration=config,
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        target_scene_json = json.dumps(
            {"type": "image", "width": 512, "height": 768, "src": "media/uploads/upsell_combo.jpg"}
        )

        custom_responses = {
            "Get-ChildItem": (0, "[]\r\n", ""),
            "Get-FileHash": (0, f"{sha256}\r\n", ""),
            "Move-Item": (0, "", ""),
            "SELECT Raw FROM scenes": (0, f"{target_scene_json}\r\n", ""),
            "UPDATE scenes SET Raw": (0, "", ""),
            "SELECT * FROM": (0, "row1|data\nrow2|data\r\n", ""),
            "sync_version.txt": (0, "", ""),
            "Get-Process -Name 'GuestScreen'": (0, '{"Id": 2128, "StartTime": "2026-09-09T01:53:45.3888691+05:00", "Path": "C:\\\\UCS\\\\GuestScreen\\\\GuestScreen.exe", "WorkingSet": 45000000, "Threads": 39, "ListeningPorts": [2121], "HasPort2121": true, "HasLibcef": true, "HasCefSharp": true, "WorkingDirectory": "C:\\\\UCS\\\\GuestScreen"}\r\n', ""),
        }

        async with start_mock_cashbox_server(
            username="Administrator",
            password="test_password",
            chroot_dir=mock_cashbox_root,
            custom_responses=custom_responses,
        ) as (mock_host, mock_port):
            async with asyncssh.connect(
                mock_host,
                port=mock_port,
                username="Administrator",
                password="test_password",
                known_hosts=None,
            ) as conn:
                orchestrator = SplitDeploymentOrchestrator(storage_provider=storage)
                res = await orchestrator.execute_deployment(
                    async_db_session, dep, active_connection=conn
                )

                assert res.status == DeploymentStatus.SUCCESS.value
                assert cb.actual_version == 1


@pytest.mark.asyncio
async def test_split_static_deployment_sha_mismatch_fails(
    async_db_session: AsyncSession,
    sample_jpeg_512x768: bytes,
):
    """Verify SHA mismatch during staging check halts deployment before scene update."""
    with tempfile.TemporaryDirectory() as local_storage_dir, tempfile.TemporaryDirectory() as mock_cashbox_root:
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)
        sha256 = hashlib.sha256(sample_jpeg_512x768).hexdigest()
        storage_path = await storage.save(sample_jpeg_512x768, "corrupted_banner.jpg")

        media = MediaAsset(
            id=uuid.uuid4(),
            filename="corrupted_banner.jpg",
            storage_path=storage_path,
            sha256=sha256,
            file_size_bytes=len(sample_jpeg_512x768),
            mime_type="image/jpeg",
            width=512,
            height=768,
            aspect_ratio="2:3",
            ad_mode=AdMode.SPLIT.value,
        )
        async_db_session.add(media)
        await async_db_session.flush()

        pl_svc = PlaylistService()
        config_svc = AdConfigurationService()

        playlist = await pl_svc.create_static_playlist(
            async_db_session, "Split Corrupted Playlist", media.id, ad_mode=AdMode.SPLIT
        )
        config = await config_svc.create_configuration(
            async_db_session, "Split Corrupted Config", split_playlist_id=playlist.id
        )

        cred = SSHCredential(
            id=uuid.uuid4(),
            name="Cashbox Cred",
            username="Administrator",
            auth_type=SSHAuthType.PASSWORD.value,
            ciphertext=b"dummy",
            nonce=b"123456789012",
            tag=b"1234567890123456",
        )
        async_db_session.add(cred)

        cb = Cashbox(
            id=uuid.uuid4(),
            name="Cashbox 241",
            ip_address="10.0.0.241",
            ssh_port=22,
            credential_id=cred.id,
            status=CashboxStatus.ACTIVE.value,
            desired_version=1,
            actual_version=0,
        )
        async_db_session.add(cb)

        dep = Deployment(
            id=uuid.uuid4(),
            cashbox_id=cb.id,
            configuration_id=config.id,
            target_version=1,
            status=DeploymentStatus.PENDING.value,
            cashbox=cb,
            configuration=config,
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        # Remote hash check returns a completely mismatched hash
        bad_hash = "f" * 64
        custom_responses = {
            "Get-ChildItem": (0, "[]\r\n", ""),
            "Get-FileHash": (0, f"{bad_hash}\r\n", ""),
            "SELECT * FROM": (0, "row1|data\r\n", ""),
            "Get-Process -Name 'GuestScreen'": (0, '{"Id": 2128, "StartTime": "2026-09-09T01:53:45.3888691+05:00", "Path": "C:\\\\UCS\\\\GuestScreen\\\\GuestScreen.exe", "WorkingSet": 45000000, "Threads": 39, "ListeningPorts": [2121], "HasPort2121": true, "HasLibcef": true, "HasCefSharp": true, "WorkingDirectory": "C:\\\\UCS\\\\GuestScreen"}\r\n', ""),
        }

        async with start_mock_cashbox_server(
            username="Administrator",
            password="test_password",
            chroot_dir=mock_cashbox_root,
            custom_responses=custom_responses,
        ) as (mock_host, mock_port):
            async with asyncssh.connect(
                mock_host,
                port=mock_port,
                username="Administrator",
                password="test_password",
                known_hosts=None,
            ) as conn:
                orchestrator = SplitDeploymentOrchestrator(storage_provider=storage)
                with pytest.raises(StagingVerificationFailedError) as exc:
                    await orchestrator.execute_deployment(
                        async_db_session, dep, active_connection=conn
                    )
                assert "SHA-256 mismatch" in str(exc.value)
                assert dep.status == DeploymentStatus.FAILED.value

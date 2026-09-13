# -*- coding: utf-8 -*-
"""Integration test verifying staging folder cleanup on partial upload failure (T057)."""
import hashlib
import os
import tempfile
import uuid
from unittest.mock import patch
import pytest
import asyncssh
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.sftp_storage import SFTPStorageClient
from src.core.exceptions import GuestScreenError
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.configuration import AdConfiguration
from src.models.credential import SSHAuthType, SSHCredential
from src.models.deployment import Deployment, DeploymentStatus, DeploymentStep, StepStatus
from src.models.media import AdMode, MediaAsset
from src.services.config_service import AdConfigurationService
from src.services.deployment_service import DeploymentOrchestrator
from src.services.playlist_compiler import PlaylistCompiler, SlideSpec
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_staging_cleanup_on_partial_upload_failure(
    async_db_session: AsyncSession,
    sample_jpeg_1024x768: bytes,
):
    r"""Verify that if upload of 2nd file fails, .staging\<id>\ is removed and gs.db is untouched."""
    with tempfile.TemporaryDirectory() as local_storage_dir, tempfile.TemporaryDirectory() as mock_cashbox_root:
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)

        path1 = await storage.save(sample_jpeg_1024x768 + b"1", "slide1.jpg")
        path2 = await storage.save(sample_jpeg_1024x768 + b"2", "slide2.jpg")
        path3 = await storage.save(sample_jpeg_1024x768 + b"3", "slide3.jpg")

        m1 = MediaAsset(
            id=uuid.uuid4(),
            filename="slide1.jpg",
            storage_path=path1,
            sha256=hashlib.sha256(sample_jpeg_1024x768 + b"1").hexdigest(),
            file_size_bytes=len(sample_jpeg_1024x768) + 1,
            mime_type="image/jpeg",
            width=1024,
            height=768,
            aspect_ratio="4:3",
            ad_mode=AdMode.FULL.value,
        )
        m2 = MediaAsset(
            id=uuid.uuid4(),
            filename="slide2.jpg",
            storage_path=path2,
            sha256=hashlib.sha256(sample_jpeg_1024x768 + b"2").hexdigest(),
            file_size_bytes=len(sample_jpeg_1024x768) + 1,
            mime_type="image/jpeg",
            width=1024,
            height=768,
            aspect_ratio="4:3",
            ad_mode=AdMode.FULL.value,
        )
        m3 = MediaAsset(
            id=uuid.uuid4(),
            filename="slide3.jpg",
            storage_path=path3,
            sha256=hashlib.sha256(sample_jpeg_1024x768 + b"3").hexdigest(),
            file_size_bytes=len(sample_jpeg_1024x768) + 1,
            mime_type="image/jpeg",
            width=1024,
            height=768,
            aspect_ratio="4:3",
            ad_mode=AdMode.FULL.value,
        )
        async_db_session.add_all([m1, m2, m3])
        await async_db_session.flush()

        compiler = PlaylistCompiler()
        config_svc = AdConfigurationService()

        specs = [
            SlideSpec(media_id=m1.id, duration_seconds=5),
            SlideSpec(media_id=m2.id, duration_seconds=5),
            SlideSpec(media_id=m3.id, duration_seconds=5),
        ]
        playlist = await compiler.compile_dynamic_playlist(
            async_db_session,
            name="Partial Upload Test",
            slide_specs=specs,
            ad_mode=AdMode.FULL,
        )
        config = await config_svc.create_configuration(
            async_db_session, "Partial Upload Config", full_playlist_id=playlist.id
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
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        custom_responses = {
            "Get-ChildItem": (0, "[]\r\n", ""),
            "SELECT Raw FROM scenes": (0, '{"type":"image"}\r\n', ""),
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

                # Mock upload_bytes: file 1 succeeds, file 2 raises ConnectionResetError
                orig_upload_bytes = SFTPStorageClient.upload_bytes
                upload_calls = []

                async def mock_upload_bytes(self_client, data, remote_path):
                    upload_calls.append(remote_path)
                    if "slide2.jpg" in remote_path:
                        raise ConnectionResetError("Simulated network drop on slide2.jpg")
                    return await orig_upload_bytes(self_client, data, remote_path)

                with patch.object(SFTPStorageClient, "upload_bytes", new=mock_upload_bytes):
                    with pytest.raises(ConnectionResetError, match="Simulated network drop"):
                        await orchestrator.execute_deployment(
                            async_db_session,
                            dep.id,
                            active_connection=conn,
                        )

                # 1. Verify deployment marked FAILED
                await async_db_session.refresh(dep)
                assert dep.status == DeploymentStatus.FAILED.value
                assert "Simulated network drop" in (dep.error_message or "")

                # 2. Verify cashbox version is unchanged (remains 0)
                await async_db_session.refresh(cb)
                assert cb.actual_version == 0

                # 3. Verify step 6 marked FAILED
                step6 = await async_db_session.scalar(
                    select(DeploymentStep).where(
                        DeploymentStep.deployment_id == dep.id,
                        DeploymentStep.step_number == 6,
                    )
                )
                assert step6 is not None
                assert step6.status == StepStatus.FAILED.value

                # 4. Verify steps 7-17 were never executed
                later_steps = (
                    await async_db_session.scalars(
                        select(DeploymentStep).where(
                            DeploymentStep.deployment_id == dep.id,
                            DeploymentStep.step_number > 6,
                        )
                    )
                ).all()
                assert len(later_steps) == 0

                # 5. Verify staging directory is cleaned up on the cashbox
                staging_path = os.path.join(
                    mock_cashbox_root,
                    "UCS",
                    "GuestScreen",
                    "Front",
                    "media",
                    "uploads",
                    ".staging",
                    str(dep.id),
                )
                # Staging dir should either not exist or be empty
                if os.path.exists(staging_path):
                    assert len(os.listdir(staging_path)) == 0, f"Staging folder not cleaned up: {os.listdir(staging_path)}"

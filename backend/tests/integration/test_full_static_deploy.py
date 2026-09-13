# -*- coding: utf-8 -*-
"""Integration test for FULL static banner 17-step deployment pipeline happy path (T048)."""
import hashlib
import json
import tempfile
import uuid
import pytest
import asyncssh
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.command_adapter import SCENE_GUID_FULL, CashboxCommandAdapter
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.adapters.staging_manager import StagingManager
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.configuration import AdConfiguration
from src.models.credential import SSHAuthType, SSHCredential
from src.models.deployment import Deployment, DeploymentStatus, DeploymentStep, StepStatus
from src.models.media import AdMode, MediaAsset
from src.services.config_service import AdConfigurationService
from src.services.deployment_service import DeploymentOrchestrator
from src.services.playlist_service import PlaylistService
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_full_static_deployment_17_steps_happy_path(
    async_db_session: AsyncSession,
    sample_jpeg_1024x768: bytes,
):
    """Verify that all 17 steps execute sequentially and transition deployment to SUCCESS."""
    with tempfile.TemporaryDirectory() as local_storage_dir, tempfile.TemporaryDirectory() as mock_cashbox_root:
        # 1. Setup local storage & central media asset
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)
        sha256 = hashlib.sha256(sample_jpeg_1024x768).hexdigest()
        storage_path = await storage.save(sample_jpeg_1024x768, "summer_promo.jpg")

        media = MediaAsset(
            id=uuid.uuid4(),
            filename="summer_promo.jpg",
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

        # 2. Setup static playlist and configuration
        pl_svc = PlaylistService()
        config_svc = AdConfigurationService()

        playlist = await pl_svc.create_static_playlist(
            async_db_session, "Full Static Playlist", media.id, ad_mode=AdMode.FULL
        )
        config = await config_svc.create_configuration(
            async_db_session, "Full Static Config v1", full_playlist_id=playlist.id
        )
        assert config.version == 1

        # 3. Setup cashbox & credentials
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

        # 4. Create deployment record
        dep = Deployment(
            id=uuid.uuid4(),
            cashbox_id=cb.id,
            configuration_id=config.id,
            target_version=1,
            status=DeploymentStatus.PENDING.value,
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        # 5. Mock Cashbox SSH Server setup
        target_scene_json = json.dumps(
            {"type": "image", "width": 1024, "height": 768, "src": "media/uploads/summer_promo.jpg"}
        )

        custom_responses = {
            "Get-ChildItem": (0, "[]\r\n", ""),  # Cashbox starts empty
            "Get-FileHash": (0, f"{sha256}\r\n", ""),  # Returns valid SHA
            "Move-Item": (0, "", ""),
            "SELECT Raw FROM scenes": (0, f"{target_scene_json}\r\n", ""),  # Scene readback
            "UPDATE scenes SET Raw": (0, "", ""),
            "sync_version.txt": (0, "", ""),
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

                # Execute 17-step deployment
                completed_dep = await orchestrator.execute_deployment(
                    async_db_session,
                    dep.id,
                    active_connection=conn,
                )

                assert completed_dep.status == DeploymentStatus.SUCCESS.value
                assert cb.actual_version == 1

                # Verify all 17 steps were recorded
                steps = (
                    await async_db_session.scalars(
                        select(DeploymentStep)
                        .where(DeploymentStep.deployment_id == dep.id)
                        .order_by(DeploymentStep.step_number.asc())
                    )
                ).all()

                assert len(steps) == 17
                for s in steps:
                    assert s.status == StepStatus.SUCCESS.value, f"Step {s.step_number} ({s.step_name}) failed: {s.error_message}"

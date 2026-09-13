# -*- coding: utf-8 -*-
"""Integration test for FULL dynamic slideshow 17-step deployment pipeline happy path (T056)."""
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
from src.adapters.scene_serializer import build_gallery_scene
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.adapters.staging_manager import StagingManager
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
async def test_full_dynamic_deployment_17_steps_happy_path(
    async_db_session: AsyncSession,
    sample_jpeg_1024x768: bytes,
):
    """Verify that a 3-banner dynamic slideshow deploys cleanly through all 17 steps."""
    with tempfile.TemporaryDirectory() as local_storage_dir, tempfile.TemporaryDirectory() as mock_cashbox_root:
        # 1. Setup local storage & central media assets (3 distinct banners)
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)

        sha1 = hashlib.sha256(sample_jpeg_1024x768 + b"1").hexdigest()
        sha2 = hashlib.sha256(sample_jpeg_1024x768 + b"2").hexdigest()
        sha3 = hashlib.sha256(sample_jpeg_1024x768 + b"3").hexdigest()

        path1 = await storage.save(sample_jpeg_1024x768 + b"1", "slide1.jpg")
        path2 = await storage.save(sample_jpeg_1024x768 + b"2", "slide2.jpg")
        path3 = await storage.save(sample_jpeg_1024x768 + b"3", "slide3.jpg")

        m1 = MediaAsset(
            id=uuid.uuid4(),
            filename="slide1.jpg",
            storage_path=path1,
            sha256=sha1,
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
            sha256=sha2,
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
            sha256=sha3,
            file_size_bytes=len(sample_jpeg_1024x768) + 1,
            mime_type="image/jpeg",
            width=1024,
            height=768,
            aspect_ratio="4:3",
            ad_mode=AdMode.FULL.value,
        )
        async_db_session.add_all([m1, m2, m3])
        await async_db_session.flush()

        # 2. Setup dynamic slideshow playlist and configuration
        compiler = PlaylistCompiler()
        config_svc = AdConfigurationService()

        specs = [
            SlideSpec(media_id=m1.id, duration_seconds=5),
            SlideSpec(media_id=m2.id, duration_seconds=7),
            SlideSpec(media_id=m3.id, duration_seconds=10),
        ]
        playlist = await compiler.compile_dynamic_playlist(
            async_db_session,
            name="Dynamic 3-Banner Slideshow",
            slide_specs=specs,
            ad_mode=AdMode.FULL,
            default_interval_sec=5,
        )

        config = await config_svc.create_configuration(
            async_db_session, "Dynamic Slideshow Config v1", full_playlist_id=playlist.id
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

        # 5. Expected scene gallery JSON
        expected_gallery_json = build_gallery_scene(
            AdMode.FULL, ["slide1.jpg", "slide2.jpg", "slide3.jpg"], interval_sec=5
        )

        # Mock SSH Server custom responses
        # CertUtil / Get-FileHash should return sha1 for slide1, sha2 for slide2, sha3 for slide3
        def get_file_hash_handler(cmd: str):
            if "slide1.jpg" in cmd:
                return 0, f"{sha1}\r\n", ""
            elif "slide2.jpg" in cmd:
                return 0, f"{sha2}\r\n", ""
            elif "slide3.jpg" in cmd:
                return 0, f"{sha3}\r\n", ""
            return 0, f"{sha1}\r\n", ""

        custom_responses = {
            "Get-ChildItem": (0, "[]\r\n", ""),  # Start with empty uploads
            "Get-FileHash": get_file_hash_handler,
            "Move-Item": (0, "", ""),
            "SELECT Raw FROM scenes": (0, f"{expected_gallery_json}\r\n", ""),
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

                completed_dep = await orchestrator.execute_deployment(
                    async_db_session,
                    dep.id,
                    active_connection=conn,
                )

                assert completed_dep.status == DeploymentStatus.SUCCESS.value
                assert cb.actual_version == 1

                # Verify all 17 steps completed successfully
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

                # Verify step 6 staged 3 files
                step6 = next(s for s in steps if s.step_number == 6)
                assert step6.details.get("staged_count") == 3

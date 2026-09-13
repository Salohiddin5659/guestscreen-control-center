# -*- coding: utf-8 -*-
"""Integration test verifying zero-impact NO_OP idempotency for 50/50 static deployments (T064)."""
import hashlib
import json
import tempfile
import time
import uuid
import pytest
import asyncssh
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.deployment import Deployment, DeploymentStatus
from src.models.media import AdMode, MediaAsset
from src.services.config_service import AdConfigurationService
from src.services.playlist_service import PlaylistService
from src.services.split_deploy_service import SplitDeploymentOrchestrator
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_split_static_idempotent_noop(
    async_db_session: AsyncSession,
    sample_jpeg_512x768: bytes,
):
    """Verify that re-deploying an identical active 50/50 static config resolves instantly as NO_OP."""
    with tempfile.TemporaryDirectory() as local_storage_dir:
        storage = LocalFileSystemStorageProvider(root_dir=local_storage_dir)
        sha256 = hashlib.sha256(sample_jpeg_512x768).hexdigest()
        storage_path = await storage.save(sample_jpeg_512x768, "combo_upsell.jpg")

        media = MediaAsset(
            id=uuid.uuid4(),
            filename="combo_upsell.jpg",
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
            async_db_session, "Split Static Config", split_playlist_id=playlist.id
        )

        cb = Cashbox(
            id=uuid.uuid4(),
            name="Cashbox Synced",
            ip_address="10.0.0.241",
            ssh_port=22,
            status=CashboxStatus.ACTIVE.value,
            desired_version=config.version,
            actual_version=config.version,
        )
        async_db_session.add(cb)

        dep = Deployment(
            id=uuid.uuid4(),
            cashbox_id=cb.id,
            configuration_id=config.id,
            target_version=config.version,
            status=DeploymentStatus.PENDING.value,
            cashbox=cb,
            configuration=config,
        )
        async_db_session.add(dep)
        await async_db_session.commit()

        target_scene_json = json.dumps(
            {"type": "image", "width": 512, "height": 768, "src": "media/uploads/combo_upsell.jpg"}
        )

        update_called = False

        def update_scene_handler(cmd: str):
            nonlocal update_called
            update_called = True
            return 0, "", ""

        inventory_json = json.dumps(
            [
                {
                    "filename": "combo_upsell.jpg",
                    "size": len(sample_jpeg_512x768),
                    "sha256": sha256,
                    "modified_at": "2026-09-10T12:00:00Z",
                }
            ]
        )

        custom_responses = {
            "Get-ChildItem": (0, f"{inventory_json}\r\n", ""),
            "SELECT Raw FROM scenes": (0, f"{target_scene_json}\r\n", ""),
            "UPDATE scenes SET Raw": update_scene_handler,
            "SELECT * FROM": (0, "row1|val\r\n", ""),
            "Get-Process -Name 'GuestScreen'": (0, '{"Id": 2128, "StartTime": "2026-09-09T01:53:45.3888691+05:00", "Path": "C:\\\\UCS\\\\GuestScreen\\\\GuestScreen.exe", "WorkingSet": 45000000, "Threads": 39, "ListeningPorts": [2121], "HasPort2121": true, "HasLibcef": true, "HasCefSharp": true, "WorkingDirectory": "C:\\\\UCS\\\\GuestScreen"}\r\n', ""),
        }

        async with start_mock_cashbox_server(
            username="Administrator",
            password="test_password",
            custom_responses=custom_responses,
        ) as (host, port):
            async with asyncssh.connect(
                host, port=port, username="Administrator", password="test_password", known_hosts=None
            ) as conn:
                orchestrator = SplitDeploymentOrchestrator(storage_provider=storage)

                start_time = time.time()
                result_dep = await orchestrator.execute_deployment(
                    async_db_session,
                    dep.id,
                    active_connection=conn,
                )
                duration = time.time() - start_time

                assert result_dep.status == DeploymentStatus.NO_OP.value
                assert update_called is False, "NO_OP must never issue SQLite UPDATE commands!"
                assert duration < 2.0, f"NO_OP deployment took too long ({duration:.2f}s)"

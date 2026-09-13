# -*- coding: utf-8 -*-
"""Unit tests for SplitDeploymentOrchestrator (T061)."""
from datetime import datetime, timezone
import json
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.command_adapter import SCENE_GUID_SPLIT
from src.core.exceptions import SafetyBoundaryViolationError, ValidationDomainError
from src.models.cashbox import Cashbox
from src.models.configuration import AdConfiguration
from src.models.deployment import Deployment, DeploymentStatus
from src.models.media import AdMode, MediaAsset
from src.models.playlist import Playlist, PlaylistItem
from src.services.split_deploy_service import SplitDeploymentOrchestrator


def make_mock_entities(media_count: int = 1):
    """Helper to create connected mock entities."""
    cashbox = Cashbox(
        id=uuid.uuid4(),
        name="POS-01",
        ip_address="10.0.0.241",
        ssh_port=22,
        actual_version=1,
    )

    playlist = Playlist(
        id=uuid.uuid4(),
        name="Split Playlist",
        ad_mode="SPLIT",
        is_dynamic=False,
    )
    items = []
    for i in range(media_count):
        media = MediaAsset(
            id=uuid.uuid4(),
            filename=f"split_promo_{i}.jpg",
            storage_path=f"media_storage/split_promo_{i}.jpg",
            sha256=f"{i}" * 64,
            file_size_bytes=40000,
            mime_type="image/jpeg",
            width=512,
            height=768,
            aspect_ratio="2:3",
            ad_mode=AdMode.SPLIT.value,
        )
        item = PlaylistItem(
            id=uuid.uuid4(),
            playlist_id=playlist.id,
            media_id=media.id,
            position=i,
            duration_seconds=0,
            media=media,
        )
        items.append(item)
    playlist.items = items

    config = AdConfiguration(
        id=uuid.uuid4(),
        version=2,
        full_playlist=None,
        split_playlist=playlist,
    )

    deployment = Deployment(
        id=uuid.uuid4(),
        cashbox_id=cashbox.id,
        configuration_id=config.id,
        status=DeploymentStatus.PENDING.value,
        cashbox=cashbox,
        configuration=config,
    )
    return cashbox, config, deployment


@pytest.mark.asyncio
async def test_split_deploy_rejects_missing_split_playlist():
    """Verify validation error when configuration has no split_playlist."""
    orchestrator = SplitDeploymentOrchestrator()
    _, config, deployment = make_mock_entities()
    config.split_playlist = None

    mock_db = AsyncMock(spec=AsyncSession)
    with pytest.raises(ValidationDomainError) as exc:
        await orchestrator.execute_deployment(mock_db, deployment)
    assert "active split_playlist" in str(exc.value)


@pytest.mark.asyncio
async def test_split_deploy_rejects_multiple_media_for_static():
    """Verify validation error when split static playlist contains >1 item."""
    orchestrator = SplitDeploymentOrchestrator()
    _, _, deployment = make_mock_entities(media_count=2)

    mock_db = AsyncMock(spec=AsyncSession)
    with pytest.raises(ValidationDomainError) as exc:
        await orchestrator.execute_deployment(mock_db, deployment)
    assert "exactly 1 media asset" in str(exc.value)


@pytest.mark.asyncio
async def test_split_deploy_rejects_missing_central_media():
    """Verify validation fails if media is missing in central storage."""
    mock_storage = AsyncMock()
    mock_storage.exists.return_value = False

    orchestrator = SplitDeploymentOrchestrator(storage_provider=mock_storage)
    _, _, deployment = make_mock_entities(media_count=1)

    mock_db = AsyncMock(spec=AsyncSession)
    with pytest.raises(ValidationDomainError) as exc:
        await orchestrator.execute_deployment(mock_db, deployment)
    assert "missing from central storage" in str(exc.value)


@pytest.mark.asyncio
async def test_split_deploy_happy_path():
    """Verify full end-to-end execution of 50/50 static deployment."""
    mock_storage = AsyncMock()
    mock_storage.exists.return_value = True
    mock_storage.get.return_value = b"FAKE_JPEG"

    mock_cmd = AsyncMock()
    mock_cmd.ping.return_value = True
    mock_cmd.inventory.return_value = []
    mock_cmd.hash_verify.return_value = "0" * 64
    mock_cmd.touch_reload.return_value = None

    mock_sqlite = AsyncMock()
    mock_sqlite.read_scene.return_value = '{"type": "image", "src": "old.jpg"}'
    mock_sqlite.update_scene.return_value = None

    mock_verif = AsyncMock()
    proc_dummy = MagicMock(pid=2128, start_time="2026-09-10T10:00:00Z")
    mock_verif.get_process_baseline.return_value = proc_dummy
    mock_verif.verify_process_stability.return_value = None
    mock_verif.verify_scene_readback.return_value = None

    mock_boundary = AsyncMock()
    mock_boundary.capture_baseline.return_value = {"screens": (2, "hash")}
    mock_boundary.verify_boundary_unmodified.return_value = None

    orchestrator = SplitDeploymentOrchestrator(
        command_adapter=mock_cmd,
        sqlite_adapter=mock_sqlite,
        storage_provider=mock_storage,
        verification_service=mock_verif,
        boundary_validator=mock_boundary,
    )

    _, _, deployment = make_mock_entities(media_count=1)
    mock_db = AsyncMock(spec=AsyncSession)
    mock_conn = AsyncMock()

    mock_sftp = AsyncMock()
    mock_sftp.open = MagicMock()
    mock_sftp_cm = MagicMock()
    mock_sftp_cm.__aenter__ = AsyncMock(return_value=mock_sftp)
    mock_sftp_cm.__aexit__ = AsyncMock(return_value=None)
    mock_conn.start_sftp_client = MagicMock(return_value=mock_sftp_cm)

    res = await orchestrator.execute_deployment(mock_db, deployment, active_connection=mock_conn)

    assert res.status == DeploymentStatus.SUCCESS.value
    assert deployment.cashbox.actual_version == 2
    mock_sqlite.update_scene.assert_awaited()
    # Verify update targeted ONLY SCENE_GUID_SPLIT
    call_args = mock_sqlite.update_scene.call_args[0]
    assert call_args[1] == SCENE_GUID_SPLIT
    mock_boundary.verify_boundary_unmodified.assert_awaited_once()


@pytest.mark.asyncio
async def test_split_deploy_boundary_violation_triggers_rollback():
    """Verify safety boundary violation raises error and rolls back scene."""
    mock_storage = AsyncMock()
    mock_storage.exists.return_value = True
    mock_storage.get.return_value = b"FAKE_JPEG"

    mock_cmd = AsyncMock()
    mock_cmd.ping.return_value = True
    mock_cmd.inventory.return_value = []
    mock_cmd.hash_verify.return_value = "0" * 64

    mock_sqlite = AsyncMock()
    mock_sqlite.read_scene.return_value = '{"type": "image", "src": "old.jpg"}'
    mock_sqlite.update_scene.return_value = None

    mock_verif = AsyncMock()
    proc_dummy = MagicMock(pid=2128, start_time="2026-09-10T10:00:00Z")
    mock_verif.get_process_baseline.return_value = proc_dummy

    mock_boundary = AsyncMock()
    mock_boundary.capture_baseline.return_value = {"screens": (2, "hash")}
    # Boundary violation simulated at Step 12
    mock_boundary.verify_boundary_unmodified.side_effect = SafetyBoundaryViolationError(
        "Screens table modified!"
    )

    orchestrator = SplitDeploymentOrchestrator(
        command_adapter=mock_cmd,
        sqlite_adapter=mock_sqlite,
        storage_provider=mock_storage,
        verification_service=mock_verif,
        boundary_validator=mock_boundary,
    )

    _, _, deployment = make_mock_entities(media_count=1)
    mock_db = AsyncMock(spec=AsyncSession)
    mock_conn = AsyncMock()

    mock_sftp = AsyncMock()
    mock_sftp.open = MagicMock()
    mock_sftp_cm = MagicMock()
    mock_sftp_cm.__aenter__ = AsyncMock(return_value=mock_sftp)
    mock_sftp_cm.__aexit__ = AsyncMock(return_value=None)
    mock_conn.start_sftp_client = MagicMock(return_value=mock_sftp_cm)

    with pytest.raises(SafetyBoundaryViolationError):
        await orchestrator.execute_deployment(mock_db, deployment, active_connection=mock_conn)

    assert deployment.status == DeploymentStatus.FAILED.value
    # Rollback must have called update_scene to restore previous scene
    assert mock_sqlite.update_scene.call_count >= 2
    last_call = mock_sqlite.update_scene.call_args_list[-1][0]
    assert last_call[1] == SCENE_GUID_SPLIT
    assert "old.jpg" in last_call[2]

# -*- coding: utf-8 -*-
"""Integration unit tests for SQLiteSceneAdapter with mock server and safety enforcement (T042)."""
import json
import pytest
import asyncssh

from src.adapters.scene_serializer import build_static_scene
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import SafetyBoundaryViolationError, ValidationDomainError
from src.core.safety_guard import SCENE_GUID_FULL, SCENE_GUID_SPLIT
from src.models.media import AdMode
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_sqlite_adapter_read_and_update_scenes():
    """Verify reading and surgical updating of FULL SCREEN and 50/50 scenes."""
    async with start_mock_cashbox_server(username="admin", password="password") as (host, port):
        async with asyncssh.connect(
            host, port=port, username="admin", password="password", known_hosts=None
        ) as conn:
            adapter = SQLiteSceneAdapter()

            # Read FULL SCREEN scene
            raw_full = await adapter.read_scene(conn, SCENE_GUID_FULL)
            assert "FULL_SCREEN" in raw_full

            # Read 50/50 scene
            raw_split = await adapter.read_scene(conn, SCENE_GUID_SPLIT)
            assert raw_split is not None

            # Update FULL SCREEN scene with valid payload
            new_scene_json = build_static_scene(AdMode.FULL, "summer_2026.jpg")
            await adapter.update_scene(conn, SCENE_GUID_FULL, new_scene_json)

            # Update 50/50 scene with valid payload
            new_split_json = build_static_scene(AdMode.SPLIT, "combo_2026.jpg")
            await adapter.update_scene(conn, SCENE_GUID_SPLIT, new_split_json)


@pytest.mark.asyncio
async def test_sqlite_adapter_blocks_non_ad_guids():
    """Verify that targeting arbitrary GUIDs is blocked before dispatch."""
    adapter = SQLiteSceneAdapter()
    conn = None  # type: ignore

    arbitrary_guid = "11111111-2222-3333-4444-555555555555"

    with pytest.raises(SafetyBoundaryViolationError):
        await adapter.read_scene(conn, arbitrary_guid)

    with pytest.raises(SafetyBoundaryViolationError):
        await adapter.update_scene(conn, arbitrary_guid, '{"type": "image", "width": 1024, "height": 768}')


@pytest.mark.asyncio
async def test_sqlite_adapter_blocks_invalid_json():
    """Verify that invalid scene schema is blocked before dispatch."""
    adapter = SQLiteSceneAdapter()
    conn = None  # type: ignore

    with pytest.raises(ValidationDomainError):
        await adapter.update_scene(conn, SCENE_GUID_FULL, "{malformed json}")

    # Wrong aspect ratio/dimensions
    with pytest.raises(ValidationDomainError):
        await adapter.update_scene(conn, SCENE_GUID_FULL, '{"type": "image", "width": 1920, "height": 1080}')

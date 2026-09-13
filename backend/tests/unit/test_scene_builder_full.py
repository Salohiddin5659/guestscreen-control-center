# -*- coding: utf-8 -*-
"""Unit tests for AdvertisingSceneBuilder dynamic scene building and injection (T055)."""
import json
from unittest.mock import AsyncMock, MagicMock
import uuid
import pytest

from src.adapters.command_adapter import SCENE_GUID_FULL, SCENE_GUID_SPLIT
from src.core.exceptions import ValidationDomainError
from src.services.playlist_compiler import CompiledPlaylist, CompiledSlide
from src.services.scene_builder import AdvertisingSceneBuilder


def _make_compiled_playlist(ad_mode: str = "FULL", interval: int = 5) -> CompiledPlaylist:
    slides = [
        CompiledSlide(
            position=0,
            media_id=uuid.uuid4(),
            filename="slide1.jpg",
            sha256="hash1",
            duration_seconds=5,
        ),
        CompiledSlide(
            position=1,
            media_id=uuid.uuid4(),
            filename="slide2.jpg",
            sha256="hash2",
            duration_seconds=5,
        ),
        CompiledSlide(
            position=2,
            media_id=uuid.uuid4(),
            filename="slide3.jpg",
            sha256="hash3",
            duration_seconds=5,
        ),
    ]
    return CompiledPlaylist(
        playlist_id=uuid.uuid4(),
        name="Test Playlist",
        ad_mode=ad_mode,
        is_dynamic=True,
        default_interval_sec=interval,
        slides=slides,
    )


def test_build_full_dynamic_scene_json():
    """Verify generated JSON matches UCS GuestScreen 3.1.1.0 specifications."""
    builder = AdvertisingSceneBuilder()
    playlist = _make_compiled_playlist(ad_mode="FULL", interval=7)

    raw_json = builder.build_full_dynamic_scene_json(playlist)
    parsed = json.loads(raw_json)

    assert parsed["type"] == "gallery"
    assert parsed["width"] == 1024
    assert parsed["height"] == 768
    assert parsed["interval"] == 7000
    assert len(parsed["items"]) == 3
    assert parsed["items"][0]["src"] == "media/uploads/slide1.jpg"
    assert parsed["items"][1]["src"] == "media/uploads/slide2.jpg"
    assert parsed["items"][2]["src"] == "media/uploads/slide3.jpg"


def test_build_full_dynamic_scene_empty_raises():
    """Verify building scene with empty slides raises ValidationDomainError."""
    builder = AdvertisingSceneBuilder()
    empty_playlist = CompiledPlaylist(
        playlist_id=uuid.uuid4(),
        name="Empty",
        ad_mode="FULL",
        is_dynamic=True,
        default_interval_sec=5,
        slides=[],
    )
    with pytest.raises(ValidationDomainError):
        builder.build_full_dynamic_scene_json(empty_playlist)


@pytest.mark.asyncio
async def test_inject_full_dynamic_scene():
    """Verify inject_full_dynamic_scene sends surgical UPDATE to SCENE_GUID_FULL."""
    mock_sqlite = MagicMock()
    mock_sqlite.update_scene = AsyncMock()

    builder = AdvertisingSceneBuilder(sqlite_adapter=mock_sqlite)
    playlist = _make_compiled_playlist(ad_mode="FULL", interval=5)
    mock_conn = MagicMock()

    scene_json = await builder.inject_full_dynamic_scene(mock_conn, playlist)

    mock_sqlite.update_scene.assert_called_once_with(
        mock_conn,
        SCENE_GUID_FULL,
        scene_json,
    )
    assert "media/uploads/slide1.jpg" in scene_json

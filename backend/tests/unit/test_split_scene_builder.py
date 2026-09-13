# -*- coding: utf-8 -*-
"""Unit tests for 50/50 Static promo scene builder and SQLite injector (T060)."""
import json
import uuid
from unittest.mock import AsyncMock

import pytest

from src.adapters.command_adapter import SCENE_GUID_SPLIT
from src.core.exceptions import ValidationDomainError
from src.models.media import AdMode, MediaAsset
from src.services.split_scene_builder import SplitStaticSceneBuilder


def make_media_asset(
    filename: str = "upsell_512x768.jpg",
    width: int = 512,
    height: int = 768,
    ad_mode: str = AdMode.SPLIT.value,
) -> MediaAsset:
    """Helper to instantiate MediaAsset entity for testing."""
    asset = MediaAsset(
        filename=filename,
        storage_path=f"media_storage/{filename}",
        sha256="e" * 64,
        file_size_bytes=50000,
        mime_type="image/jpeg",
        width=width,
        height=height,
        aspect_ratio="2:3",
        ad_mode=ad_mode,
    )
    asset.id = uuid.uuid4()
    return asset


def test_build_split_static_scene_valid():
    """Verify valid 512x768 media generates compliant 50/50 scene JSON."""
    builder = SplitStaticSceneBuilder()
    asset = make_media_asset()
    scene_json = builder.build_split_static_scene_json(asset)

    data = json.loads(scene_json)
    assert data["type"] == "image"
    assert data["width"] == 512
    assert data["height"] == 768
    assert data["src"] == "media/uploads/upsell_512x768.jpg"


def test_build_split_static_scene_invalid_dimensions_raises():
    """Verify non-512x768 resolutions raise ValidationDomainError."""
    builder = SplitStaticSceneBuilder()

    # 1024x768 is FULL, not SPLIT
    asset_1024 = make_media_asset(width=1024, height=768)
    with pytest.raises(ValidationDomainError) as exc:
        builder.build_split_static_scene_json(asset_1024)
    assert "512x768" in str(exc.value)

    # Irregular resolution
    asset_bad = make_media_asset(width=500, height=768)
    with pytest.raises(ValidationDomainError):
        builder.build_split_static_scene_json(asset_bad)


def test_build_split_static_scene_incompatible_ad_mode_raises():
    """Verify ad_mode=FULL raises ValidationDomainError for 50/50 promo block."""
    builder = SplitStaticSceneBuilder()
    asset = make_media_asset(ad_mode=AdMode.FULL.value)
    with pytest.raises(ValidationDomainError) as exc:
        builder.build_split_static_scene_json(asset)
    assert "cannot be used for 50/50 SPLIT layout" in str(exc.value)


def test_build_split_static_scene_both_mode_allowed():
    """Verify ad_mode=BOTH with 512x768 is permitted."""
    builder = SplitStaticSceneBuilder()
    asset = make_media_asset(ad_mode=AdMode.BOTH.value)
    scene_json = builder.build_split_static_scene_json(asset)
    data = json.loads(scene_json)
    assert data["width"] == 512


@pytest.mark.asyncio
async def test_inject_split_static_scene_targets_split_guid():
    """Verify surgical injection updates exactly SCENE_GUID_SPLIT."""
    mock_sqlite = AsyncMock()
    mock_sqlite.update_scene = AsyncMock()
    builder = SplitStaticSceneBuilder(sqlite_adapter=mock_sqlite)

    mock_conn = AsyncMock()
    asset = make_media_asset()
    scene_json = await builder.inject_split_static_scene(mock_conn, asset)

    mock_sqlite.update_scene.assert_awaited_once_with(
        mock_conn,
        SCENE_GUID_SPLIT,
        scene_json,
    )
    assert SCENE_GUID_SPLIT == "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"

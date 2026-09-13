# -*- coding: utf-8 -*-
"""Contract tests for FULL dynamic slideshow API schemas and reordering endpoints (T052)."""
from typing import List, Optional
import uuid
import pytest
from pydantic import BaseModel, Field, field_validator


class PlaylistItemContract(BaseModel):
    media_asset_id: str
    sort_order: int
    duration_sec: Optional[int] = Field(default=5, ge=1, le=300)


class CreateDynamicPlaylistRequest(BaseModel):
    name: str
    display_type: str = Field(pattern="^(FULL_SCREEN|SPLIT_50_50)$")
    default_interval_sec: int = Field(default=5, ge=1, le=300)
    items: List[PlaylistItemContract]

    @field_validator("items")
    @classmethod
    def validate_items_non_empty(cls, v: List[PlaylistItemContract]) -> List[PlaylistItemContract]:
        if not v:
            raise ValueError("Dynamic playlist requires at least one media item.")
        return v


class ReorderPlaylistItemsRequest(BaseModel):
    item_ids: List[str]

    @field_validator("item_ids")
    @classmethod
    def validate_unique_items(cls, v: List[str]) -> List[str]:
        if len(v) != len(set(v)):
            raise ValueError("Duplicate item IDs in reorder request.")
        return v


class CreateDynamicConfigurationRequest(BaseModel):
    name: str
    mode: str = Field(pattern="^(FULL_SCREEN|SPLIT_50_50)$")
    content_type: str = Field(pattern="^(STATIC|DYNAMIC)$")
    playlist_id: str


def test_full_dynamic_playlist_contract_valid():
    """Verify schema compliance for creating a 3-banner dynamic playlist with 5s intervals."""
    payload = {
        "name": "Summer Promo Dynamic Slideshow",
        "display_type": "FULL_SCREEN",
        "default_interval_sec": 5,
        "items": [
            {"media_asset_id": str(uuid.uuid4()), "sort_order": 0, "duration_sec": 5},
            {"media_asset_id": str(uuid.uuid4()), "sort_order": 1, "duration_sec": 7},
            {"media_asset_id": str(uuid.uuid4()), "sort_order": 2, "duration_sec": 10},
        ],
    }
    req = CreateDynamicPlaylistRequest.model_validate(payload)
    assert req.name == "Summer Promo Dynamic Slideshow"
    assert req.display_type == "FULL_SCREEN"
    assert req.default_interval_sec == 5
    assert len(req.items) == 3
    assert req.items[1].duration_sec == 7


def test_full_dynamic_playlist_empty_items_rejected():
    """Verify schema rejects empty items for dynamic playlists."""
    payload = {
        "name": "Empty Dynamic Playlist",
        "display_type": "FULL_SCREEN",
        "default_interval_sec": 5,
        "items": [],
    }
    with pytest.raises(ValueError):
        CreateDynamicPlaylistRequest.model_validate(payload)


def test_full_dynamic_playlist_invalid_interval_rejected():
    """Verify schema rejects out-of-range interval durations."""
    payload = {
        "name": "Invalid Interval Playlist",
        "display_type": "FULL_SCREEN",
        "default_interval_sec": 0,  # Below minimum 1
        "items": [{"media_asset_id": str(uuid.uuid4()), "sort_order": 0, "duration_sec": 5}],
    }
    with pytest.raises(ValueError):
        CreateDynamicPlaylistRequest.model_validate(payload)


def test_reorder_playlist_items_contract():
    """Verify schema compliance for reordering playlist items."""
    item_1 = str(uuid.uuid4())
    item_2 = str(uuid.uuid4())
    item_3 = str(uuid.uuid4())

    payload = {
        "item_ids": [item_3, item_1, item_2],
    }
    req = ReorderPlaylistItemsRequest.model_validate(payload)
    assert req.item_ids == [item_3, item_1, item_2]


def test_reorder_playlist_items_rejects_duplicates():
    """Verify reorder schema rejects duplicate item IDs."""
    item_1 = str(uuid.uuid4())
    payload = {
        "item_ids": [item_1, item_1],
    }
    with pytest.raises(ValueError):
        ReorderPlaylistItemsRequest.model_validate(payload)


def test_dynamic_configuration_contract():
    """Verify schema compliance for dynamic configuration assignment."""
    payload = {
        "name": "Summer 2026 Dynamic Campaign",
        "mode": "FULL_SCREEN",
        "content_type": "DYNAMIC",
        "playlist_id": str(uuid.uuid4()),
    }
    req = CreateDynamicConfigurationRequest.model_validate(payload)
    assert req.mode == "FULL_SCREEN"
    assert req.content_type == "DYNAMIC"
    assert req.playlist_id is not None

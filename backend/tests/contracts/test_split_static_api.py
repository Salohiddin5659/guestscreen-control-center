# -*- coding: utf-8 -*-
"""Contract tests for 50/50 static promo configuration and deployment API schemas (T059)."""
import uuid
import pytest
from typing import Optional, List
from pydantic import BaseModel, Field, ValidationError

# Contract models matching contracts/api.yaml
class PlaylistItemSchema(BaseModel):
    media_asset_id: str
    sort_order: int = 0
    duration_sec: int = 0


class CreatePlaylistRequest(BaseModel):
    name: str
    display_type: str = Field(pattern="^(FULL_SCREEN|SPLIT_50_50)$")
    default_interval_sec: int = 0
    items: List[PlaylistItemSchema]


class CreateConfigurationRequest(BaseModel):
    name: str
    mode: str = Field(pattern="^(FULL_SCREEN|SPLIT_50_50)$")
    content_type: str = Field(pattern="^(STATIC|DYNAMIC)$")
    media_asset_id: Optional[str] = None
    playlist_id: Optional[str] = None


class EnqueueDeploymentRequest(BaseModel):
    cashbox_id: Optional[str] = None
    group_id: Optional[str] = None
    full_configuration_id: Optional[str] = None
    split_configuration_id: Optional[str] = None


def test_split_static_playlist_contract_schema():
    """Verify OpenAPI contract schema compliance for creating 50/50 static promo playlist."""
    payload = {
        "name": "Combo Upsell 50/50 Promo",
        "display_type": "SPLIT_50_50",
        "default_interval_sec": 0,
        "items": [
            {
                "media_asset_id": str(uuid.uuid4()),
                "sort_order": 0,
                "duration_sec": 0,
            }
        ],
    }
    req = CreatePlaylistRequest.model_validate(payload)
    assert req.display_type == "SPLIT_50_50"
    assert len(req.items) == 1
    assert req.items[0].sort_order == 0


def test_split_static_configuration_contract_schema():
    """Verify OpenAPI contract schema compliance for creating 50/50 static ad configuration."""
    media_id = str(uuid.uuid4())
    payload = {
        "name": "Active Order 50/50 Static Banner",
        "mode": "SPLIT_50_50",
        "content_type": "STATIC",
        "media_asset_id": media_id,
    }
    req = CreateConfigurationRequest.model_validate(payload)
    assert req.mode == "SPLIT_50_50"
    assert req.content_type == "STATIC"
    assert req.media_asset_id == media_id
    assert req.playlist_id is None


def test_enqueue_split_deployment_contract_schema():
    """Verify OpenAPI contract schema compliance for enqueuing 50/50 deployment."""
    cb_id = str(uuid.uuid4())
    split_cfg_id = str(uuid.uuid4())
    payload = {
        "cashbox_id": cb_id,
        "split_configuration_id": split_cfg_id,
    }
    req = EnqueueDeploymentRequest.model_validate(payload)
    assert req.cashbox_id == cb_id
    assert req.split_configuration_id == split_cfg_id
    assert req.full_configuration_id is None


def test_split_static_schema_validation_rejects_invalid_modes():
    """Verify schema rejects invalid display_type and mode values."""
    with pytest.raises(ValidationError):
        CreatePlaylistRequest.model_validate({
            "name": "Invalid Promo",
            "display_type": "INVALID_DISPLAY",
            "items": [],
        })

    with pytest.raises(ValidationError):
        CreateConfigurationRequest.model_validate({
            "name": "Invalid Config",
            "mode": "SPLIT_INVALID",
            "content_type": "STATIC",
        })

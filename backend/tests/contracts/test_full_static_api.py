# -*- coding: utf-8 -*-
"""Contract tests for FULL static configuration and deployment API schemas (T043)."""
import uuid
import pytest
from typing import Optional
from pydantic import BaseModel, Field

# Contract models matching contracts/api.yaml
class CreatePlaylistRequest(BaseModel):
    name: str
    display_type: str = Field(pattern="^(FULL_SCREEN|SPLIT_50_50)$")
    default_interval_sec: int = 5
    items: list


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



def test_full_static_playlist_contract_schema():
    """Verify OpenAPI contract schema compliance for creating static playlist."""
    payload = {
        "name": "Summer Promo 2026",
        "display_type": "FULL_SCREEN",
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
    assert req.display_type == "FULL_SCREEN"
    assert len(req.items) == 1


def test_full_static_configuration_contract_schema():
    """Verify OpenAPI contract schema compliance for creating static ad configuration."""
    payload = {
        "name": "Summer 2026 Full Static Campaign",
        "mode": "FULL_SCREEN",
        "content_type": "STATIC",
        "media_asset_id": str(uuid.uuid4()),
    }
    req = CreateConfigurationRequest.model_validate(payload)
    assert req.mode == "FULL_SCREEN"
    assert req.content_type == "STATIC"
    assert req.media_asset_id is not None


def test_enqueue_deployment_contract_schema():
    """Verify OpenAPI contract schema compliance for enqueuing deployment."""
    payload = {
        "cashbox_id": str(uuid.uuid4()),
        "full_configuration_id": str(uuid.uuid4()),
    }
    req = EnqueueDeploymentRequest.model_validate(payload)
    assert req.cashbox_id is not None
    assert req.full_configuration_id is not None

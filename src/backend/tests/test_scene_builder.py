import json
import pytest
from uuid import uuid4
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.domain.scene_builder import (
    build_guest_screen_scene,
    GUID_FULLSCREEN_SCENE,
    GUID_MODE32_PROMO_SCENE
)


def test_fullscreen_static_uses_fullscreen_scene():
    block = AdvertisingBlock(name="FS Static", area="FULL_SCREEN", display_mode="STATIC")
    media = MediaAsset(id=uuid4(), original_name="banner.jpg", stored_name="banner_123.jpg", sha256="123", mime_type="image/jpeg", media_type="IMAGE", s3_key="uploads/banner_123.jpg")
    items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=media.id, order_index=0)]
    media_map = {str(media.id): media}

    scene = build_guest_screen_scene(block, items, media_map)
    assert scene.scene_guid == GUID_FULLSCREEN_SCENE
    assert scene.scene_guid == "2509359c-2d71-4344-9be4-7d90dd453083"
    assert scene.media_filenames == ["banner_123.jpg"]

    data = json.loads(scene.raw_json)
    assert data["type"] == "image"
    assert data["src"] == "media/uploads/banner_123.jpg"
    assert data["width"] == 1024
    assert data["height"] == 768


def test_fullscreen_slideshow_uses_fullscreen_scene():
    block = AdvertisingBlock(name="FS Slideshow", area="FULL_SCREEN", display_mode="SLIDESHOW")
    m1 = MediaAsset(id=uuid4(), original_name="fs1.jpg", stored_name="fs1.jpg", sha256="s1", mime_type="image/jpeg", media_type="IMAGE", s3_key="1")
    m2 = MediaAsset(id=uuid4(), original_name="fs2.jpg", stored_name="fs2.jpg", sha256="s2", mime_type="image/jpeg", media_type="IMAGE", s3_key="2")
    items = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m1.id, order_index=0, duration_seconds=7),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m2.id, order_index=1, duration_seconds=7),
    ]
    media_map = {str(m1.id): m1, str(m2.id): m2}

    scene = build_guest_screen_scene(block, items, media_map)
    # Must strictly use FULL_SCREEN scene GUID (2509359c...), NEVER 68906ed2...
    assert scene.scene_guid == GUID_FULLSCREEN_SCENE
    assert scene.scene_guid == "2509359c-2d71-4344-9be4-7d90dd453083"
    assert scene.scene_guid != GUID_MODE32_PROMO_SCENE
    assert scene.media_filenames == ["fs1.jpg", "fs2.jpg"]

    data = json.loads(scene.raw_json)
    assert data["type"] == "gallery"
    assert data["width"] == 1024
    assert data["height"] == 768
    assert len(data["slides"]) == 2
    assert data["params"]["interval"] == "7"


def test_mode32_static_uses_mode32_scene():
    block = AdvertisingBlock(name="Mode32 Static", area="MODE32_PROMO", display_mode="STATIC")
    media = MediaAsset(id=uuid4(), original_name="m32_banner.jpg", stored_name="m32_banner.jpg", sha256="m32", mime_type="image/jpeg", media_type="IMAGE", s3_key="uploads/m32_banner.jpg")
    items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=media.id, order_index=0)]
    media_map = {str(media.id): media}

    scene = build_guest_screen_scene(block, items, media_map)
    # Must strictly use MODE32_PROMO scene GUID (68906ed2...), NEVER fad6349b...
    assert scene.scene_guid == GUID_MODE32_PROMO_SCENE
    assert scene.scene_guid == "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"
    assert scene.scene_guid != "fad6349b-3aaa-43e2-82c7-ba12abfc1463"
    assert scene.scene_guid != GUID_FULLSCREEN_SCENE
    assert scene.media_filenames == ["m32_banner.jpg"]

    data = json.loads(scene.raw_json)
    assert data["type"] == "image"
    assert data["src"] == "media/uploads/m32_banner.jpg"
    assert data["width"] == 512
    assert data["height"] == 768


def test_mode32_slideshow_uses_mode32_scene():
    block = AdvertisingBlock(name="Mode32 Slideshow", area="MODE32_PROMO", display_mode="SLIDESHOW")
    m1 = MediaAsset(id=uuid4(), original_name="s1.jpg", stored_name="s1.jpg", sha256="s1", mime_type="image/jpeg", media_type="IMAGE", s3_key="1")
    m2 = MediaAsset(id=uuid4(), original_name="s2.jpg", stored_name="s2.jpg", sha256="s2", mime_type="image/jpeg", media_type="IMAGE", s3_key="2")
    items = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m1.id, order_index=0, duration_seconds=5),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m2.id, order_index=1, duration_seconds=10),
    ]
    media_map = {str(m1.id): m1, str(m2.id): m2}

    scene = build_guest_screen_scene(block, items, media_map)
    assert scene.scene_guid == GUID_MODE32_PROMO_SCENE
    assert scene.scene_guid == "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"
    assert scene.scene_guid != GUID_FULLSCREEN_SCENE
    assert scene.media_filenames == ["s1.jpg", "s2.jpg"]

    data = json.loads(scene.raw_json)
    assert data["type"] == "gallery"
    assert data["width"] == 512
    assert data["height"] == 768
    assert len(data["slides"]) == 2
    assert data["slides"][0]["duration"] == 5
    assert data["slides"][1]["duration"] == 10


def test_video_scene_builder_payload():
    block = AdvertisingBlock(name="FS Video", area="FULL_SCREEN", display_mode="VIDEO")
    media = MediaAsset(id=uuid4(), original_name="clip.mp4", stored_name="clip_abc.mp4", sha256="abc", mime_type="video/mp4", media_type="VIDEO", s3_key="uploads/clip_abc.mp4")
    items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=media.id, order_index=0)]
    media_map = {str(media.id): media}

    scene = build_guest_screen_scene(block, items, media_map)
    assert scene.scene_guid == GUID_FULLSCREEN_SCENE
    assert scene.scene_guid == "2509359c-2d71-4344-9be4-7d90dd453083"
    assert scene.media_filenames == ["clip_abc.mp4"]

    data = json.loads(scene.raw_json)
    assert data["type"] == "video"
    assert data["src"] == "media/uploads/clip_abc.mp4"
    assert data["autoplay"] is True
    assert data["loop"] is True
    assert data["width"] == 1024
    assert data["height"] == 768


@pytest.mark.asyncio
async def test_ssh_adapter_blocks_forbidden_guid():
    from app.adapters.ssh_adapter import ProductionCashRegisterAdapter
    adapter = ProductionCashRegisterAdapter(
        cashier_id=uuid4(),
        host="127.0.0.1",
        port=22
    )
    result = await adapter.update_scene("fad6349b-3aaa-43e2-82c7-ba12abfc1463", '{"type":"image"}')
    assert result.success is False
    assert "forbidden orphan scene GUID" in result.error_message


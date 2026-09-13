import pytest
from uuid import uuid4
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.domain.content_validator import validate_advertising_block, ValidationError


def test_fullscreen_static_valid():
    block = AdvertisingBlock(name="Test Static", area="FULL_SCREEN", display_mode="STATIC")
    media = MediaAsset(id=uuid4(), original_name="test.jpg", stored_name="hash.jpg", sha256="abc", mime_type="image/jpeg", media_type="IMAGE", s3_key="uploads/hash.jpg")
    items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=media.id, order_index=0)]
    media_map = {str(media.id): media}

    # Should not raise
    validate_advertising_block(block, items, media_map)


def test_fullscreen_static_multiple_items_fails():
    block = AdvertisingBlock(name="Test Static", area="FULL_SCREEN", display_mode="STATIC")
    m1 = MediaAsset(id=uuid4(), original_name="1.jpg", stored_name="1.jpg", sha256="1", mime_type="image/jpeg", media_type="IMAGE", s3_key="1")
    m2 = MediaAsset(id=uuid4(), original_name="2.jpg", stored_name="2.jpg", sha256="2", mime_type="image/jpeg", media_type="IMAGE", s3_key="2")
    items = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m1.id, order_index=0),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m2.id, order_index=1),
    ]
    media_map = {str(m1.id): m1, str(m2.id): m2}

    with pytest.raises(ValidationError, match="ровно 1 медиа-элемент"):
        validate_advertising_block(block, items, media_map)


def test_slideshow_single_item_fails():
    block = AdvertisingBlock(name="Test Slideshow", area="FULL_SCREEN", display_mode="SLIDESHOW")
    m1 = MediaAsset(id=uuid4(), original_name="1.jpg", stored_name="1.jpg", sha256="1", mime_type="image/jpeg", media_type="IMAGE", s3_key="1")
    items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=m1.id, order_index=0, duration_seconds=5)]
    media_map = {str(m1.id): m1}

    with pytest.raises(ValidationError, match="как минимум 2 слайда"):
        validate_advertising_block(block, items, media_map)


def test_slideshow_mixed_video_fails_in_v1():
    block = AdvertisingBlock(name="Test Slideshow", area="FULL_SCREEN", display_mode="SLIDESHOW")
    m1 = MediaAsset(id=uuid4(), original_name="1.jpg", stored_name="1.jpg", sha256="1", mime_type="image/jpeg", media_type="IMAGE", s3_key="1")
    m2 = MediaAsset(id=uuid4(), original_name="2.mp4", stored_name="2.mp4", sha256="2", mime_type="video/mp4", media_type="VIDEO", s3_key="2")
    items = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m1.id, order_index=0, duration_seconds=5),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=m2.id, order_index=1, duration_seconds=5),
    ]
    media_map = {str(m1.id): m1, str(m2.id): m2}

    with pytest.raises(ValidationError, match="исключительно изображения"):
        validate_advertising_block(block, items, media_map)

import pytest
from uuid import uuid4
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.domain.content_validator import validate_advertising_block, ValidationError


def get_test_session_factory():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def test_validator_static_mode():
    block = AdvertisingBlock(name="Static Test", area="FULL_SCREEN", display_mode="STATIC")
    img_asset = MediaAsset(original_name="img.jpg", stored_name="a.jpg", sha256="a", mime_type="image/jpeg", media_type="IMAGE", s3_key="media/a.jpg")
    vid_asset = MediaAsset(original_name="vid.mp4", stored_name="b.mp4", sha256="b", mime_type="video/mp4", media_type="VIDEO", s3_key="media/b.mp4")
    
    media_map = {str(img_asset.id): img_asset, str(vid_asset.id): vid_asset}

    # Valid: 1 image
    valid_items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=img_asset.id, order_index=0)]
    validate_advertising_block(block, valid_items, media_map)

    # Invalid: 2 images in static
    with pytest.raises(ValidationError, match="ровно 1 медиа-элемент"):
        validate_advertising_block(block, valid_items + [PlaylistItem(advertising_block_id=block.id, media_asset_id=img_asset.id, order_index=1)], media_map)

    # Invalid: video in static
    with pytest.raises(ValidationError, match="должен быть изображением"):
        validate_advertising_block(block, [PlaylistItem(advertising_block_id=block.id, media_asset_id=vid_asset.id, order_index=0)], media_map)


def test_validator_slideshow_mode_and_duration_limits():
    block = AdvertisingBlock(name="Slide Test", area="FULL_SCREEN", display_mode="SLIDESHOW")
    img1 = MediaAsset(original_name="1.jpg", stored_name="1.jpg", sha256="1", mime_type="image/jpeg", media_type="IMAGE", s3_key="media/1.jpg")
    img2 = MediaAsset(original_name="2.jpg", stored_name="2.jpg", sha256="2", mime_type="image/jpeg", media_type="IMAGE", s3_key="media/2.jpg")
    vid = MediaAsset(original_name="v.mp4", stored_name="v.mp4", sha256="v", mime_type="video/mp4", media_type="VIDEO", s3_key="media/v.mp4")
    
    media_map = {str(img1.id): img1, str(img2.id): img2, str(vid.id): vid}

    # Valid: 2 images, 5s duration each
    valid_items = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=img1.id, order_index=0, duration_seconds=5),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=img2.id, order_index=1, duration_seconds=10),
    ]
    validate_advertising_block(block, valid_items, media_map)

    # Invalid: <2 slides
    with pytest.raises(ValidationError, match="как минимум 2 слайда"):
        validate_advertising_block(block, [valid_items[0]], media_map)

    # Invalid: duration < 1s
    invalid_dur = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=img1.id, order_index=0, duration_seconds=0),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=img2.id, order_index=1, duration_seconds=5),
    ]
    with pytest.raises(ValidationError, match="от 1 до 60 секунд"):
        validate_advertising_block(block, invalid_dur, media_map)

    # Invalid: mixed video inside slideshow
    mixed_items = [
        PlaylistItem(advertising_block_id=block.id, media_asset_id=img1.id, order_index=0, duration_seconds=5),
        PlaylistItem(advertising_block_id=block.id, media_asset_id=vid.id, order_index=1, duration_seconds=5),
    ]
    with pytest.raises(ValidationError, match="смешивание видео в слайд-шоу запрещено"):
        validate_advertising_block(block, mixed_items, media_map)


@pytest.mark.asyncio
async def test_template_duplication_and_occ():
    factory = get_test_session_factory()
    async with factory() as session:
        # Create media asset
        asset = MediaAsset(
            original_name="promo.jpg",
            stored_name="promo_sha.jpg",
            sha256="promo_sha",
            mime_type="image/jpeg",
            media_type="IMAGE",
            file_size_bytes=5000,
            s3_key="media/promo_sha.jpg",
            version=1
        )
        session.add(asset)
        await session.commit()
        await session.refresh(asset)

        # Create original template
        template = AdvertisingBlock(
            name="Morning Special",
            area="FULL_SCREEN",
            display_mode="STATIC",
            version=1
        )
        session.add(template)
        await session.commit()
        await session.refresh(template)

        item = PlaylistItem(
            advertising_block_id=template.id,
            media_asset_id=asset.id,
            order_index=0,
            duration_seconds=7
        )
        session.add(item)
        await session.commit()

        try:
            # 1. Test OCC version check on update
            assert template.version == 1
            template.name = "Morning Special Updated"
            template.version += 1
            session.add(template)
            await session.commit()
            await session.refresh(template)
            assert template.version == 2

            # 2. Test Clone / Duplication
            clone = AdvertisingBlock(
                name=f"{template.name} (копия)",
                area=template.area,
                display_mode=template.display_mode,
                version=1
            )
            session.add(clone)
            await session.flush()

            clone_item = PlaylistItem(
                advertising_block_id=clone.id,
                media_asset_id=asset.id,
                order_index=0,
                duration_seconds=7
            )
            session.add(clone_item)
            await session.commit()
            await session.refresh(clone)

            assert clone.id != template.id
            assert clone.version == 1
            assert clone.name == "Morning Special Updated (копия)"

            # Verify clone playlist
            clone_items = (await session.exec(
                select(PlaylistItem).where(PlaylistItem.advertising_block_id == clone.id)
            )).all()
            assert len(clone_items) == 1
            assert clone_items[0].media_asset_id == asset.id

            await session.delete(clone_item)
            await session.delete(clone)
            await session.commit()
        finally:
            await session.delete(item)
            await session.delete(template)
            await session.delete(asset)
            await session.commit()

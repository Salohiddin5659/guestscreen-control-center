import pytest
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.models.content import MediaAsset, AdvertisingBlock, PlaylistItem
from app.services.media_gc import get_s3_reference_count


def get_test_session_factory():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_s3_reference_counting():
    factory = get_test_session_factory()
    s3_key = "media/test_shared_hash_123.jpg"
    
    async with factory() as session:
        # Create two assets sharing the same s3_key
        asset1 = MediaAsset(
            original_name="banner_a.jpg",
            stored_name="test_shared_hash_123.jpg",
            sha256="test_shared_hash_123",
            mime_type="image/jpeg",
            media_type="IMAGE",
            file_size_bytes=1000,
            s3_key=s3_key,
            version=1
        )
        asset2 = MediaAsset(
            original_name="banner_b.jpg",
            stored_name="test_shared_hash_123.jpg",
            sha256="test_shared_hash_123",
            mime_type="image/jpeg",
            media_type="IMAGE",
            file_size_bytes=1000,
            s3_key=s3_key,
            version=1
        )
        session.add(asset1)
        session.add(asset2)
        await session.commit()
        await session.refresh(asset1)
        await session.refresh(asset2)

        try:
            # Count total references
            count = await get_s3_reference_count(session, s3_key)
            assert count >= 2

            # Count excluding asset1
            count_excl = await get_s3_reference_count(session, s3_key, exclude_asset_id=asset1.id)
            assert count_excl >= 1

            # Soft delete asset2
            asset2.is_deleted = True
            session.add(asset2)
            await session.commit()

            # Now excluding asset1, active count is 0
            count_after_del = await get_s3_reference_count(session, s3_key, exclude_asset_id=asset1.id)
            assert count_after_del == 0
        finally:
            # Cleanup
            await session.delete(asset1)
            await session.delete(asset2)
            await session.commit()


@pytest.mark.asyncio
async def test_media_safe_delete_dependency_block():
    factory = get_test_session_factory()
    async with factory() as session:
        # Create media asset
        asset = MediaAsset(
            original_name="food.jpg",
            stored_name="food_hash_456.jpg",
            sha256="food_hash_456",
            mime_type="image/jpeg",
            media_type="IMAGE",
            file_size_bytes=2000,
            s3_key="media/food_hash_456.jpg",
            version=1
        )
        session.add(asset)
        await session.commit()
        await session.refresh(asset)

        # Create template and playlist item referencing the asset
        template = AdvertisingBlock(
            name="Lunch Promo",
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
            # Query active template dependencies
            query = (
                select(AdvertisingBlock)
                .join(PlaylistItem, PlaylistItem.advertising_block_id == AdvertisingBlock.id)
                .where(PlaylistItem.media_asset_id == asset.id)
                .distinct()
            )
            referencing = (await session.exec(query)).all()
            assert len(referencing) == 1
            assert referencing[0].name == "Lunch Promo"
        finally:
            await session.delete(item)
            await session.delete(template)
            await session.delete(asset)
            await session.commit()


@pytest.mark.asyncio
async def test_media_occ_version_increment():
    factory = get_test_session_factory()
    async with factory() as session:
        asset = MediaAsset(
            original_name="original_title.jpg",
            stored_name="title_hash_789.jpg",
            sha256="title_hash_789",
            mime_type="image/jpeg",
            media_type="IMAGE",
            file_size_bytes=1500,
            s3_key="media/title_hash_789.jpg",
            version=1
        )
        session.add(asset)
        await session.commit()
        await session.refresh(asset)

        try:
            # Simulate OCC version check
            client_version = 1
            assert asset.version == client_version

            # Successful update
            asset.original_name = "renamed_title.jpg"
            asset.version += 1
            session.add(asset)
            await session.commit()
            await session.refresh(asset)

            assert asset.version == 2
            assert asset.original_name == "renamed_title.jpg"

            # Concurrent user tries with stale version 1 -> conflict
            stale_client_version = 1
            assert asset.version != stale_client_version
        finally:
            await session.delete(asset)
            await session.commit()

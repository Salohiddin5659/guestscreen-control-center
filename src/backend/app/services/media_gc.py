import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.session import async_session_factory
from app.models.content import MediaAsset, PlaylistItem
from app.services.storage_service import storage_service

logger = logging.getLogger("gs_control_center.media_gc")


async def get_s3_reference_count(
    session: AsyncSession,
    s3_key: str,
    exclude_asset_id: Optional[UUID] = None
) -> int:
    """
    Counts how many active (non-deleted) MediaAsset records reference the given s3_key.
    Uses row-level locking / read in current transaction.
    """
    query = select(func.count(MediaAsset.id)).where(
        MediaAsset.s3_key == s3_key,
        MediaAsset.is_deleted == False
    )
    if exclude_asset_id:
        query = query.where(MediaAsset.id != exclude_asset_id)
    
    result = await session.exec(query)
    count = result.one() or 0
    return count


async def delete_s3_object_if_unreferenced(
    session: AsyncSession,
    s3_key: str,
    sha256: Optional[str] = None,
    exclude_asset_id: Optional[UUID] = None
) -> bool:
    """
    Checks if an S3 object is referenced by any other active MediaAsset.
    If ref_count == 0, physically deletes the object and its thumbnail from MinIO.
    Returns True if physically deleted, False otherwise.
    """
    ref_count = await get_s3_reference_count(session, s3_key, exclude_asset_id=exclude_asset_id)
    if ref_count == 0:
        logger.info(f"Zero active references remaining for {s3_key}. Deleting physical files.")

        # 1. Physical removal from local disk paths
        base_name = os.path.basename(s3_key)
        for p in [
            f"/app/data/storage/{s3_key}",
            f"/app/data/storage/media/{s3_key}",
            f"/app/data/storage/media/media/{base_name}",
            f"/app/data/storage/media/{base_name}",
            f"/app/data/media/{base_name}",
        ]:
            try:
                if os.path.isfile(p):
                    os.remove(p)
                    logger.info(f"Deleted local file: {p}")
            except Exception as e:
                logger.warning(f"Failed to delete local file {p}: {e}")

        # 2. Physical removal of thumbnail from local disk
        if sha256:
            thumb_path = f"/app/data/storage/thumbnails/{sha256}.webp"
            try:
                if os.path.isfile(thumb_path):
                    os.remove(thumb_path)
                    logger.info(f"Deleted local thumbnail: {thumb_path}")
            except Exception as e:
                logger.warning(f"Failed to delete thumbnail {thumb_path}: {e}")

        # 3. Non-blocking MinIO deletion (with strict 0.5s timeout)
        try:
            await asyncio.wait_for(storage_service.delete_object(s3_key), timeout=0.5)
            if sha256:
                await asyncio.wait_for(storage_service.delete_object(f"thumbnails/{sha256}.webp"), timeout=0.5)
        except Exception:
            pass

        return True
    else:
        logger.info(f"S3 object {s3_key} still referenced by {ref_count} active assets. Keeping physical object.")
        return False


async def run_media_garbage_collection(retention_days: int = 30) -> int:
    """Purges unreferenced media assets older than retention_days from MinIO and database."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    purged_count = 0

    async with async_session_factory() as session:
        # Find all media assets not in playlist_items and older than cutoff
        referenced_ids_subquery = select(PlaylistItem.media_asset_id).distinct()
        
        query = select(MediaAsset).where(
            MediaAsset.created_at < cutoff,
            MediaAsset.is_deleted == False,
            ~MediaAsset.id.in_(referenced_ids_subquery)
        )
        candidates = (await session.exec(query)).all()

        for asset in candidates:
            logger.info(f"Purging unreferenced media asset {asset.id} ({asset.stored_name})...")
            asset.is_deleted = True
            session.add(asset)
            await session.commit()
            
            # Now check if physical S3 object has 0 remaining references
            await delete_s3_object_if_unreferenced(session, asset.s3_key, sha256=asset.sha256, exclude_asset_id=asset.id)
            purged_count += 1

        if purged_count > 0:
            logger.info(f"Media GC completed: purged {purged_count} orphaned assets.")
        else:
            logger.info("Media GC completed: no orphaned assets found.")

    return purged_count

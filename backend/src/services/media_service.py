# -*- coding: utf-8 -*-
"""Central media asset service managing uploads, SHA-256 deduplication, and cataloging."""
import hashlib
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.media_storage import StorageProvider
from src.models.media import AdMode, MediaAsset
from src.services.media_validator import validate_image_binary


class MediaService:
    """Orchestrates image ingestion, hashing, deduplication, and storage."""

    def __init__(self, storage_provider: Optional[StorageProvider] = None) -> None:
        self.storage = storage_provider or LocalFileSystemStorageProvider()

    @staticmethod
    def compute_sha256(file_bytes: bytes) -> str:
        """Calculate SHA-256 hexadecimal digest from raw bytes."""
        hasher = hashlib.sha256()
        chunk_size = 64 * 1024
        for i in range(0, len(file_bytes), chunk_size):
            hasher.update(file_bytes[i : i + chunk_size])
        return hasher.hexdigest()

    async def upload_media(
        self,
        session: AsyncSession,
        file_bytes: bytes,
        filename: str,
        ad_mode: str = "FULL",
    ) -> Tuple[MediaAsset, bool]:
        """Ingest, validate, deduplicate, and persist an advertising image.

        Args:
            session: Active database session.
            file_bytes: Raw binary content.
            filename: Original uploaded filename.
            ad_mode: Mode ('FULL' or 'SPLIT').

        Returns:
            Tuple of (MediaAsset, is_duplicate: bool).
        """
        # 1. Validate magic bytes, headers, and dimensions
        validated = validate_image_binary(file_bytes, filename, ad_mode)

        # 2. Compute SHA-256 hash
        sha256_digest = self.compute_sha256(file_bytes)

        # 3. Check for existing asset with identical SHA-256 (Deduplication)
        stmt = select(MediaAsset).where(MediaAsset.sha256 == sha256_digest)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing is not None:
            return existing, True

        # 4. Save to physical storage
        storage_path = await self.storage.save(file_bytes, validated.sanitized_filename)

        # 5. Persist new record in PostgreSQL
        asset = MediaAsset(
            filename=validated.sanitized_filename,
            storage_path=storage_path,
            sha256=sha256_digest,
            file_size_bytes=len(file_bytes),
            mime_type=validated.mime_type,
            width=validated.width,
            height=validated.height,
            aspect_ratio=validated.aspect_ratio,
            ad_mode=ad_mode.upper(),
        )
        session.add(asset)
        await session.flush()

        return asset, False

    async def get_media_by_id(
        self, session: AsyncSession, media_id: uuid.UUID
    ) -> Optional[MediaAsset]:
        """Query media asset by primary key."""
        stmt = select(MediaAsset).where(MediaAsset.id == media_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_media_by_sha256(
        self, session: AsyncSession, sha256: str
    ) -> Optional[MediaAsset]:
        """Query media asset by SHA-256 hash."""
        stmt = select(MediaAsset).where(MediaAsset.sha256 == sha256)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_media(
        self, session: AsyncSession, ad_mode: Optional[str] = None
    ) -> List[MediaAsset]:
        """List all media assets, optionally filtered by ad_mode."""
        stmt = select(MediaAsset).order_by(MediaAsset.created_at.desc())
        if ad_mode:
            stmt = stmt.where(MediaAsset.ad_mode == ad_mode.upper())
        result = await session.execute(stmt)
        return list(result.scalars().all())

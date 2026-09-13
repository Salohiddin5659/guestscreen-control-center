# -*- coding: utf-8 -*-
"""Playlist domain service managing static banners and dynamic slideshow collections (T044)."""
import uuid
from typing import List, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import EntityNotFoundError, ValidationDomainError
from src.models.media import AdMode, MediaAsset
from src.models.playlist import Playlist, PlaylistItem


class PlaylistService:
    """Manages static single-banner playlists and dynamic rotating slideshows."""

    async def create_static_playlist(
        self,
        db: AsyncSession,
        name: str,
        media_id: uuid.UUID,
        ad_mode: AdMode | str = AdMode.FULL,
    ) -> Playlist:
        """Create a static single-banner playlist referencing a verified MediaAsset."""
        name = name.strip()
        clean_mode = ad_mode.value if isinstance(ad_mode, AdMode) else str(ad_mode).upper()
        if clean_mode not in (AdMode.FULL.value, AdMode.SPLIT.value):
            raise ValidationDomainError(f"Unsupported ad_mode: '{ad_mode}'")

        # Verify MediaAsset exists and matches mode dimensions
        media = await db.get(MediaAsset, media_id)
        if not media:
            raise EntityNotFoundError(f"MediaAsset with ID '{media_id}' not found.")

        expected_width = 1024 if clean_mode == AdMode.FULL.value else 512
        if media.width != expected_width or media.height != 768:
            raise ValidationDomainError(
                f"MediaAsset dimensions ({media.width}x{media.height}) incompatible with mode {clean_mode} "
                f"(expected {expected_width}x768)."
            )

        playlist = Playlist(
            id=uuid.uuid4(),
            name=name,
            ad_mode=clean_mode,
            is_dynamic=False,
            default_interval_sec=0,
        )
        db.add(playlist)

        item = PlaylistItem(
            id=uuid.uuid4(),
            playlist_id=playlist.id,
            media_id=media.id,
            position=0,
            duration_seconds=0,
        )
        db.add(item)

        await db.flush()
        return playlist

    async def create_dynamic_playlist(
        self,
        db: AsyncSession,
        name: str,
        media_ids: List[uuid.UUID],
        ad_mode: AdMode | str = AdMode.FULL,
        default_interval_sec: int = 5,
    ) -> Playlist:
        """Create a dynamic rotating slideshow playlist."""
        name = name.strip()
        if not media_ids:
            raise ValidationDomainError("Dynamic playlist requires at least one media asset.")
        if default_interval_sec < 1 or default_interval_sec > 300:
            raise ValidationDomainError(
                f"Invalid default_interval_sec: {default_interval_sec}. Must be between 1 and 300."
            )

        clean_mode = ad_mode.value if isinstance(ad_mode, AdMode) else str(ad_mode).upper()
        expected_width = 1024 if clean_mode == AdMode.FULL.value else 512

        # Validate all media assets
        for mid in media_ids:
            media = await db.get(MediaAsset, mid)
            if not media:
                raise EntityNotFoundError(f"MediaAsset with ID '{mid}' not found.")
            if media.width != expected_width or media.height != 768:
                raise ValidationDomainError(
                    f"MediaAsset '{media.filename}' ({media.width}x{media.height}) incompatible with {clean_mode} mode."
                )

        playlist = Playlist(
            id=uuid.uuid4(),
            name=name,
            ad_mode=clean_mode,
            is_dynamic=True,
            default_interval_sec=default_interval_sec,
        )
        db.add(playlist)

        for idx, mid in enumerate(media_ids):
            item = PlaylistItem(
                id=uuid.uuid4(),
                playlist_id=playlist.id,
                media_id=mid,
                position=idx,
                duration_seconds=default_interval_sec,
            )
            db.add(item)

        await db.flush()
        return playlist

    async def get_playlist(
        self,
        db: AsyncSession,
        playlist_id: uuid.UUID,
        load_items: bool = True,
    ) -> Playlist:
        """Retrieve playlist by ID with optional eager loading of items and media."""
        query = select(Playlist).where(Playlist.id == playlist_id)
        if load_items:
            query = query.options(
                selectinload(Playlist.items).selectinload(PlaylistItem.media)
            )
        result = await db.scalar(query)
        if not result:
            raise EntityNotFoundError(f"Playlist with ID '{playlist_id}' not found.")
        return result

    async def list_playlists(
        self,
        db: AsyncSession,
        ad_mode: Optional[str] = None,
        load_items: bool = False,
    ) -> Sequence[Playlist]:
        """List playlists with optional ad_mode filter."""
        query = select(Playlist)
        if load_items:
            query = query.options(
                selectinload(Playlist.items).selectinload(PlaylistItem.media)
            )
        if ad_mode:
            clean_mode = ad_mode.upper()
            query = query.where(Playlist.ad_mode == clean_mode)
        query = query.order_by(Playlist.name.asc())
        result = await db.scalars(query)
        return result.all()

    async def delete_playlist(self, db: AsyncSession, playlist_id: uuid.UUID) -> bool:
        """Delete playlist by ID."""
        playlist = await self.get_playlist(db, playlist_id, load_items=False)
        await db.delete(playlist)
        await db.flush()
        return True

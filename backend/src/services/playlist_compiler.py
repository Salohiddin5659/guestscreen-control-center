# -*- coding: utf-8 -*-
"""Dynamic slideshow playlist compiler with ordering and interval management (T053)."""
from dataclasses import dataclass
from typing import List, Optional, Sequence
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import EntityNotFoundError, ValidationDomainError
from src.models.media import AdMode, MediaAsset
from src.models.playlist import Playlist, PlaylistItem


@dataclass(frozen=True)
class SlideSpec:
    """Specification for an individual slide in a dynamic slideshow."""
    media_id: uuid.UUID
    duration_seconds: Optional[int] = None


@dataclass(frozen=True)
class CompiledSlide:
    """Immutable compiled representation of a single slide."""
    position: int
    media_id: uuid.UUID
    filename: str
    sha256: str
    duration_seconds: int


@dataclass(frozen=True)
class CompiledPlaylist:
    """Compiled playlist structure ready for scene generation and staging."""
    playlist_id: uuid.UUID
    name: str
    ad_mode: str
    is_dynamic: bool
    default_interval_sec: int
    slides: List[CompiledSlide]


class PlaylistCompiler:
    """Compiles, validates, and reorders dynamic slideshow playlists with individual durations."""

    MIN_DURATION_SEC: int = 1
    MAX_DURATION_SEC: int = 300
    DEFAULT_INTERVAL_SEC: int = 5

    @classmethod
    def validate_duration(cls, duration: int) -> int:
        """Ensure slide interval duration stays within safe retail boundaries (1s to 300s)."""
        if duration < cls.MIN_DURATION_SEC or duration > cls.MAX_DURATION_SEC:
            raise ValidationDomainError(
                f"Invalid slide duration {duration}s. Must be between "
                f"{cls.MIN_DURATION_SEC} and {cls.MAX_DURATION_SEC} seconds."
            )
        return duration

    async def compile_dynamic_playlist(
        self,
        db: AsyncSession,
        name: str,
        slide_specs: Sequence[SlideSpec],
        ad_mode: AdMode | str = AdMode.FULL,
        default_interval_sec: int = DEFAULT_INTERVAL_SEC,
    ) -> Playlist:
        """Create a dynamic playlist with customized per-slide durations and sequential ordering."""
        clean_name = name.strip()
        if not clean_name:
            raise ValidationDomainError("Playlist name cannot be empty.")
        if not slide_specs:
            raise ValidationDomainError("Dynamic playlist requires at least one slide.")

        self.validate_duration(default_interval_sec)

        clean_mode = ad_mode.value if isinstance(ad_mode, AdMode) else str(ad_mode).upper()
        if clean_mode not in (AdMode.FULL.value, AdMode.SPLIT.value):
            raise ValidationDomainError(f"Unsupported ad_mode: '{ad_mode}'")

        expected_width = 1024 if clean_mode == AdMode.FULL.value else 512

        # Validate all referenced media assets
        for spec in slide_specs:
            media = await db.get(MediaAsset, spec.media_id)
            if not media:
                raise EntityNotFoundError(f"MediaAsset with ID '{spec.media_id}' not found.")
            if media.width != expected_width or media.height != 768:
                raise ValidationDomainError(
                    f"MediaAsset '{media.filename}' ({media.width}x{media.height}) incompatible "
                    f"with {clean_mode} mode (expected {expected_width}x768)."
                )
            if spec.duration_seconds is not None:
                self.validate_duration(spec.duration_seconds)

        playlist = Playlist(
            id=uuid.uuid4(),
            name=clean_name,
            ad_mode=clean_mode,
            is_dynamic=True,
            default_interval_sec=default_interval_sec,
        )
        db.add(playlist)

        for idx, spec in enumerate(slide_specs):
            duration = spec.duration_seconds if spec.duration_seconds is not None else default_interval_sec
            item = PlaylistItem(
                id=uuid.uuid4(),
                playlist_id=playlist.id,
                media_id=spec.media_id,
                position=idx,
                duration_seconds=duration,
            )
            db.add(item)

        await db.flush()
        return playlist

    async def reorder_playlist_items(
        self,
        db: AsyncSession,
        playlist_id: uuid.UUID,
        ordered_item_ids: Sequence[uuid.UUID],
    ) -> Sequence[PlaylistItem]:
        """Atomically reorder items in a playlist to match the given ID sequence."""
        if len(ordered_item_ids) != len(set(ordered_item_ids)):
            raise ValidationDomainError("Duplicate item IDs in reorder request.")

        # Fetch all existing items for this playlist
        query = (
            select(PlaylistItem)
            .where(PlaylistItem.playlist_id == playlist_id)
            .order_by(PlaylistItem.position.asc())
        )
        existing_items = (await db.scalars(query)).all()
        existing_by_id = {item.id: item for item in existing_items}

        if len(ordered_item_ids) != len(existing_by_id):
            raise ValidationDomainError(
                f"Reorder list count ({len(ordered_item_ids)}) does not match playlist item count ({len(existing_by_id)})."
            )

        for item_id in ordered_item_ids:
            if item_id not in existing_by_id:
                raise ValidationDomainError(f"Item '{item_id}' does not belong to playlist '{playlist_id}'.")

        # Phase 1: Set temporary negative positions to prevent unique constraint collision
        for idx, item_id in enumerate(ordered_item_ids):
            existing_by_id[item_id].position = -(idx + 1000)
        await db.flush()

        # Phase 2: Set final sequential positions
        for new_pos, item_id in enumerate(ordered_item_ids):
            existing_by_id[item_id].position = new_pos
        await db.flush()

        # Return updated ordered items
        reloaded = (await db.scalars(query)).all()
        return reloaded

    async def update_item_duration(
        self,
        db: AsyncSession,
        item_id: uuid.UUID,
        duration_seconds: int,
    ) -> PlaylistItem:
        """Update presentation duration for an individual slide."""
        self.validate_duration(duration_seconds)
        item = await db.get(PlaylistItem, item_id)
        if not item:
            raise EntityNotFoundError(f"PlaylistItem with ID '{item_id}' not found.")
        item.duration_seconds = duration_seconds
        await db.flush()
        return item

    async def compile_for_deployment(
        self,
        db: AsyncSession,
        playlist_id: uuid.UUID,
    ) -> CompiledPlaylist:
        """Compile verified playlist structure ready for scene generation and staging."""
        query = (
            select(Playlist)
            .where(Playlist.id == playlist_id)
            .options(
                selectinload(Playlist.items)
                .selectinload(PlaylistItem.media)
            )
        )
        playlist = await db.scalar(query)
        if not playlist:
            raise EntityNotFoundError(f"Playlist with ID '{playlist_id}' not found.")

        # Sort items strictly by position
        sorted_items = sorted(playlist.items, key=lambda it: it.position)

        compiled_slides = [
            CompiledSlide(
                position=it.position,
                media_id=it.media_id,
                filename=it.media.filename,
                sha256=it.media.sha256,
                duration_seconds=it.duration_seconds or playlist.default_interval_sec,
            )
            for it in sorted_items
        ]

        return CompiledPlaylist(
            playlist_id=playlist.id,
            name=playlist.name,
            ad_mode=playlist.ad_mode,
            is_dynamic=playlist.is_dynamic,
            default_interval_sec=playlist.default_interval_sec,
            slides=compiled_slides,
        )

# -*- coding: utf-8 -*-
"""Playlist and PlaylistItem domain models."""
import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.media import MediaAsset


class Playlist(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Reusable advertising playlist for either FULL SCREEN or 50/50 promo mode."""
    __tablename__ = "playlists"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    ad_mode: Mapped[str] = mapped_column(String(20), nullable=False)  # FULL or SPLIT
    is_dynamic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_interval_sec: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    items: Mapped[List["PlaylistItem"]] = relationship(
        "PlaylistItem",
        back_populates="playlist",
        cascade="all, delete-orphan",
        order_by="PlaylistItem.position",
    )


class PlaylistItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Ordered item within a playlist with slide duration."""
    __tablename__ = "playlist_items"
    __table_args__ = (
        UniqueConstraint("playlist_id", "position", name="uq_playlist_item_position"),
    )

    playlist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    playlist: Mapped[Playlist] = relationship("Playlist", back_populates="items")
    media: Mapped["MediaAsset"] = relationship("MediaAsset", back_populates="playlist_items")

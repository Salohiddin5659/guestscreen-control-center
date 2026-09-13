# -*- coding: utf-8 -*-
"""Central media asset entity model with SHA-256 deduplication and dimensions."""
import enum
from typing import TYPE_CHECKING, List
from sqlalchemy import BigInteger, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.playlist import PlaylistItem


class AdMode(str, enum.Enum):
    """Supported advertising screen mode."""
    FULL = "FULL"    # 1024x768 standby advertising
    SPLIT = "SPLIT"  # 512x768 promo banner during active order
    BOTH = "BOTH"    # Usable in either layout


class MediaAsset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Centrally uploaded and deduplicated advertising media asset."""
    __tablename__ = "media_assets"

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    aspect_ratio: Mapped[str] = mapped_column(String(20), nullable=False)
    ad_mode: Mapped[str] = mapped_column(String(20), default=AdMode.FULL.value, nullable=False)

    playlist_items: Mapped[List["PlaylistItem"]] = relationship("PlaylistItem", back_populates="media")

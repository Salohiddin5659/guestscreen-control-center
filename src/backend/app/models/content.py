from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, UniqueConstraint


class MediaAsset(SQLModel, table=True):
    __tablename__ = "media_assets"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    original_name: str = Field(max_length=255)
    stored_name: str = Field(index=True, max_length=100)  # <sha256>.<ext>
    sha256: str = Field(index=True, max_length=64)
    mime_type: str = Field(max_length=100)
    media_type: str = Field(max_length=20)  # IMAGE, VIDEO
    file_size_bytes: int = Field(default=0)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)
    s3_bucket: str = Field(default="media", max_length=100)
    s3_key: str = Field(max_length=255)
    uploaded_by_user_id: Optional[UUID] = Field(default=None, foreign_key="users.id", nullable=True)
    version: int = Field(default=1, nullable=False)
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    playlist_items: List["PlaylistItem"] = Relationship(back_populates="media_asset")


class AdvertisingBlock(SQLModel, table=True):
    __tablename__ = "advertising_blocks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=150)
    description: Optional[str] = Field(default=None)
    area: str = Field(index=True, max_length=30)          # FULL_SCREEN, MODE32_PROMO
    display_mode: str = Field(index=True, max_length=30)  # STATIC, SLIDESHOW, VIDEO
    is_active: bool = Field(default=True)
    version: int = Field(default=1, nullable=False)
    valid_from: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    valid_to: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    created_by_user_id: Optional[UUID] = Field(default=None, foreign_key="users.id", nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    playlist_items: List["PlaylistItem"] = Relationship(
        back_populates="advertising_block",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "PlaylistItem.order_index"}
    )


class PlaylistItem(SQLModel, table=True):
    __tablename__ = "playlist_items"
    __table_args__ = (
        UniqueConstraint("advertising_block_id", "order_index", name="uq_block_order"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    advertising_block_id: UUID = Field(foreign_key="advertising_blocks.id", index=True)
    media_asset_id: UUID = Field(foreign_key="media_assets.id", index=True)
    order_index: int = Field(default=0)
    duration_seconds: int = Field(default=7)  # Display duration in seconds
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    advertising_block: Optional[AdvertisingBlock] = Relationship(back_populates="playlist_items")
    media_asset: Optional[MediaAsset] = Relationship(back_populates="playlist_items")

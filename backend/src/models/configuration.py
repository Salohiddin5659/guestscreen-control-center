# -*- coding: utf-8 -*-
"""AdConfiguration and ConfigurationAssignment domain models."""
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.playlist import Playlist
    from src.models.cashbox import Cashbox, CashboxGroup, Location
    from src.models.deployment import Deployment


class AdConfiguration(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Versioned combination of FULL SCREEN and 50/50 playlists."""
    __tablename__ = "ad_configurations"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    full_playlist_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("playlists.id", ondelete="SET NULL"), nullable=True
    )
    split_playlist_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("playlists.id", ondelete="SET NULL"), nullable=True
    )

    full_playlist: Mapped[Optional["Playlist"]] = relationship(
        "Playlist", foreign_keys=[full_playlist_id]
    )
    split_playlist: Mapped[Optional["Playlist"]] = relationship(
        "Playlist", foreign_keys=[split_playlist_id]
    )

    assignments: Mapped[List["ConfigurationAssignment"]] = relationship(
        "ConfigurationAssignment", back_populates="configuration", cascade="all, delete-orphan"
    )
    deployments: Mapped[List["Deployment"]] = relationship(
        "Deployment", back_populates="configuration"
    )


class ConfigurationAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Binds an AdConfiguration to a specific Cashbox, Group, or Location."""
    __tablename__ = "configuration_assignments"

    configuration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ad_configurations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cashbox_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cashboxes.id", ondelete="CASCADE"), nullable=True, index=True
    )
    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cashbox_groups.id", ondelete="CASCADE"), nullable=True, index=True
    )
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("locations.id", ondelete="CASCADE"), nullable=True, index=True
    )

    configuration: Mapped[AdConfiguration] = relationship("AdConfiguration", back_populates="assignments")
    cashbox: Mapped[Optional["Cashbox"]] = relationship("Cashbox")
    group: Mapped[Optional["CashboxGroup"]] = relationship("CashboxGroup")
    location: Mapped[Optional["Location"]] = relationship("Location")

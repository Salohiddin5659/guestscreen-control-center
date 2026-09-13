# -*- coding: utf-8 -*-
"""Cashbox inventory and actual state domain model."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.cashbox import Cashbox


class CashboxInventory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Latest audited physical state of files, scenes, and hashes on a cashier monoblock."""
    __tablename__ = "cashbox_inventory"

    cashbox_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cashboxes.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    gs_db_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    sync_version_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Actual scene documents read from gs.db
    full_scene_raw: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    split_scene_raw: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # JSON lists: [{filename, sha256, size_bytes, modified_at}]
    media_files: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, default=list)
    unexpected_files: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, default=list)

    audited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cashbox: Mapped["Cashbox"] = relationship("Cashbox", back_populates="inventory")

# -*- coding: utf-8 -*-
"""Location, CashboxGroup, and Cashbox fleet domain models."""
import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.credential import SSHCredential
    from src.models.inventory import CashboxInventory
    from src.models.deployment import Deployment


class CashboxStatus(str, enum.Enum):
    """Lifecycle and reachability statuses for cashbox monoblocks."""
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"
    UNREACHABLE = "UNREACHABLE"


class Location(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Geographical or restaurant location (city, district, branch)."""
    __tablename__ = "locations"

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    cashboxes: Mapped[List["Cashbox"]] = relationship("Cashbox", back_populates="location")


class CashboxGroup(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Logical grouping of cashboxes for rollout campaigns (e.g. Drive-Thru, Bar)."""
    __tablename__ = "cashbox_groups"

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    cashboxes: Mapped[List["Cashbox"]] = relationship("Cashbox", back_populates="group")


class Cashbox(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Individual cashier monoblock running UCS GuestScreen."""
    __tablename__ = "cashboxes"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), unique=True, index=True, nullable=False)
    ssh_port: Mapped[int] = mapped_column(Integer, default=22, nullable=False)

    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cashbox_groups.id", ondelete="SET NULL"), nullable=True, index=True
    )
    credential_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ssh_credentials.id", ondelete="SET NULL"), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30), default=CashboxStatus.ACTIVE.value, nullable=False, index=True
    )
    screen_resolution: Mapped[str] = mapped_column(String(20), default="1024x768", nullable=False)
    gs_version: Mapped[str] = mapped_column(String(20), default="3.1.1.0", nullable=False)

    desired_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actual_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    last_inventory_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_deployment_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    location: Mapped[Optional[Location]] = relationship("Location", back_populates="cashboxes")
    group: Mapped[Optional[CashboxGroup]] = relationship("CashboxGroup", back_populates="cashboxes")
    credential: Mapped[Optional["SSHCredential"]] = relationship("SSHCredential", back_populates="cashboxes")
    inventory: Mapped[Optional["CashboxInventory"]] = relationship("CashboxInventory", back_populates="cashbox", uselist=False)
    deployments: Mapped[List["Deployment"]] = relationship("Deployment", back_populates="cashbox")

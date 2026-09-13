# -*- coding: utf-8 -*-
"""Deployment pipeline execution, step tracking, and rollback snapshot models."""
import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.cashbox import Cashbox
    from src.models.configuration import AdConfiguration


class DeploymentStatus(str, enum.Enum):
    """Authoritative deployment lifecycle states."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    VERIFYING = "VERIFYING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    ROLLING_BACK = "ROLLING_BACK"
    ROLLED_BACK = "ROLLED_BACK"
    CANCELLED = "CANCELLED"
    FAILED_MANUAL_INTERVENTION = "FAILED_MANUAL_INTERVENTION"
    NO_OP = "NO_OP"


class StepStatus(str, enum.Enum):
    """Execution status for individual deployment pipeline steps."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class Deployment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Record of a 17-step deployment execution to a specific cashbox."""
    __tablename__ = "deployments"
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'RUNNING', 'VERIFYING', 'SUCCESS', 'FAILED', "
            "'ROLLING_BACK', 'ROLLED_BACK', 'CANCELLED', 'FAILED_MANUAL_INTERVENTION', 'NO_OP')",
            name="ck_deployment_status",
        ),
    )

    cashbox_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cashboxes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    configuration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ad_configurations.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    target_version: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default=DeploymentStatus.PENDING.value, nullable=False, index=True
    )
    current_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_rollback: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    cashbox: Mapped["Cashbox"] = relationship("Cashbox", back_populates="deployments")
    configuration: Mapped["AdConfiguration"] = relationship("AdConfiguration", back_populates="deployments")
    steps: Mapped[List["DeploymentStep"]] = relationship(
        "DeploymentStep", back_populates="deployment", cascade="all, delete-orphan", order_by="DeploymentStep.step_number"
    )
    rollback_snapshot: Mapped[Optional["RollbackSnapshot"]] = relationship(
        "RollbackSnapshot", back_populates="deployment", uselist=False, cascade="all, delete-orphan"
    )


class DeploymentStep(Base, UUIDPrimaryKeyMixin):
    """Detailed progress and diagnostic log for each of the 17 deployment steps."""
    __tablename__ = "deployment_steps"
    __table_args__ = (
        UniqueConstraint("deployment_id", "step_number", name="uq_deployment_step_number"),
    )

    deployment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    step_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=StepStatus.PENDING.value, nullable=False
    )

    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    deployment: Mapped[Deployment] = relationship("Deployment", back_populates="steps")


class RollbackSnapshot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Saved JSON state of cashbox advertising scenes captured prior to update."""
    __tablename__ = "rollback_snapshots"

    deployment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deployments.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    previous_version: Mapped[int] = mapped_column(Integer, nullable=False)
    previous_full_scene: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    previous_split_scene: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    deployment: Mapped[Deployment] = relationship("Deployment", back_populates="rollback_snapshot")

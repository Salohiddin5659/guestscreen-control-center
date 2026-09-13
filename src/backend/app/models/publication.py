from datetime import datetime, timezone
from typing import Optional, List, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, JSON, Text, UniqueConstraint


class PublicationBatch(SQLModel, table=True):
    __tablename__ = "publication_batches"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    advertising_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", index=True, nullable=True)
    content_snapshot_json: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON, nullable=True))
    scope_type: str = Field(max_length=20)  # REGION, BRANCH, CUSTOM_CASHIERS
    scope_target_ids: List[str] = Field(default=[], sa_column=Column(JSON, nullable=False))
    status: str = Field(default="PENDING", index=True, max_length=30)  # PENDING, RUNNING, SUCCESS, PARTIAL, FAILED, CANCELLED
    total_cashiers: int = Field(default=0)
    success_count: int = Field(default=0)
    awaiting_restart_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    offline_count: int = Field(default=0)
    initiated_by_user_id: Optional[UUID] = Field(default=None, foreign_key="users.id", nullable=True)
    scheduled_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    started_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    finished_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    jobs: List["PublicationJob"] = Relationship(
        back_populates="batch",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class PublicationJob(SQLModel, table=True):
    __tablename__ = "publication_jobs"
    __table_args__ = (
        UniqueConstraint("batch_id", "cashier_id", name="uq_batch_cashier"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    batch_id: UUID = Field(foreign_key="publication_batches.id", index=True)
    cashier_id: UUID = Field(foreign_key="cashiers.id", index=True)
    advertising_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    status: str = Field(default="PENDING", index=True, max_length=30)  # PENDING, RUNNING, SUCCESS, PUBLISHED_AWAITING_RESTART, FAILED, OFFLINE
    idempotency_key: str = Field(index=True, max_length=128)
    current_attempt: int = Field(default=0)
    max_attempts: int = Field(default=3)
    started_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    finished_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    batch: Optional[PublicationBatch] = Relationship(back_populates="jobs")
    attempts: List["JobAttempt"] = Relationship(
        back_populates="job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class JobAttempt(SQLModel, table=True):
    __tablename__ = "job_attempts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    job_id: UUID = Field(foreign_key="publication_jobs.id", index=True)
    attempt_number: int = Field(default=1)
    status: str = Field(max_length=30)
    previous_scene_raw: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    remote_backup_path: Optional[str] = Field(default=None, max_length=255)
    execution_log: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    duration_ms: Optional[int] = Field(default=None)
    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    finished_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )

    job: Optional[PublicationJob] = Relationship(back_populates="attempts")

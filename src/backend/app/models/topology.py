from datetime import datetime, time, timezone
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, LargeBinary


class Region(SQLModel, table=True):
    __tablename__ = "regions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=100)
    code: str = Field(unique=True, index=True, max_length=50)
    default_full_screen_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    default_mode32_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class Branch(SQLModel, table=True):
    __tablename__ = "branches"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    region_id: UUID = Field(foreign_key="regions.id", index=True)
    name: str = Field(max_length=150)
    code: str = Field(unique=True, index=True, max_length=50)
    override_full_screen_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    override_mode32_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    address: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class Cashier(SQLModel, table=True):
    __tablename__ = "cashiers"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    branch_id: UUID = Field(foreign_key="branches.id", index=True)
    name: str = Field(max_length=100)
    ip_address: str = Field(unique=True, index=True, max_length=45)
    ssh_port: int = Field(default=22)
    ssh_credential_id: Optional[UUID] = Field(default=None, foreign_key="ssh_credentials.id", nullable=True)
    ssh_password_encrypted: Optional[bytes] = Field(
        default=None,
        sa_column=Column(LargeBinary, nullable=True)
    )
    enabled: bool = Field(default=True)
    override_full_screen_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    override_mode32_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    current_full_screen_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    current_mode32_block_id: Optional[UUID] = Field(default=None, foreign_key="advertising_blocks.id", nullable=True)
    current_content_version: Optional[str] = Field(default=None, max_length=64)
    last_seen_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    last_sync_status: str = Field(default="UNKNOWN", index=True, max_length=30)  # SUCCESS, PUBLISHED_AWAITING_RESTART, FAILED, OFFLINE, UNKNOWN
    guest_screen_version: Optional[str] = Field(default=None, max_length=20)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class MaintenanceWindow(SQLModel, table=True):
    __tablename__ = "maintenance_windows"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    branch_id: UUID = Field(foreign_key="branches.id", unique=True)
    timezone: str = Field(default="Asia/Tashkent", max_length=50)
    start_time: time = Field(default=time(2, 0))  # 02:00
    end_time: time = Field(default=time(5, 0))    # 05:00
    enabled: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

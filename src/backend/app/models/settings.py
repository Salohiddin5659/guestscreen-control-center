from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime


class SystemSettings(SQLModel, table=True):
    __tablename__ = "system_settings"

    id: int = Field(default=1, primary_key=True)
    worker_concurrency: int = Field(default=3)
    max_concurrent_per_branch: int = Field(default=2)
    ssh_connect_timeout_seconds: int = Field(default=10)
    ssh_command_timeout_seconds: int = Field(default=45)
    sftp_timeout_seconds: int = Field(default=60)
    minio_media_retention_days: int = Field(default=30)
    cashier_backup_retention_days: int = Field(default=7)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

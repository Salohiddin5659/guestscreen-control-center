from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON, BigInteger, DateTime


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    user_id: Optional[UUID] = Field(default=None, foreign_key="users.id", nullable=True, index=True)
    action: str = Field(index=True, max_length=100)
    entity_type: str = Field(index=True, max_length=50)
    entity_id: Optional[str] = Field(default=None, max_length=64)
    payload_diff: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON, nullable=True))
    ip_address: Optional[str] = Field(default=None, max_length=45)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True)
    )

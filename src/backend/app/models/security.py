from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, LargeBinary, DateTime


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=100)
    password_hash: str = Field(max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=150)
    role: str = Field(default="OPERATOR", max_length=20)  # ADMINISTRATOR, OPERATOR, AUDITOR
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class SSHCredential(SQLModel, table=True):
    __tablename__ = "ssh_credentials"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=100)
    auth_type: str = Field(default="CORPORATE_KEY", max_length=20)
    username: str = Field(max_length=100)
    encrypted_secret: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary, nullable=True))
    key_fingerprint: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

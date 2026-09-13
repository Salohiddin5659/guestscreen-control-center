# -*- coding: utf-8 -*-
"""SQLAlchemy 2.x DeclarativeBase and common mixins."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(AsyncAttrs, DeclarativeBase):
    """Root declarative base class for all PostgreSQL domain models."""
    pass


class UUIDPrimaryKeyMixin:
    """Standardized UUID primary key mixin using PostgreSQL gen_random_uuid()."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )


class TimestampMixin:
    """UTC timestamp tracking mixin with automated onupdate."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

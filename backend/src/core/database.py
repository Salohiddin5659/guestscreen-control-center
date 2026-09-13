# -*- coding: utf-8 -*-
"""Async SQLAlchemy 2.x engine, session management, and transaction helpers."""
from collections.abc import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from src.core.config import get_settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Retrieve or initialize global async SQLAlchemy engine."""
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.async_database_url,
            pool_size=settings.POSTGRES_POOL_SIZE,
            max_overflow=settings.POSTGRES_MAX_OVERFLOW,
            echo=(settings.LOG_LEVEL == "DEBUG"),
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Retrieve or initialize async session factory."""
    global _session_factory
    if _session_factory is None:
        engine = get_engine()
        _session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding transactional database session with auto-rollback."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def try_advisory_lock(session: AsyncSession, lock_key: str) -> bool:
    """Acquire transaction-level PostgreSQL advisory lock by string key.

    Uses hashtext() to generate int64 lock identifier. Returns True if lock acquired.
    Lock automatically releases at transaction end (commit or rollback).
    """
    stmt = text("SELECT pg_try_advisory_xact_lock(hashtext(:key))")
    result = await session.execute(stmt, {"key": lock_key})
    return bool(result.scalar())

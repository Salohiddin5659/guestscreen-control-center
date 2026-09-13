# -*- coding: utf-8 -*-
"""Pytest test infrastructure and shared test fixtures."""
import io
import os
import sys
import pytest
from pathlib import Path

# Ensure backend/src is on sys.path
backend_root = Path(__file__).resolve().parent.parent
src_path = backend_root / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from src.core.config import Settings, get_settings


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Fixture providing isolated test settings."""
    return Settings(
        ENVIRONMENT="test",
        LOG_LEVEL="DEBUG",
        POSTGRES_HOST="localhost",
        POSTGRES_PORT=5432,
        POSTGRES_DB="test_guestscreen_ad_db",
        POSTGRES_USER="test_user",
        POSTGRES_PASSWORD="test_password",
        GS_MASTER_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        MEDIA_STORAGE_PATH="./test_media_storage",
        DEFAULT_CONCURRENCY_LIMIT=4,
        HOT_RELOAD_TIMEOUT_SEC=15,
    )


@pytest.fixture
def sample_jpeg_1024x768() -> bytes:
    """Generate a valid 1024x768 JPEG binary in memory."""
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (1024, 768), color=(255, 128, 0))
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def sample_jpeg_512x768() -> bytes:
    """Generate a valid 512x768 JPEG binary in memory for 50/50 mode."""
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (512, 768), color=(0, 128, 255))
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def sample_png_512x768() -> bytes:
    """Generate a valid 512x768 PNG binary in memory."""
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGBA", (512, 768), color=(0, 200, 100, 255))
    img.save(buf, format="PNG")
    return buf.getvalue()


# Register SQLite compilation overrides for PostgreSQL specific types
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.compiler import compiles


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"


import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from src.models.base import Base


@pytest_asyncio.fixture
async def async_db_session():
    """Provides an isolated async database session with in-memory schema."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        yield session

    await engine.dispose()

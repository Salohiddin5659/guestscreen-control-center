# -*- coding: utf-8 -*-
"""Unit tests for core configuration module."""
import pytest
from pydantic import ValidationError
from src.core.config import Settings


def test_settings_defaults():
    """Verify default parameters adhere to plan.md requirements."""
    settings = Settings(
        POSTGRES_PASSWORD="secret_password",
        GS_MASTER_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )
    assert settings.POSTGRES_HOST == "10.0.0.111"
    assert settings.POSTGRES_PORT == 5432
    assert settings.DEFAULT_CONCURRENCY_LIMIT == 4
    assert settings.HOT_RELOAD_TIMEOUT_SEC == 15
    assert settings.SQLITE_BUSY_TIMEOUT_MS == 10000
    assert "postgresql+asyncpg://" in settings.async_database_url
    assert "postgresql://" in settings.sync_database_url


def test_settings_concurrency_validation():
    """Verify concurrency limit must be at least 1."""
    with pytest.raises(ValidationError):
        Settings(DEFAULT_CONCURRENCY_LIMIT=0)


def test_settings_timeout_validation():
    """Verify hot reload timeout validation."""
    with pytest.raises(ValidationError):
        Settings(HOT_RELOAD_TIMEOUT_SEC=1)  # Below 5s minimum

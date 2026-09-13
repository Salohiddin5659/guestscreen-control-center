# -*- coding: utf-8 -*-
"""Bootstrap test verifying all core libraries and modules import cleanly."""
import pytest


def test_core_library_imports():
    """Verify core third-party dependencies import without version conflicts."""
    import fastapi
    import uvicorn
    import sqlalchemy
    import asyncpg
    import asyncssh
    import pydantic
    import pydantic_settings
    import cryptography
    import alembic
    import PIL
    import httpx

    assert fastapi.__version__ is not None
    assert sqlalchemy.__version__ is not None
    assert pydantic.__version__ is not None


def test_internal_core_modules_import():
    """Verify internal src.core modules import without syntax or import errors."""
    from src.core.config import Settings, get_settings
    from src.core.exceptions import (
        GuestScreenError,
        SafetyBoundaryViolationError,
        UnauthorizedCommandError,
        MasterKeyMissingError,
    )
    from src.core.logging import SecretMaskingFilter, setup_logging, get_logger

    settings = get_settings()
    assert settings.DEFAULT_CONCURRENCY_LIMIT == 4
    assert settings.HOT_RELOAD_TIMEOUT_SEC == 15

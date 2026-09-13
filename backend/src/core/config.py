# -*- coding: utf-8 -*-
"""Core application configuration and settings loaded from environment."""
from functools import lru_cache
from pathlib import Path
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings for UCS GuestScreen Advertising Content Management System."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    ENVIRONMENT: str = Field(default="development", description="Runtime environment")
    LOG_LEVEL: str = Field(default="INFO", description="Standard logging level")

    # Authoritative Persistent Database (PostgreSQL 16)
    POSTGRES_HOST: str = Field(default="10.0.0.111", description="PostgreSQL 16 host")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL 16 port")
    POSTGRES_DB: str = Field(default="guestscreen_ad_db", description="Database name")
    POSTGRES_USER: str = Field(default="gs_admin", description="Database username")
    POSTGRES_PASSWORD: str = Field(default="", description="Database password")
    POSTGRES_POOL_SIZE: int = Field(default=20, description="Connection pool size")
    POSTGRES_MAX_OVERFLOW: int = Field(default=10, description="Max overflow connections")

    # Master Secret Management (CRITICAL: Loaded from env or protected file only)
    GS_MASTER_KEY: Optional[str] = Field(
        default=None,
        description="32-byte hex or base64 master key for credential encryption",
    )
    GS_MASTER_KEY_FILE: Optional[str] = Field(
        default=None,
        description="Path to protected file containing 32-byte master key",
    )

    # JWT Authentication
    JWT_SECRET: str = Field(
        default="replace_this_secret_in_production_min_32_chars_long",
        description="Signing secret for Bearer JWT tokens",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=720, description="Token lifetime in minutes (default: 12 hours)"
    )

    # Media Storage Provider
    MEDIA_STORAGE_PROVIDER: str = Field(
        default="local", description="Storage backend: 'local' (future: 's3')"
    )
    MEDIA_STORAGE_PATH: str = Field(
        default=r"D:\GuestScreen_Media",
        description="Local directory path where media assets are persisted",
    )

    # Cashbox Fleet Operations & Constraints
    DEFAULT_CONCURRENCY_LIMIT: int = Field(
        default=4,
        ge=1,
        le=32,
        description="Default max concurrent deployments to different cashboxes",
    )
    HOT_RELOAD_TIMEOUT_SEC: int = Field(
        default=15,
        ge=5,
        le=60,
        description="Observable timeout for GuestScreen hot reload synchronization",
    )
    SSH_CONNECT_TIMEOUT_SEC: int = Field(
        default=10,
        ge=2,
        le=60,
        description="Timeout for initial SSH handshake to cashier monoblock",
    )
    SQLITE_BUSY_TIMEOUT_MS: int = Field(
        default=10000,
        ge=1000,
        le=30000,
        description="SQLite PRAGMA busy_timeout in milliseconds",
    )

    @property
    def async_database_url(self) -> str:
        """Construct PostgreSQL asyncpg connection URI."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        """Construct PostgreSQL sync connection URI for Alembic migrations."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @field_validator("DEFAULT_CONCURRENCY_LIMIT")
    @classmethod
    def validate_concurrency(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Concurrency limit must be at least 1 cashbox")
        return v


@lru_cache
def get_settings() -> Settings:
    """Retrieve cached application settings instance."""
    return Settings()


settings: Settings = get_settings()


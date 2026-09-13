from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    APP_NAME: str = "GS Control Center"
    PROJECT_NAME: str = "GS Control Center"
    APP_VERSION: str = "1.0.0"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]
    DEBUG: bool = False
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    WEB_PORT: int = 8088

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://gs_admin:gs_secret@postgres_db:5432/gs_control_center",
        description="Async PostgreSQL connection URL"
    )
    POSTGRES_DB: str = "gs_control_center"
    POSTGRES_USER: str = "gs_admin"
    POSTGRES_PASSWORD: str = "gs_secret"

    # Redis & Worker Queue
    REDIS_URL: str = "redis://redis_queue:6379/0"
    WORKER_CONCURRENCY: int = 15
    MAX_CONCURRENT_PER_BRANCH: int = 2
    SSH_CONNECT_TIMEOUT_SECONDS: int = 10
    SSH_COMMAND_TIMEOUT_SECONDS: int = 45
    SFTP_TIMEOUT_SECONDS: int = 60
    SSH_KEEPALIVE_INTERVAL: int = 15

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_PUBLIC_URL: str = "http://10.0.0.111:9000"
    MINIO_ROOT_USER: str = "minio_admin"
    MINIO_ROOT_PASSWORD: str = "minio_secret"
    MINIO_ACCESS_KEY: str = "minio_admin"
    MINIO_SECRET_KEY: str = "minio_secret"
    MINIO_BUCKET_MEDIA: str = "media"
    MINIO_BUCKET_NAME: str = "media"
    MINIO_USE_SSL: bool = False

    # Security
    JWT_SECRET_KEY: str = "insecure_default_secret_please_change_via_env"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    GS_MASTER_KEY: Optional[str] = None
    CREDENTIAL_ENCRYPTION_KEY: str = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
    SSH_MASTER_PRIVATE_KEY_B64: Optional[str] = None
    CASHIER_FALLBACK_PASSWORD: Optional[str] = None

    # Retention & GC
    MINIO_MEDIA_RETENTION_DAYS: int = 30
    CASHIER_BACKUP_RETENTION_DAYS: int = 7

    # Timezone & Defaults
    DEFAULT_TIMEZONE: str = "Asia/Tashkent"
    USE_MOCK_ADAPTER: bool = False
    INITIAL_ADMIN_PASSWORD: str = "Admin@GS2026!"
    SSH_KEEPALIVE_INTERVAL: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

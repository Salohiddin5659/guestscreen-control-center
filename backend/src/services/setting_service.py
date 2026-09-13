# -*- coding: utf-8 -*-
"""Dynamic operational system settings service with PostgreSQL persistence and config fallback."""
from typing import Any, Dict, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings as app_settings
from src.core.exceptions import EntityNotFoundError
from src.models.audit import SystemSetting


class SystemSettingService:
    """Manages runtime system settings stored in PostgreSQL, falling back to core Settings defaults."""

    # Recognized system configuration keys mapped to app_settings attributes
    SETTINGS_FALLBACK_MAP = {
        "DEFAULT_CONCURRENCY_LIMIT": "DEFAULT_CONCURRENCY_LIMIT",
        "HOT_RELOAD_TIMEOUT_SEC": "HOT_RELOAD_TIMEOUT_SEC",
        "CASHBOX_SSH_TIMEOUT_SEC": "SSH_CONNECT_TIMEOUT_SEC",
        "SSH_CONNECT_TIMEOUT_SEC": "SSH_CONNECT_TIMEOUT_SEC",
        "SQLITE_BUSY_TIMEOUT_MS": "SQLITE_BUSY_TIMEOUT_MS",
        "MEDIA_STORAGE_PATH": "MEDIA_STORAGE_PATH",
    }


    async def get_setting(
        self,
        db: AsyncSession,
        key: str,
        default: Any = None,
    ) -> Any:
        """Retrieve dynamic setting from PostgreSQL.

        If not found in PostgreSQL, attempts to fall back to `app_settings` environment default.
        If still not found, returns `default`.
        """
        key = key.strip()
        setting = await db.get(SystemSetting, key)
        if setting is not None:
            raw_val = setting.value
            if isinstance(raw_val, dict) and "value" in raw_val and len(raw_val) == 1:
                return raw_val["value"]
            return raw_val

        # Fallback to app_settings if mapped
        if key in self.SETTINGS_FALLBACK_MAP:
            attr_name = self.SETTINGS_FALLBACK_MAP[key]
            if hasattr(app_settings, attr_name):
                return getattr(app_settings, attr_name)

        return default

    async def set_setting(
        self,
        db: AsyncSession,
        key: str,
        value: Any,
        description: Optional[str] = None,
    ) -> SystemSetting:
        """Store or update a dynamic system setting in PostgreSQL."""
        key = key.strip()
        payload = value if isinstance(value, dict) else {"value": value}

        setting = await db.get(SystemSetting, key)
        if setting:
            setting.value = payload
            if description is not None:
                setting.description = description.strip() if description else None
        else:
            setting = SystemSetting(
                key=key,
                value=payload,
                description=description.strip() if description else None,
            )
            db.add(setting)

        await db.flush()
        return setting

    async def list_settings(self, db: AsyncSession) -> Dict[str, Any]:
        """List all active system settings combining PostgreSQL overrides and defaults."""
        result = await db.scalars(select(SystemSetting).order_by(SystemSetting.key.asc()))
        all_settings: Dict[str, Any] = {}

        # First populate defaults from fallback map
        for key, attr_name in self.SETTINGS_FALLBACK_MAP.items():
            if hasattr(app_settings, attr_name):
                all_settings[key] = getattr(app_settings, attr_name)

        # Then override with values from PostgreSQL
        for s in result.all():
            raw_val = s.value
            if isinstance(raw_val, dict) and "value" in raw_val and len(raw_val) == 1:
                all_settings[s.key] = raw_val["value"]
            else:
                all_settings[s.key] = raw_val

        return all_settings

    async def delete_setting(self, db: AsyncSession, key: str) -> bool:
        """Remove a custom setting from PostgreSQL, reverting to system defaults."""
        key = key.strip()
        setting = await db.get(SystemSetting, key)
        if not setting:
            raise EntityNotFoundError(f"SystemSetting '{key}' not found.")
        await db.delete(setting)
        await db.flush()
        return True

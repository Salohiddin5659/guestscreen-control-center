# -*- coding: utf-8 -*-
"""Surgical SQLite advertising scene adapter with safety guards and bounded retry (T037)."""
import logging
from typing import Optional

import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter
from src.adapters.scene_serializer import parse_scene
from src.adapters.sqlite_retry import execute_with_busy_retry
from src.core.safety_guard import RetailSafetyGuard

logger = logging.getLogger("guestscreen.sqlite_adapter")


class SQLiteSceneAdapter:
    """Performs surgical read and update operations on gs.db scenes via CashboxCommandAdapter."""

    def __init__(self, command_adapter: Optional[CashboxCommandAdapter] = None) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()

    async def read_scene(
        self,
        conn: asyncssh.SSHClientConnection,
        guid: str,
        timeout: float = 5.0,
    ) -> str:
        """Read raw scene JSON string from gs.db for specified advertising GUID."""
        validated_guid = RetailSafetyGuard.validate_scene_guid(guid)
        return await self.command_adapter.sqlite_read(conn, validated_guid, timeout=timeout)

    async def update_scene(
        self,
        conn: asyncssh.SSHClientConnection,
        guid: str,
        json_payload: str,
        timeout: float = 12.0,
    ) -> None:
        """Surgically update advertising scene Raw column inside gs.db using bounded retry on lock contention."""
        validated_guid = RetailSafetyGuard.validate_scene_guid(guid)

        # Ensure json_payload conforms to GuestScreen scene schema
        parse_scene(json_payload)

        logger.info("Executing surgical scene update on gs.db for GUID %s", validated_guid)

        # Wrap execution in bounded retry loop for SQLITE_BUSY contention
        await execute_with_busy_retry(
            self.command_adapter.sqlite_update,
            conn,
            validated_guid,
            json_payload,
            timeout=timeout,
        )

# -*- coding: utf-8 -*-
"""Verification service for observable hot reload, PID stability, and scene readback (T049)."""
import asyncio
import json
import logging
from typing import Optional

import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter
from src.adapters.command_parsers import ProcessInfo
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import (
    ProcessCrashDetectedError,
    ProcessNotFoundError,
    ValidationDomainError,
)

logger = logging.getLogger("guestscreen.verification_service")


class VerificationService:
    """Verifies GuestScreen process stability and physical scene readback after hot reload."""

    def __init__(
        self,
        command_adapter: Optional[CashboxCommandAdapter] = None,
        sqlite_adapter: Optional[SQLiteSceneAdapter] = None,
    ) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()
        self.sqlite_adapter = sqlite_adapter or SQLiteSceneAdapter()

    async def get_process_baseline(self, conn: asyncssh.SSHClientConnection) -> Optional[ProcessInfo]:
        """Query running GuestScreen.exe process baseline before deployment."""
        return await self.command_adapter.proc_inspect(conn)

    async def verify_process_stability(
        self,
        conn: asyncssh.SSHClientConnection,
        baseline: Optional[ProcessInfo],
    ) -> None:
        try:
            current = await self.command_adapter.proc_inspect(conn)
        except ProcessNotFoundError as exc:
            raise ProcessCrashDetectedError(
                f"GuestScreen process inspection failed: {exc}"
            ) from exc

        if current is None:
            raise ProcessCrashDetectedError(
                "GuestScreen process inspection failed: GuestScreen.exe is not running."
            )

        if baseline is not None:
            if current.pid != baseline.pid:
                raise ProcessCrashDetectedError(
                    f"Process crash detected: GuestScreen.exe PID changed from {baseline.pid} to {current.pid}."
                )
            if baseline.start_time and current.start_time != baseline.start_time:
                raise ProcessCrashDetectedError(
                    f"Process crash detected: GuestScreen.exe StartTime changed from '{baseline.start_time}' to '{current.start_time}'."
                )

        logger.info(
            "GuestScreen process stability verified: PID %d active with StartTime '%s'",
            current.pid,
            current.start_time,
        )

    async def verify_scene_readback(
        self,
        conn: asyncssh.SSHClientConnection,
        guid: str,
        expected_raw_json: str,
    ) -> None:
        """Read back scene from gs.db and assert it matches the target payload."""
        actual_raw = await self.sqlite_adapter.read_scene(conn, guid)
        if not actual_raw:
            raise ValidationDomainError(f"Physical scene for GUID '{guid}' read back as empty string.")

        try:
            actual_data = json.loads(actual_raw)
            expected_data = json.loads(expected_raw_json)
        except json.JSONDecodeError as exc:
            raise ValidationDomainError(f"Corrupted scene JSON read back from gs.db: {exc}") from exc

        if actual_data != expected_data:
            raise ValidationDomainError(
                f"Physical scene in gs.db does not match target payload for GUID '{guid}'. "
                f"Actual: {actual_data}, Expected: {expected_data}"
            )

        logger.info("Physical scene readback verified for GUID %s in gs.db", guid)

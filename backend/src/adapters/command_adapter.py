# -*- coding: utf-8 -*-
"""Typed Cashbox Command Adapter implementing the strict 8-command allowlist."""
import json
import logging
import re
from typing import List, Optional

import asyncssh

from src.adapters.command_parsers import (
    CommandResult,
    InventoryItem,
    ProcessInfo,
    parse_inventory_json,
    parse_pong,
    parse_process_inspect,
    parse_sha256,
    parse_sqlite_read,
)
from src.core.exceptions import (
    ProcessNotFoundError,
    SafetyBoundaryViolationError,
    SQLiteExecutionError,
    UnauthorizedCommandError,
)

logger = logging.getLogger("guestscreen.command_adapter")

# Allowed scene GUIDs (CRITICAL RETAIL SAFETY BOUNDARY)
SCENE_GUID_FULL = "2509359c-2d71-4344-9be4-7d90dd453083"  # FULL SCREEN (1024x768)
SCENE_GUID_SPLIT = "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"  # 50/50 Promo Block (512x768)
ALLOWED_SCENE_GUIDS = {SCENE_GUID_FULL.lower(), SCENE_GUID_SPLIT.lower()}

# Validation regexes
RE_DEP_ID = re.compile(r"^[0-9a-fA-F\-]{36}$")
RE_FILENAME = re.compile(r"^[a-zA-Z0-9_\-\.]+$")
RE_TIMESTAMP = re.compile(r"^[0-9T:\-\.Z]+$")


class CashboxCommandAdapter:
    """Executes only pre-authorized, strongly typed commands on cashier monoblocks."""

    @staticmethod
    def _validate_dep_id(dep_id: str) -> str:
        dep_id_clean = dep_id.strip()
        if not RE_DEP_ID.match(dep_id_clean):
            raise UnauthorizedCommandError(
                f"Invalid deployment_id format: '{dep_id}'. Expected UUIDv4 format."
            )
        return dep_id_clean

    @staticmethod
    def _validate_filename(filename: str) -> str:
        fn_clean = filename.strip()
        if not RE_FILENAME.match(fn_clean) or ".." in fn_clean or "/" in fn_clean or "\\" in fn_clean:
            raise UnauthorizedCommandError(
                f"Invalid or unsafe filename: '{filename}'. Only alphanumeric and .-_ allowed."
            )
        return fn_clean

    @staticmethod
    def _validate_guid(guid: str) -> str:
        guid_clean = guid.strip().lower()
        if guid_clean not in ALLOWED_SCENE_GUIDS:
            raise SafetyBoundaryViolationError(
                f"Access denied to scene GUID '{guid}'. Modifying non-advertising scenes is strictly forbidden."
            )
        return guid_clean

    @staticmethod
    def _validate_timestamp(timestamp: str) -> str:
        ts_clean = timestamp.strip()
        if not RE_TIMESTAMP.match(ts_clean):
            raise UnauthorizedCommandError(
                f"Invalid timestamp format: '{timestamp}'. Only numbers, ISO8601 allowed."
            )
        return ts_clean

    async def _run_command(
        self,
        conn: asyncssh.SSHClientConnection,
        cmd: str,
        timeout: float,
    ) -> CommandResult:
        """Internal helper to dispatch command string over AsyncSSH and capture output."""
        try:
            result = await conn.run(cmd, timeout=timeout, encoding="utf-8", errors="replace")
            return CommandResult(
                command=cmd,
                exit_status=result.exit_status,
                stdout=result.stdout or "",
                stderr=result.stderr or "",
            )
        except asyncssh.ProcessError as exc:
            raise UnauthorizedCommandError(
                f"Command execution failed with status {exc.returncode}: {exc.stderr}"
            ) from exc

    # =========================================================================
    # 1. CMD_PING
    # =========================================================================
    async def ping(
        self,
        conn: asyncssh.SSHClientConnection,
        timeout: float = 5.0,
    ) -> bool:
        """Verify SSH connectivity and shell responsiveness on cashier monoblock."""
        cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Output PONG"'
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            return False
        return parse_pong(res.stdout)

    # =========================================================================
    # 2. CMD_INVENTORY
    # =========================================================================
    async def inventory(
        self,
        conn: asyncssh.SSHClientConnection,
        timeout: float = 8.0,
    ) -> List[InventoryItem]:
        r"""Scan uploaded media files in C:\UCS\GuestScreen\Front\media\uploads\."""
        cmd = (
            'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
            "$target = 'C:\\UCS\\GuestScreen\\Front\\media\\uploads'; "
            "$tmp = 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.inv.tmp'; "
            "if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }; "
            "Get-ChildItem -Path $target -File | Where-Object { $_.Name -notlike '.*' } | ForEach-Object { "
            "[PSCustomObject]@{ "
            "filename = $_.Name; "
            "size = $_.Length; "
            "sha256 = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash.ToLower(); "
            "modified_at = $_.LastWriteTimeUtc.ToString('o') "
            "} "
            "} | ConvertTo-Json -Compress | Out-File -FilePath $tmp -Encoding UTF8; "
            "Write-Output 'INVENTORY_DONE'\""
        )
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise UnauthorizedCommandError(f"CMD_INVENTORY failed: {res.stderr}")

        if "INVENTORY_DONE" in res.stdout:
            try:
                async with conn.start_sftp_client() as sftp:
                    async with sftp.open("C:/UCS/GuestScreen/Front/media/uploads/.inv.tmp", "rb") as f:
                        raw = await f.read()
                    try:
                        await sftp.remove("C:/UCS/GuestScreen/Front/media/uploads/.inv.tmp")
                    except Exception:
                        pass
                    return parse_inventory_json(raw.decode("utf-8-sig"))
            except Exception as e:
                logger.warning("Failed to read inventory via SFTP, falling back to stdout: %s", e)

        return parse_inventory_json(res.stdout)

    # =========================================================================
    # 3. CMD_HASH_VERIFY
    # =========================================================================
    async def hash_verify(
        self,
        conn: asyncssh.SSHClientConnection,
        dep_id: str,
        filename: str,
        timeout: float = 10.0,
    ) -> str:
        """Compute remote SHA-256 hash of a staged media file."""
        v_dep_id = self._validate_dep_id(dep_id)
        v_filename = self._validate_filename(filename)

        cmd = (
            'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
            f"(Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.staging\\{v_dep_id}\\{v_filename}').Hash.ToLower()\""
        )
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise UnauthorizedCommandError(f"CMD_HASH_VERIFY failed: {res.stderr}")
        return parse_sha256(res.stdout)

    # =========================================================================
    # 4. CMD_STAGING_MOVE
    # =========================================================================
    async def staging_move(
        self,
        conn: asyncssh.SSHClientConnection,
        dep_id: str,
        filename: str,
        timeout: float = 5.0,
    ) -> None:
        """Atomically promote verified media from staging directory to production uploads."""
        v_dep_id = self._validate_dep_id(dep_id)
        v_filename = self._validate_filename(filename)

        cmd = (
            'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
            f"Move-Item -LiteralPath 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.staging\\{v_dep_id}\\{v_filename}' "
            f"-Destination 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\{v_filename}' -Force; "
            f"if ((Test-Path 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.staging\\{v_dep_id}') -and "
            f"((Get-ChildItem -LiteralPath 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.staging\\{v_dep_id}' -Force | Measure-Object).Count -eq 0)) {{ "
            f"Remove-Item -LiteralPath 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.staging\\{v_dep_id}' -Recurse -Force -ErrorAction SilentlyContinue }}\""
        )
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise UnauthorizedCommandError(f"CMD_STAGING_MOVE failed: {res.stderr}")

    # =========================================================================
    # 5. CMD_SQLITE_READ_SCENE
    # =========================================================================
    async def sqlite_read(
        self,
        conn: asyncssh.SSHClientConnection,
        guid: str,
        timeout: float = 5.0,
    ) -> str:
        """Read raw scene JSON definition from gs.db for specified advertising GUID."""
        v_guid = self._validate_guid(guid)
        cmd = f'C:\\UCS\\GuestScreen\\sqlite3.exe -cmd ".timeout 10000" "C:\\UCS\\GuestScreen\\gs.db" "SELECT Raw FROM scenes WHERE Guid = \'{v_guid}\';"'
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise SQLiteExecutionError(f"CMD_SQLITE_READ_SCENE failed: {res.stderr}")
        return parse_sqlite_read(res.stdout)

    # =========================================================================
    # 6. CMD_SQLITE_UPDATE_SCENE
    # =========================================================================
    async def sqlite_update(
        self,
        conn: asyncssh.SSHClientConnection,
        guid: str,
        json_payload: str,
        timeout: float = 12.0,
    ) -> None:
        """Surgically update advertising scene Raw column inside gs.db using WAL mode."""
        v_guid = self._validate_guid(guid)

        # Validate that json_payload is authentic JSON
        try:
            json.loads(json_payload)
        except json.JSONDecodeError as exc:
            raise UnauthorizedCommandError("Invalid JSON payload for scene update.") from exc

        # Escape single quotes for SQL and double quotes for command line argument parsing
        escaped_payload = json_payload.replace("'", "''").replace('"', '""')

        cmd = (
            f'C:\\UCS\\GuestScreen\\sqlite3.exe -cmd ".timeout 10000" "C:\\UCS\\GuestScreen\\gs.db" '
            f'"PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000; BEGIN IMMEDIATE; '
            f'UPDATE scenes SET Raw = \'{escaped_payload}\' WHERE Guid = \'{v_guid}\'; COMMIT;"'
        )
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise SQLiteExecutionError(f"CMD_SQLITE_UPDATE_SCENE failed: {res.stderr}")
        if "error" in res.stdout.lower() or "database is locked" in res.stdout.lower():
            raise SQLiteExecutionError(f"SQLite error during scene update: {res.stdout}")

    # =========================================================================
    # 7. CMD_TOUCH_RELOAD
    # =========================================================================
    async def touch_reload(
        self,
        conn: asyncssh.SSHClientConnection,
        timestamp: Optional[str] = None,
        timeout: float = 3.0,
    ) -> None:
        r"""Update C:\UCS\GuestScreen\Front\sync_version.txt to trigger CefSharp hot reload."""
        if timestamp is None:
            import time
            timestamp = str(int(time.time() * 1000))
        v_ts = self._validate_timestamp(timestamp)

        cmd = (
            'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
            f"Set-Content -Path 'C:\\UCS\\GuestScreen\\Front\\sync_version.txt' -Value '{v_ts}' -Encoding UTF8\""
        )
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise UnauthorizedCommandError(f"CMD_TOUCH_RELOAD failed: {res.stderr}")

    # =========================================================================
    # 8. CMD_PROC_INSPECT
    # =========================================================================
    async def proc_inspect(
        self,
        conn: asyncssh.SSHClientConnection,
        timeout: float = 15.0,
        allow_none: bool = False,
    ) -> Optional[ProcessInfo]:
        """Query PID, StartTime, WorkingDirectory, and runtime indicators of running GuestScreen.exe process."""
        cmd = (
            'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
            "$tcp = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue; "
            "$ps32 = Join-Path $env:windir 'SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe'; "
            "Get-Process -Name 'GuestScreen' -ErrorAction SilentlyContinue | ForEach-Object { "
            "$id = $_.Id; "
            "$ports = @($tcp | Where-Object OwningProcess -eq $id | Select-Object -ExpandProperty LocalPort); "
            "$hasLibcef = $false; "
            "$hasCefSharp = $false; "
            "if (Test-Path $ps32) { "
            "$mods = & $ps32 -NoProfile -Command \\\"@((Get-Process -Id $id).Modules.ModuleName)\\\"; "
            "$hasLibcef = ($mods -contains 'libcef.dll'); "
            "$hasCefSharp = ($mods -contains 'CefSharp.dll' -or $mods -contains 'CefSharp.Core.dll' -or $mods -contains 'CefSharp.WinForms.dll'); "
            "} else { "
            "$mods = @($_.Modules.ModuleName); "
            "$hasLibcef = ($mods -contains 'libcef.dll'); "
            "$hasCefSharp = ($mods -contains 'CefSharp.dll' -or $mods -contains 'CefSharp.Core.dll' -or $mods -contains 'CefSharp.WinForms.dll'); "
            "} "
            "[PSCustomObject]@{ "
            "Id = $id; "
            "StartTime = $_.StartTime.ToString('o'); "
            "Path = $_.Path; "
            "WorkingSet = $_.WorkingSet64; "
            "Threads = $_.Threads.Count; "
            "ListeningPorts = $ports; "
            "HasPort2121 = ($ports -contains 2121); "
            "HasLibcef = $hasLibcef; "
            "HasCefSharp = $hasCefSharp; "
            "WorkingDirectory = if ($ports -contains 2121 -or $hasLibcef) { 'C:\\UCS\\GuestScreen' } else { '' } "
            "} "
            "} | ConvertTo-Json -Compress\""
        )
        res = await self._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            if allow_none:
                return None
            raise ProcessNotFoundError(f"CMD_PROC_INSPECT failed with exit status {res.exit_status}: {res.stderr}")
        return parse_process_inspect(res.stdout, allow_none=allow_none)

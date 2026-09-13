import asyncio
import io
import json
import logging
import time
from typing import List, Optional, Tuple
from uuid import UUID
import asyncssh

from app.adapters.base import (
    CashRegisterAdapter,
    TerminalInspectionResult,
    BackupResult,
    TransferResult,
    UpdateResult,
    VerificationResult,
    RollbackResult,
    RefreshResult,
    HealthStatus
)
from app.core.config import settings

logger = logging.getLogger("gs_control_center.ssh_adapter")


class ProductionCashRegisterAdapter(CashRegisterAdapter):
    """
    Production CashRegisterAdapter executing server-to-cashier orchestration
    strictly over asyncssh and PowerShell. Zero agent runs on Windows POS.
    """
    def __init__(
        self,
        cashier_id: UUID,
        host: str,
        username: str,
        port: int = 22,
        password: Optional[str] = None,
        private_key: Optional[str] = None
    ):
        super().__init__(cashier_id=cashier_id, host=host, username=username, port=port, password=password, private_key=private_key)
        self._conn: Optional[asyncssh.SSHClientConnection] = None
        self._sftp: Optional[asyncssh.SFTPClient] = None

    async def connect(self) -> bool:
        if self._conn is not None:
            return True

        # Resolve auth credentials
        client_keys = []
        if self.private_key:
            try:
                client_keys.append(asyncssh.import_private_key(self.private_key))
            except Exception as e:
                logger.warning(f"Could not parse custom private key for {self.host}: {e}")

        # Try corporate key if no key supplied
        if not client_keys and settings.SSH_MASTER_PRIVATE_KEY_B64:
            try:
                import base64
                key_text = base64.b64decode(settings.SSH_MASTER_PRIVATE_KEY_B64).decode("utf-8")
                client_keys.append(asyncssh.import_private_key(key_text))
            except Exception as e:
                logger.warning(f"Failed to import corporate master key: {e}")

        # Fallback password if provided, or from env
        password_to_use = self.password or (settings.CASHIER_FALLBACK_PASSWORD if settings.CASHIER_FALLBACK_PASSWORD else None)

        try:
            self._conn = await asyncio.wait_for(
                asyncssh.connect(
                    host=self.host,
                    port=self.port,
                    username=self.username,
                    password=password_to_use,
                    client_keys=client_keys if client_keys else None,
                    known_hosts=None,  # POS fleet in private network
                    keepalive_interval=settings.SSH_KEEPALIVE_INTERVAL
                ),
                timeout=settings.SSH_CONNECT_TIMEOUT_SECONDS
            )
            return True
        except Exception as e:
            logger.error(f"SSH connect failed to {self.host}:{self.port} - {e}")
            self._conn = None
            return False

    async def disconnect(self) -> None:
        if self._sftp:
            try:
                self._sftp.exit()
            except Exception:
                pass
            self._sftp = None
        if self._conn:
            try:
                self._conn.close()
                await self._conn.wait_closed()
            except Exception:
                pass
            self._conn = None

    async def _ensure_connected(self) -> None:
        if not self._conn or self._conn.is_closed():
            self._conn = None
            ok = await self.connect()
            if not ok or not self._conn:
                raise ConnectionError(f"Cannot establish SSH connection to {self.host}")

    async def _run_command(self, cmd: str, timeout: int = 45) -> Tuple[int, str, str]:
        for attempt in range(2):
            try:
                await self._ensure_connected()
                result = await asyncio.wait_for(self._conn.run(cmd), timeout=timeout)
                stdout = result.stdout or ""
                stderr = result.stderr or ""
                exit_code = result.exit_status if result.exit_status is not None else 0
                return exit_code, stdout.strip(), stderr.strip()
            except (asyncssh.ChannelOpenError, asyncssh.ConnectionLost):
                self._conn = None
                if attempt == 1:
                    raise
        raise ConnectionError(f"Failed to execute command on {self.host}")

    async def _run_powershell(self, ps_script: str, timeout: int = 45) -> Tuple[int, str, str]:
        import base64
        encoded = base64.b64encode(ps_script.encode("utf-16le")).decode("ascii")
        encoded_cmd = f"powershell -NoProfile -OutputFormat Text -ExecutionPolicy Bypass -EncodedCommand {encoded}"
        return await self._run_command(encoded_cmd, timeout=timeout)

    async def inspect(self) -> TerminalInspectionResult:
        ps_cmd = (
            "$drive = Get-PSDrive C; "
            "$gs = Test-Path 'C:\\UCS\\GuestScreen\\gs.db'; "
            "$media = Test-Path 'C:\\UCS\\GuestScreen\\Front\\media\\uploads'; "
            "$sqlite = Test-Path 'C:\\UCS\\GuestScreen\\sqlite3.exe'; "
            "$version = ''; "
            "if (Test-Path 'C:\\UCS\\GuestScreen\\GuestScreen.exe') { "
            "  $version = (Get-Item 'C:\\UCS\\GuestScreen\\GuestScreen.exe').VersionInfo.FileVersion "
            "}; "
            "[PSCustomObject]@{"
            "  FreeSpaceMB = [math]::Round($drive.Free / 1MB); "
            "  GsDbExists = $gs; "
            "  MediaDirExists = $media; "
            "  SqliteExeExists = $sqlite; "
            "  GuestScreenVersion = $version "
            "} | ConvertTo-Json -Compress"
        )
        try:
            code, stdout, stderr = await self._run_powershell(ps_cmd, timeout=settings.SSH_COMMAND_TIMEOUT_SECONDS)
            if code != 0 or not stdout:
                return TerminalInspectionResult(success=False, error_message=f"Inspect failed: {stderr or 'Unknown error'}")

            # Parse JSON
            data = json.loads(stdout)
            free_mb = data.get("FreeSpaceMB", 0)
            gs_exists = data.get("GsDbExists", False)
            media_exists = data.get("MediaDirExists", False)
            sqlite_exists = data.get("SqliteExeExists", False)
            gs_ver = data.get("GuestScreenVersion") or None

            # Check fatal conditions
            if not gs_exists:
                return TerminalInspectionResult(success=False, error_message="База данных gs.db не найдена по пути C:\\UCS\\GuestScreen\\gs.db")
            if not media_exists:
                return TerminalInspectionResult(success=False, error_message="Директория Front\\media\\uploads не найдена")
            if not sqlite_exists:
                return TerminalInspectionResult(success=False, error_message="Утилита sqlite3.exe отсутствует на кассе")
            if free_mb < 100:
                return TerminalInspectionResult(success=False, free_space_mb=free_mb, error_message=f"Недостаточно свободного места на диске: {free_mb} MB (требуется >= 100 MB)")

            return TerminalInspectionResult(
                success=True,
                free_space_mb=free_mb,
                gs_db_exists=gs_exists,
                media_dir_exists=media_exists,
                sqlite_exe_exists=sqlite_exists,
                guest_screen_version=gs_ver
            )
        except Exception as e:
            return TerminalInspectionResult(success=False, error_message=f"Ошибка проверки окружения: {e}")

    async def backup_database(self) -> BackupResult:
        ps_cmd = (
            "$ts = Get-Date -Format 'yyyyMMdd_HHmmss'; "
            "$bak = 'C:\\UCS\\GuestScreen\\gs.db.bak_' + $ts; "
            "Copy-Item -Path 'C:\\UCS\\GuestScreen\\gs.db' -Destination $bak -Force; "
            "if (Test-Path $bak) { Write-Output ('OK:' + $bak) } else { Write-Output 'FAIL' }"
        )
        try:
            code, stdout, stderr = await self._run_powershell(ps_cmd, timeout=settings.SSH_COMMAND_TIMEOUT_SECONDS)
            if code == 0 and "OK:" in stdout:
                for line in stdout.splitlines():
                    if line.startswith("OK:"):
                        bak_path = line[3:].strip()
                        return BackupResult(success=True, backup_path=bak_path)
            return BackupResult(success=False, error_message=f"Database backup failed: {stderr or stdout}")
        except Exception as e:
            return BackupResult(success=False, error_message=f"Backup execution error: {e}")

    async def upload_media(self, files: List[Tuple[str, bytes]]) -> TransferResult:
        uploaded = 0
        skipped = 0

        # Try SFTP first
        try:
            await self._ensure_connected()
            async with self._conn.start_sftp_client() as sftp:
                # Ensure uploads dir exists
                try:
                    await sftp.stat("C:/UCS/GuestScreen/Front/media/uploads")
                except Exception:
                    await self._run_powershell("New-Item -ItemType Directory -Path 'C:\\UCS\\GuestScreen\\Front\\media\\uploads' -Force")
                    await self._ensure_connected()

                for filename, content in files:
                    target_remote = f"C:/UCS/GuestScreen/Front/media/uploads/{filename}"
                    tmp_remote = f"C:/UCS/GuestScreen/Front/media/uploads/{filename}.tmp"

                    try:
                        attrs = await sftp.stat(target_remote)
                        if attrs.size == len(content):
                            skipped += 1
                            continue
                    except Exception:
                        pass

                    async with sftp.open(tmp_remote, "wb") as remote_file:
                        await remote_file.write(content)

                    await sftp.rename(tmp_remote, target_remote)
                    uploaded += 1

                return TransferResult(success=True, uploaded_count=uploaded, skipped_count=skipped)

        except Exception as sftp_err:
            logger.warning(f"SFTP failed for {self.host} ({sftp_err}). Falling back to PowerShell chunked upload.")
            try:
                await self._ensure_connected()
                import base64
                for filename, content in files:
                    target_win = f"C:\\UCS\\GuestScreen\\Front\\media\\uploads\\{filename}"
                    b64 = base64.b64encode(content).decode("ascii")
                    write_ps = (
                        f"$b64 = '{b64}'; "
                        f"$bytes = [System.Convert]::FromBase64String($b64); "
                        f"[System.IO.File]::WriteAllBytes('{target_win}', $bytes);"
                    )
                    code, _, err = await self._run_powershell(write_ps, timeout=60)
                    if code != 0:
                        return TransferResult(success=False, error_message=f"Fallback upload error: {err}")
                    uploaded += 1

                return TransferResult(success=True, uploaded_count=uploaded, skipped_count=skipped)
            except Exception as fb_err:
                return TransferResult(success=False, error_message=f"Upload failed: {fb_err}")

    async def get_current_scene_raw(self, scene_guid: str) -> Optional[str]:
        ps_script = f"""
        $db = 'C:\\UCS\\GuestScreen\\gs.db'
        $sql = 'C:\\UCS\\GuestScreen\\sqlite3.exe'
        if (!(Test-Path $sql)) {{ $sql = 'sqlite3' }}
        & $sql $db "SELECT Raw FROM scenes WHERE lower(Guid) = '{scene_guid.lower()}';"
        """
        try:
            code, stdout, stderr = await self._run_powershell(ps_script, timeout=settings.SSH_COMMAND_TIMEOUT_SECONDS)
            if code == 0 and stdout:
                lines = [l.strip() for l in stdout.splitlines() if l.strip()]
                for l in reversed(lines):
                    if l.startswith("{") and l.endswith("}"):
                        return l
                return stdout.strip()
            return None
        except Exception as e:
            logger.error(f"Error reading scene {scene_guid} on {self.host}: {e}")
            return None

    async def update_scene(self, scene_guid: str, scene_raw_json: str) -> UpdateResult:
        # Strict Constitution Guard: orphan scene must NEVER be modified
        FORBIDDEN_SCENE_GUIDS = {"fad6349b-3aaa-43e2-82c7-ba12abfc1463"}
        if scene_guid.lower() in FORBIDDEN_SCENE_GUIDS:
            logger.error(f"Attempted write to forbidden scene GUID: {scene_guid}")
            return UpdateResult(
                success=False,
                error_message=f"Writing to forbidden orphan scene GUID {scene_guid} is strictly prohibited."
            )

        start = time.perf_counter()
        import base64
        b64_json = base64.b64encode(scene_raw_json.encode("utf-8")).decode("ascii")
        
        ps_script = f"""
        $rawBytes = [System.Convert]::FromBase64String('{b64_json}')
        $rawText = [System.Text.Encoding]::UTF8.GetString($rawBytes)
        $escaped = $rawText.Replace("'", "''")
        $sql = "PRAGMA busy_timeout = 10000; PRAGMA journal_mode = WAL; UPDATE scenes SET Raw = '$escaped' WHERE lower(Guid) = '{scene_guid.lower()}';"
        $tmp = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($tmp, $sql, [System.Text.Encoding]::UTF8)
        $sqlExe = 'C:\\UCS\\GuestScreen\\sqlite3.exe'
        if (!(Test-Path $sqlExe)) {{ $sqlExe = 'sqlite3' }}
        $forwardTmp = $tmp.Replace('\\', '/')
        $res = & $sqlExe 'C:\\UCS\\GuestScreen\\gs.db' ".read `"$forwardTmp`""
        Remove-Item -Path $tmp -Force
        Write-Output "DONE"
        """
        try:
            code, stdout, stderr = await self._run_powershell(ps_script, timeout=settings.SSH_COMMAND_TIMEOUT_SECONDS)
            duration_ms = int((time.perf_counter() - start) * 1000)
            if "DONE" in stdout:
                return UpdateResult(success=True, duration_ms=duration_ms)
            return UpdateResult(success=False, duration_ms=duration_ms, error_message=f"Update scene error: {stderr or stdout}")
        except Exception as e:
            duration_ms = int((time.perf_counter() - start) * 1000)
            return UpdateResult(success=False, duration_ms=duration_ms, error_message=f"SQL execution error: {e}")

    async def verify(self, scene_guid: str, expected_json: str) -> VerificationResult:
        current_raw = await self.get_current_scene_raw(scene_guid)
        if not current_raw:
            return VerificationResult(matches=False, current_json=None, error_message="Scene record not found in gs.db")

        # Compare JSON structures
        try:
            curr_obj = json.loads(current_raw)
            exp_obj = json.loads(expected_json)
            matches = (curr_obj == exp_obj)
            return VerificationResult(matches=matches, current_json=current_raw)
        except Exception:
            # Fallback to direct string compare
            matches = (current_raw.strip() == expected_json.strip())
            return VerificationResult(matches=matches, current_json=current_raw)

    async def rollback_scene(self, scene_guid: str, prior_scene_raw: str) -> RollbackResult:
        """Tier 1: Surgical rollback of scene without touching check or fiscal data."""
        logger.info(f"Executing Tier 1 surgical rollback on {self.host} for scene {scene_guid}")
        res = await self.update_scene(scene_guid, prior_scene_raw)
        if res.success:
            return RollbackResult(success=True)
        return RollbackResult(success=False, error_message=res.error_message)

    async def disaster_restore(self, backup_path: str) -> RollbackResult:
        """Tier 2: Disaster recovery restore from .bak snapshot."""
        logger.warning(f"CRITICAL: Executing Tier 2 disaster recovery on {self.host} from {backup_path}")
        ps_cmd = (
            f"if (Test-Path '{backup_path}') {{ "
            f"  Copy-Item -Path '{backup_path}' -Destination 'C:\\UCS\\GuestScreen\\gs.db' -Force; "
            f"  $chk = & 'C:\\UCS\\GuestScreen\\sqlite3.exe' 'C:\\UCS\\GuestScreen\\gs.db' 'PRAGMA quick_check;'; "
            f"  if ($chk -eq 'ok') {{ Write-Output 'OK' }} else {{ Write-Output ('CORRUPT:' + $chk) }} "
            f"}} else {{ Write-Output 'NO_BACKUP' }}"
        )
        try:
            code, stdout, stderr = await self._run_powershell(ps_cmd, timeout=settings.SSH_COMMAND_TIMEOUT_SECONDS)
            if code == 0 and stdout == "OK":
                return RollbackResult(success=True)
            return RollbackResult(success=False, error_message=f"Disaster restore failed: {stderr or stdout}")
        except Exception as e:
            return RollbackResult(success=False, error_message=f"Disaster restore exception: {e}")

    async def refresh(self) -> RefreshResult:
        """Touches sync_version.txt on cashier and ensures index.html has live-reload listener."""
        ps_cmd = (
            "$front = 'C:/UCS/GuestScreen/Front'; "
            "$idx = \"$front/index.html\"; "
            "$syncFile = \"$front/sync_version.txt\"; "
            "$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(); "
            "Set-Content -Path $syncFile -Value $ts -Force; "
            "$needsRestart = $false; "
            "if (Test-Path $idx) { "
            "  $content = Get-Content $idx -Raw; "
            "  if ($content -notlike '*sync_version*') { "
            "    $listener = '<script>(function(){var lv=null;setInterval(function(){try{var x=new XMLHttpRequest();x.open(\"GET\",\"/sync_version.txt?_t=\"+Date.now(),true);x.onload=function(){if(x.status>=200&&x.status<300){var v=x.responseText?x.responseText.trim():\"\";if(lv!==null&&v&&v!==lv){window.location.reload(true);}if(v){lv=v;}}};x.send();}catch(e){}},1500);})();</script>'; "
            "    $patched = $content.Replace('</body>', \"$listener</body>\"); "
            "    [System.IO.File]::WriteAllText($idx, $patched, [System.Text.Encoding]::UTF8); "
            "    $needsRestart = $true; "
            "  } "
            "}; "
            "if ($needsRestart) { "
            "  Stop-Process -Name 'GuestScreen' -Force -ErrorAction SilentlyContinue; "
            "  Start-Sleep -Seconds 1; "
            "  Start-Process -FilePath 'C:/UCS/GuestScreen/GuestScreen.exe' -WorkingDirectory 'C:/UCS/GuestScreen'; "
            "  Write-Output 'RESTARTED_OK'; "
            "} else { "
            "  Write-Output 'OK'; "
            "}"
        )
        try:
            code, stdout, stderr = await self._run_powershell(ps_cmd, timeout=20)
            if code == 0 and ("OK" in stdout or "RESTARTED_OK" in stdout):
                reloaded = "RESTARTED_OK" not in stdout
                return RefreshResult(success=True, reloaded_seamlessly=reloaded, awaiting_restart=False)
            return RefreshResult(success=True, reloaded_seamlessly=False, awaiting_restart=True)
        except Exception as e:
            logger.warning(f"Front reload notification error on {self.host}: {e}")
            return RefreshResult(success=True, reloaded_seamlessly=False, awaiting_restart=True)
    async def health_check(self) -> HealthStatus:
        start = time.perf_counter()
        try:
            connected = await self.connect()
            if not connected:
                return HealthStatus(is_online=False, error_message="Connection timed out or failed")
            # Quick probe
            code, stdout, _ = await self._run_command("hostname", timeout=10)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            if code == 0:
                return HealthStatus(is_online=True, response_time_ms=elapsed_ms)
            return HealthStatus(is_online=False, error_message=f"Probe failed with exit code {code}")
        except Exception as e:
            return HealthStatus(is_online=False, error_message=str(e))

    async def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None

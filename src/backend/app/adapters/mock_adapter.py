import asyncio
import time
from typing import List, Optional, Tuple, Dict
from uuid import UUID
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


class MockCashRegisterAdapter(CashRegisterAdapter):
    """
    In-memory simulation of POS cashier for unit tests and fleet load testing.
    Can simulate delays, offline terminals, verification errors, and rollback behavior.
    """
    def __init__(
        self,
        cashier_id: UUID,
        host: str,
        username: str,
        port: int = 22,
        password: Optional[str] = None,
        private_key: Optional[str] = None,
        simulate_offline: bool = False,
        simulate_failure_step: Optional[str] = None,
        latency_ms: int = 50
    ):
        super().__init__(cashier_id=cashier_id, host=host, username=username, port=port, password=password, private_key=private_key)
        self.simulate_offline = simulate_offline
        self.simulate_failure_step = simulate_failure_step
        self.latency_ms = latency_ms

        # In-memory virtual cashier state
        self.connected = False
        self.free_space_mb = 15000
        self.scenes_store: Dict[str, str] = {
            "2509359c-2d71-4344-9be4-7d90dd453083": '{"type":"image","src":"media/uploads/default.jpg"}',
            "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3": '{"type":"gallery","slides":[]}',
            "fad6349b-3aaa-43e2-82c7-ba12abfc1463": '{"type":"image","src":"media/uploads/promo_default.jpg"}'
        }
        self.media_files: Dict[str, bytes] = {}
        self.backups: List[str] = []
        self.sync_version: int = 1000

    async def _sleep_latency(self):
        if self.latency_ms > 0:
            await asyncio.sleep(self.latency_ms / 1000.0)

    async def connect(self) -> bool:
        await self._sleep_latency()
        if self.simulate_offline:
            return False
        self.connected = True
        return True

    async def inspect(self) -> TerminalInspectionResult:
        await self._sleep_latency()
        if not self.connected:
            return TerminalInspectionResult(success=False, error_message="Not connected")
        if self.simulate_failure_step == "inspect":
            return TerminalInspectionResult(success=False, error_message="Simulated inspect error: low disk space", free_space_mb=50)

        return TerminalInspectionResult(
            success=True,
            free_space_mb=self.free_space_mb,
            gs_db_exists=True,
            media_dir_exists=True,
            sqlite_exe_exists=True,
            guest_screen_version="3.1.1.0"
        )

    async def backup_database(self) -> BackupResult:
        await self._sleep_latency()
        if self.simulate_failure_step == "backup":
            return BackupResult(success=False, error_message="Simulated backup lock failure")
        
        bak_path = f"C:\\UCS\\GuestScreen\\gs.db.bak_{int(time.time())}"
        self.backups.append(bak_path)
        return BackupResult(success=True, backup_path=bak_path)

    async def upload_media(self, files: List[Tuple[str, bytes]]) -> TransferResult:
        await self._sleep_latency()
        if self.simulate_failure_step == "upload":
            return TransferResult(success=False, error_message="Simulated SFTP upload drop")

        uploaded = 0
        skipped = 0
        for name, data in files:
            if name in self.media_files and self.media_files[name] == data:
                skipped += 1
            else:
                self.media_files[name] = data
                uploaded += 1

        return TransferResult(success=True, uploaded_count=uploaded, skipped_count=skipped)

    async def get_current_scene_raw(self, scene_guid: str) -> Optional[str]:
        await self._sleep_latency()
        return self.scenes_store.get(scene_guid)

    async def update_scene(self, scene_guid: str, scene_raw_json: str) -> UpdateResult:
        await self._sleep_latency()
        if self.simulate_failure_step == "update":
            return UpdateResult(success=False, error_message="Simulated SQLite busy lock")

        self.scenes_store[scene_guid] = scene_raw_json
        return UpdateResult(success=True, duration_ms=int(self.latency_ms))

    async def verify(self, scene_guid: str, expected_json: str) -> VerificationResult:
        await self._sleep_latency()
        if self.simulate_failure_step == "verify":
            return VerificationResult(matches=False, current_json=self.scenes_store.get(scene_guid), error_message="Simulated verification mismatch")

        current = self.scenes_store.get(scene_guid)
        matches = (current == expected_json)
        return VerificationResult(matches=matches, current_json=current)

    async def rollback_scene(self, scene_guid: str, prior_scene_raw: str) -> RollbackResult:
        await self._sleep_latency()
        self.scenes_store[scene_guid] = prior_scene_raw
        return RollbackResult(success=True)

    async def disaster_restore(self, backup_path: str) -> RollbackResult:
        await self._sleep_latency()
        return RollbackResult(success=True)

    async def refresh(self) -> RefreshResult:
        await self._sleep_latency()
        self.sync_version += 1
        return RefreshResult(success=True, reloaded_seamlessly=True, awaiting_restart=False)

    async def health_check(self) -> HealthStatus:
        await self._sleep_latency()
        if self.simulate_offline:
            return HealthStatus(is_online=False, error_message="Host unreachable")
        return HealthStatus(is_online=True, response_time_ms=self.latency_ms)

    async def close(self) -> None:
        self.connected = False

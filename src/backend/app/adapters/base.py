from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from pydantic import BaseModel
from uuid import UUID


class TerminalInspectionResult(BaseModel):
    success: bool
    free_space_mb: int = 0
    gs_db_exists: bool = False
    media_dir_exists: bool = False
    sqlite_exe_exists: bool = False
    guest_screen_version: Optional[str] = None
    error_message: Optional[str] = None


class BackupResult(BaseModel):
    success: bool
    backup_path: Optional[str] = None
    error_message: Optional[str] = None


class TransferResult(BaseModel):
    success: bool
    uploaded_count: int = 0
    skipped_count: int = 0
    error_message: Optional[str] = None


class UpdateResult(BaseModel):
    success: bool
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None


class VerificationResult(BaseModel):
    matches: bool
    current_json: Optional[str] = None
    error_message: Optional[str] = None


class RollbackResult(BaseModel):
    success: bool
    error_message: Optional[str] = None


class RefreshResult(BaseModel):
    success: bool
    reloaded_seamlessly: bool = False
    awaiting_restart: bool = False
    error_message: Optional[str] = None


class HealthStatus(BaseModel):
    is_online: bool
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None


class CashRegisterAdapter(ABC):
    def __init__(self, cashier_id: UUID, host: str, username: str, port: int = 22, password: Optional[str] = None, private_key: Optional[str] = None):
        if not username or not username.strip():
            raise ValueError(f"username is strictly required for CashRegisterAdapter (cashier {cashier_id})")
        self.cashier_id = cashier_id
        self.host = host
        self.username = username.strip()
        self.port = port
        self.password = password
        self.private_key = private_key

    @abstractmethod
    async def connect(self) -> bool:
        """Establish SSH transport connection."""
        pass

    async def disconnect(self) -> None:
        """Close SSH transport connection."""
        pass

    close = disconnect

    @abstractmethod
    async def inspect(self) -> TerminalInspectionResult:
        """Performs non-destructive environment inspection on POS."""
        pass

    @abstractmethod
    async def backup_database(self) -> BackupResult:
        """Creates a timestamped snapshot of gs.db locally on the cashier."""
        pass

    @abstractmethod
    async def upload_media(self, files: List[Tuple[str, bytes]]) -> TransferResult:
        """Uploads list of (stored_filename, content_bytes) to Front\\media\\uploads\\."""
        pass

    @abstractmethod
    async def get_current_scene_raw(self, scene_guid: str) -> Optional[str]:
        """Reads current Raw JSON string of scene into memory."""
        pass

    @abstractmethod
    async def update_scene(self, scene_guid: str, scene_raw_json: str) -> UpdateResult:
        """Updates only the scenes table for the specified Guid."""
        pass

    @abstractmethod
    async def verify(self, scene_guid: str, expected_json: str) -> VerificationResult:
        """Reads back scenes.Raw in read-only mode and verifies byte/JSON equivalence."""
        pass

    @abstractmethod
    async def rollback_scene(self, scene_guid: str, prior_scene_raw: str) -> RollbackResult:
        """Tier 1: Restores previous scene.Raw without touching fiscal/order data."""
        pass

    @abstractmethod
    async def disaster_restore(self, backup_path: str) -> RollbackResult:
        """Tier 2: Restores gs.db from local .bak snapshot."""
        pass

    @abstractmethod
    async def refresh(self) -> RefreshResult:
        """Triggers sync_version.txt or evaluates hot reload."""
        pass

    @abstractmethod
    async def health_check(self) -> HealthStatus:
        """Fast ping/SSH handshake check."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Closes any open SSH/SFTP sessions."""
        pass

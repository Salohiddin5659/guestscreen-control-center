# -*- coding: utf-8 -*-
"""Domain, safety, and security exception hierarchy for GuestScreen Ad Management."""


class GuestScreenError(Exception):
    """Base exception for all domain and operational errors in GuestScreen Ad Manager."""

    def __init__(self, message: str, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


# 1. Critical Retail Safety and Security Guardrail Exceptions
class SafetyBoundaryViolationError(GuestScreenError):
    """Raised when an operation attempts to touch non-advertising tables or replace gs.db."""
    pass


class IntegrityViolationError(GuestScreenError):
    """Raised when non-ad protected tables (licenses, screens, scenarios) or protected settings keys are altered."""
    pass


class UnauthorizedCommandError(GuestScreenError):
    """Raised when a command outside CashboxCommandAdapter allowlist is dispatched."""
    pass


class CommandParseError(GuestScreenError):
    """Raised when parsing command output (CLI, PowerShell, JSON, etc.) fails."""
    pass


class MasterKeyMissingError(GuestScreenError):
    """Raised when GS_MASTER_KEY is absent or has an invalid length (not 32 bytes)."""
    pass


# 2. Cashier Fleet & Transport Exceptions
class CashboxOfflineError(GuestScreenError):
    """Raised when a cashier monoblock cannot be reached via network or SSH ping."""
    pass


class CashboxAuthenticationError(GuestScreenError):
    """Raised when SSH credentials fail to authenticate with cashier monoblock."""
    pass


class StagingVerificationFailedError(GuestScreenError):
    """Raised when a staged media file fails remote SHA-256 hash verification on cashbox."""
    pass


# 3. Cashbox SQLite Execution Exceptions
class SQLiteExecutionError(GuestScreenError):
    """Raised when sqlite3.exe exits with a non-zero code or database error."""
    pass


class SQLiteBusyTimeoutError(SQLiteExecutionError):
    """Raised when sqlite3.exe encounters SQLITE_BUSY and exceeds bounded retry limit."""
    pass


# 4. Hot Reload & Process Inspection Exceptions
class ProcessCrashDetectedError(GuestScreenError):
    """Raised when GuestScreen.exe vanishes, restarts (new PID), or hangs during reload."""
    pass


class ProcessAmbiguousError(GuestScreenError):
    """Raised when multiple active GuestScreen.exe processes are detected (ambiguous state)."""
    pass


class ProcessNotFoundError(GuestScreenError):
    """Raised when no active GuestScreen.exe process is detected matching criteria."""
    pass


class HotReloadTimeoutError(GuestScreenError):
    """Raised when cashbox display fails to reflect new scene within 15 seconds."""
    pass


# 5. Rollback and Terminal State Exceptions
class RollbackFailedError(GuestScreenError):
    """Raised when restoring advertising scene from snapshot fails; triggers terminal state."""
    pass


# 6. Concurrency and Idempotency Exceptions
class ConcurrentDeploymentBlockedError(GuestScreenError):
    """Raised when attempting to deploy to a cashbox currently locked by advisory lock."""
    pass


class IdempotentNoOpException(GuestScreenError):
    """Raised/used internally when desired state is already active, achieving instant NO_OP."""
    pass


# 7. Media and Validation Exceptions
class InvalidMediaFormatError(GuestScreenError):
    """Raised when uploaded file fails MIME, magic bytes, or aspect ratio validation."""
    pass


class EntityNotFoundError(GuestScreenError):
    """Raised when a requested entity does not exist in PostgreSQL."""
    pass


class EntityConflictError(GuestScreenError):
    """Raised when an entity violates unique constraints (e.g. duplicate IP, code, or name)."""
    pass


class ValidationDomainError(GuestScreenError):
    """Raised when business validation rules fail."""
    pass


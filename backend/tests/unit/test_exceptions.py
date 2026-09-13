# -*- coding: utf-8 -*-
"""Unit tests for domain and safety exceptions."""
import pytest
from src.core.exceptions import (
    GuestScreenError,
    SafetyBoundaryViolationError,
    UnauthorizedCommandError,
    MasterKeyMissingError,
    CashboxOfflineError,
    StagingVerificationFailedError,
    SQLiteBusyTimeoutError,
    ProcessCrashDetectedError,
    HotReloadTimeoutError,
    RollbackFailedError,
    ConcurrentDeploymentBlockedError,
    IdempotentNoOpException,
)


def test_exception_inheritance():
    """Verify all domain exceptions inherit from GuestScreenError."""
    exceptions = [
        SafetyBoundaryViolationError,
        UnauthorizedCommandError,
        MasterKeyMissingError,
        CashboxOfflineError,
        StagingVerificationFailedError,
        SQLiteBusyTimeoutError,
        ProcessCrashDetectedError,
        HotReloadTimeoutError,
        RollbackFailedError,
        ConcurrentDeploymentBlockedError,
        IdempotentNoOpException,
    ]
    for exc_cls in exceptions:
        inst = exc_cls("Test error", details={"cashbox_id": "123"})
        assert isinstance(inst, GuestScreenError)
        assert inst.message == "Test error"
        assert inst.details["cashbox_id"] == "123"
        assert str(inst) == "Test error"

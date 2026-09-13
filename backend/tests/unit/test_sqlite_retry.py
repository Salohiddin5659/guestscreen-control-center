# -*- coding: utf-8 -*-
"""Unit tests for SQLite bounded retry engine on lock contention (T039)."""
import pytest

from src.adapters.sqlite_retry import execute_with_busy_retry
from src.core.exceptions import SQLiteBusyTimeoutError, SQLiteExecutionError


@pytest.mark.asyncio
async def test_retry_success_after_transient_lock():
    """Verify that transient database locks trigger backoff and succeed once lock clears."""
    call_count = 0

    async def flaky_sqlite_operation():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise SQLiteExecutionError("database is locked (SQLITE_BUSY)")
        return "SUCCESS"

    # Use micro-delays for test speed
    delays = (0.01, 0.02, 0.03)
    result = await execute_with_busy_retry(flaky_sqlite_operation, delays=delays)
    assert result == "SUCCESS"
    assert call_count == 3


@pytest.mark.asyncio
async def test_retry_exhaustion_raises_busy_timeout():
    """Verify that exhausting all retry attempts raises SQLiteBusyTimeoutError."""
    call_count = 0

    async def permanently_locked_operation():
        nonlocal call_count
        call_count += 1
        raise SQLiteExecutionError("database is locked (SQLITE_BUSY)")

    delays = (0.01, 0.01, 0.01)
    with pytest.raises(SQLiteBusyTimeoutError):
        await execute_with_busy_retry(permanently_locked_operation, delays=delays)

    assert call_count == 4  # 1 initial + 3 retries


@pytest.mark.asyncio
async def test_non_busy_error_fails_immediately_without_retry():
    """Verify that non-busy syntax or schema errors are raised immediately without retrying."""
    call_count = 0

    async def syntax_error_operation():
        nonlocal call_count
        call_count += 1
        raise SQLiteExecutionError("syntax error near 'SELECT'")

    delays = (0.05, 0.05, 0.05)
    with pytest.raises(SQLiteExecutionError) as exc_info:
        await execute_with_busy_retry(syntax_error_operation, delays=delays)

    assert "syntax error" in str(exc_info.value)
    assert call_count == 1

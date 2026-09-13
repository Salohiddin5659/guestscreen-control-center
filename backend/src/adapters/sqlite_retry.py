# -*- coding: utf-8 -*-
"""Bounded retry engine for handling transient SQLite busy and lock contention (T039)."""
import asyncio
import logging
from typing import Any, Callable, Coroutine, Sequence

from src.core.exceptions import SQLiteBusyTimeoutError, SQLiteExecutionError

logger = logging.getLogger("guestscreen.sqlite_retry")

# Explicit retry delays in seconds (200ms, 500ms, 1000ms) per plan.md Section 11.2
DEFAULT_BUSY_DELAYS_SEC: Sequence[float] = (0.2, 0.5, 1.0)


def _is_busy_error(exc: Exception) -> bool:
    """Check if exception indicates database lock contention."""
    msg = str(exc).lower()
    return "database is locked" in msg or "sqlite_busy" in msg or "busy" in msg


async def execute_with_busy_retry(
    coro_fn: Callable[..., Coroutine[Any, Any, Any]],
    *args: Any,
    delays: Sequence[float] = DEFAULT_BUSY_DELAYS_SEC,
    **kwargs: Any,
) -> Any:
    """Execute an async SQLite operation with bounded exponential backoff on SQLITE_BUSY.

    Args:
        coro_fn: Async function to execute.
        *args: Positional arguments to forward to coro_fn.
        delays: Sequence of retry delays in seconds (default: 0.2s, 0.5s, 1.0s).
        **kwargs: Keyword arguments to forward to coro_fn.

    Returns:
        Result of coro_fn execution.

    Raises:
        SQLiteBusyTimeoutError: If all retry attempts are exhausted due to database locks.
        Exception: Any other exception is raised immediately without retry.
    """
    attempt = 0
    total_attempts = len(delays) + 1

    while True:
        try:
            return await coro_fn(*args, **kwargs)
        except (SQLiteExecutionError, Exception) as exc:
            if not _is_busy_error(exc):
                # Non-busy errors fail immediately
                raise

            if attempt >= len(delays):
                logger.error(
                    "SQLite lock contention exceeded bounded limit (%d attempts). Aborting transaction.",
                    total_attempts,
                )
                raise SQLiteBusyTimeoutError(
                    f"SQLite database is locked and bounded retry limit ({total_attempts} attempts) was exhausted."
                ) from exc

            delay = delays[attempt]
            logger.warning(
                "SQLite busy/locked on attempt %d/%d. Backing off for %.3fs...",
                attempt + 1,
                total_attempts,
                delay,
            )
            await asyncio.sleep(delay)
            attempt += 1

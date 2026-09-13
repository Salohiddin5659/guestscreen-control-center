# -*- coding: utf-8 -*-
"""Order boundary safety validator for UCS GuestScreen active orders (T062)."""
import hashlib
import logging
from typing import Dict, Optional, Tuple

import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter
from src.core.exceptions import SafetyBoundaryViolationError

logger = logging.getLogger("guestscreen.order_boundary_validator")

NON_AD_TABLES = ("licenses", "screens", "scenarios", "settings")


class OrderBoundaryValidator:
    """Certifies that non-advertising tables and active order data remain immutable."""

    def __init__(self, command_adapter: Optional[CashboxCommandAdapter] = None) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()

    async def compute_table_fingerprint(
        self,
        conn: asyncssh.SSHClientConnection,
        table_name: str,
        timeout: float = 10.0,
    ) -> Tuple[int, str]:
        """Compute row count and SHA-256 fingerprint of table contents in gs.db.

        Args:
            conn: Active SSH connection.
            table_name: Name of table (must be in NON_AD_TABLES).
            timeout: Command timeout.

        Returns:
            Tuple of (row_count, sha256_hash).

        Raises:
            SafetyBoundaryViolationError: If table_name is not allowed.
        """
        table_clean = table_name.strip().lower()
        if table_clean not in NON_AD_TABLES:
            raise SafetyBoundaryViolationError(
                f"Unauthorized table inspection: '{table_name}'. "
                f"Only non-advertising tables {NON_AD_TABLES} can be validated."
            )

        cmd = f'C:\\UCS\\GuestScreen\\sqlite3.exe "C:\\UCS\\GuestScreen\\gs.db" "SELECT * FROM {table_clean};"'
        res = await self.command_adapter._run_command(conn, cmd, timeout=timeout)
        if res.exit_status != 0:
            raise SafetyBoundaryViolationError(
                f"Failed to inspect table '{table_clean}': {res.stderr}"
            )

        raw_output = res.stdout.strip()
        rows = [line for line in raw_output.splitlines() if line.strip()]
        row_count = len(rows)
        content_hash = hashlib.sha256(raw_output.encode("utf-8")).hexdigest()

        return row_count, content_hash

    async def capture_baseline(
        self,
        conn: asyncssh.SSHClientConnection,
    ) -> Dict[str, Tuple[int, str]]:
        """Capture row counts and SHA-256 fingerprints across all non-advertising tables."""
        baseline: Dict[str, Tuple[int, str]] = {}
        for table in NON_AD_TABLES:
            count, table_hash = await self.compute_table_fingerprint(conn, table)
            baseline[table] = (count, table_hash)
            logger.debug("Captured baseline for '%s': %d rows, hash %s", table, count, table_hash)
        return baseline

    async def verify_boundary_unmodified(
        self,
        conn: asyncssh.SSHClientConnection,
        baseline: Dict[str, Tuple[int, str]],
    ) -> None:
        """Assert all non-advertising tables match baseline counts and checksums.

        Raises:
            SafetyBoundaryViolationError: If any table row count or hash changed.
        """
        for table, (expected_count, expected_hash) in baseline.items():
            current_count, current_hash = await self.compute_table_fingerprint(conn, table)
            if current_count != expected_count:
                raise SafetyBoundaryViolationError(
                    f"Retail safety boundary violated: Table '{table}' row count changed "
                    f"from {expected_count} to {current_count}."
                )
            if current_hash != expected_hash:
                raise SafetyBoundaryViolationError(
                    f"Retail safety boundary violated: Table '{table}' checksum changed. "
                    f"Expected {expected_hash}, got {current_hash}."
                )
        logger.info("Order boundary safety validated: 100% non-advertising tables remain immutable.")

# -*- coding: utf-8 -*-
"""AsyncSSH client connection pool with keepalive, timeout control, and health checking."""
import asyncio
import logging
from typing import Dict, List, Optional
import uuid

import asyncssh

from src.core.config import settings
from src.core.exceptions import CashboxAuthenticationError, CashboxOfflineError

logger = logging.getLogger("guestscreen.ssh_pool")


class SSHConnectionPool:
    """Manages reusable AsyncSSH connections to cashier monoblocks with automatic reconnect."""

    def __init__(
        self,
        connect_timeout: float = 10.0,
        keepalive_interval: float = 30.0,
    ) -> None:
        self.connect_timeout = connect_timeout
        self.keepalive_interval = keepalive_interval
        self._pool: Dict[uuid.UUID, asyncssh.SSHClientConnection] = {}
        self._lock = asyncio.Lock()

    async def get_connection(
        self,
        cashbox_id: uuid.UUID,
        host: str,
        port: int = 22,
        username: str = "Administrator",
        password: Optional[str] = None,
        client_keys: Optional[List[str]] = None,
        timeout: Optional[float] = None,
    ) -> asyncssh.SSHClientConnection:
        """Retrieve existing healthy SSH connection or establish a new authenticated session."""
        effective_timeout = timeout or self.connect_timeout

        async with self._lock:
            existing = self._pool.get(cashbox_id)
            if existing is not None:
                # Check if connection is still alive and responsive
                if not existing.is_closed():
                    return existing
                # Closed connection, clean up before reconnect
                self._pool.pop(cashbox_id, None)

            # Establish new connection
            try:
                conn_kwargs: dict = {
                    "host": host,
                    "port": port,
                    "username": username,
                    "known_hosts": None,
                    "keepalive_interval": self.keepalive_interval,
                    "connect_timeout": effective_timeout,
                }

                if client_keys:
                    conn_kwargs["client_keys"] = client_keys
                elif password:
                    conn_kwargs["password"] = password
                    conn_kwargs["client_keys"] = []
                    conn_kwargs["agent_path"] = None


                conn = await asyncio.wait_for(
                    asyncssh.connect(**conn_kwargs),
                    timeout=effective_timeout + 2.0,
                )

                self._pool[cashbox_id] = conn
                logger.debug(
                    "Established SSH connection to cashbox %s (%s:%d)",
                    cashbox_id,
                    host,
                    port,
                )
                return conn

            except asyncssh.PermissionDenied as exc:
                raise CashboxAuthenticationError(
                    f"SSH authentication failed for cashbox {cashbox_id} ({host}:{port}): {exc}"
                ) from exc
            except (asyncssh.Error, OSError, asyncio.TimeoutError) as exc:
                raise CashboxOfflineError(
                    f"Unable to reach cashbox {cashbox_id} at {host}:{port} via SSH: {exc}"
                ) from exc

    async def close_connection(self, cashbox_id: uuid.UUID) -> None:
        """Close and remove connection for a specific cashbox."""
        async with self._lock:
            conn = self._pool.pop(cashbox_id, None)
            if conn and not conn.is_closed():
                conn.close()
                await conn.wait_closed()

    async def close_all(self) -> None:
        """Close all cached connections in the pool."""
        async with self._lock:
            for cashbox_id, conn in list(self._pool.items()):
                if not conn.is_closed():
                    conn.close()
            self._pool.clear()

    async def __aenter__(self) -> "SSHConnectionPool":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close_all()

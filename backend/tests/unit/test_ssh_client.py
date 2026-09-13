# -*- coding: utf-8 -*-
"""Unit tests for SSHConnectionPool with mock server (T031)."""
import uuid
import pytest

from src.adapters.ssh_client import SSHConnectionPool
from src.core.exceptions import CashboxAuthenticationError, CashboxOfflineError
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_ssh_pool_connect_and_reuse():
    """Verify SSH connection establishment, caching, and reuse."""
    async with start_mock_cashbox_server(username="admin", password="secure_password") as (host, port):
        async with SSHConnectionPool() as pool:
            cashbox_id = uuid.uuid4()

            conn1 = await pool.get_connection(
                cashbox_id=cashbox_id,
                host=host,
                port=port,
                username="admin",
                password="secure_password",
            )
            assert conn1 is not None
            assert not conn1.is_closed()

            # Reusing same cashbox_id should return the exact same connection instance
            conn2 = await pool.get_connection(
                cashbox_id=cashbox_id,
                host=host,
                port=port,
                username="admin",
                password="secure_password",
            )
            assert conn1 is conn2

            # Close single connection
            await pool.close_connection(cashbox_id)
            assert conn1.is_closed()


@pytest.mark.asyncio
async def test_ssh_pool_authentication_failure():
    """Verify that wrong password raises CashboxAuthenticationError."""
    async with start_mock_cashbox_server(username="admin", password="correct_password") as (host, port):
        async with SSHConnectionPool() as pool:
            with pytest.raises(CashboxAuthenticationError):
                await pool.get_connection(
                    cashbox_id=uuid.uuid4(),
                    host=host,
                    port=port,
                    username="admin",
                    password="wrong_password",
                )


@pytest.mark.asyncio
async def test_ssh_pool_offline_unreachable():
    """Verify that connecting to an unreachable port raises CashboxOfflineError."""
    async with SSHConnectionPool(connect_timeout=1.0) as pool:
        with pytest.raises(CashboxOfflineError):
            await pool.get_connection(
                cashbox_id=uuid.uuid4(),
                host="127.0.0.1",
                port=59999,  # Unused port
                username="admin",
                password="password",
                timeout=1.0,
            )

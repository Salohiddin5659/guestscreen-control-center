# -*- coding: utf-8 -*-
"""Physical cashbox acceptance test suite targeting cashier monoblock 10.0.0.241 (T051)."""
import os
import pytest
import asyncssh

from src.adapters.command_adapter import SCENE_GUID_FULL, CashboxCommandAdapter
from src.adapters.scene_serializer import build_static_scene
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import CashboxOfflineError
from src.models.media import AdMode

CASHBOX_HOST = os.getenv("GS_ACCEPTANCE_HOST", "10.0.0.241")
CASHBOX_PORT = int(os.getenv("GS_ACCEPTANCE_PORT", "22"))
CASHBOX_USER = os.getenv("GS_ACCEPTANCE_USER", "Administrator")
CASHBOX_PASS = os.getenv("GS_ACCEPTANCE_PASS", "")


@pytest.mark.live_cashbox
@pytest.mark.asyncio
async def test_live_cashbox_241_full_static():
    """Acceptance test targeting physical cashier monoblock 10.0.0.241 with GuestScreen 3.1.1.0."""
    if not CASHBOX_PASS:
        pytest.skip("Physical cashbox acceptance test requires GS_ACCEPTANCE_PASS environment variable.")

    try:
        async with asyncssh.connect(
            CASHBOX_HOST,
            port=CASHBOX_PORT,
            username=CASHBOX_USER,
            password=CASHBOX_PASS,
            known_hosts=None,
            connect_timeout=5.0,
        ) as conn:
            adapter = CashboxCommandAdapter()
            sqlite_adapter = SQLiteSceneAdapter(adapter)

            # 1. Verify PING
            assert await adapter.ping(conn) is True

            # 2. Inspect inventory
            inv = await adapter.inventory(conn)
            assert isinstance(inv, list)

            # 3. Read current FULL SCREEN scene
            initial_scene = await sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
            assert initial_scene is not None

            # 4. Verify GuestScreen.exe is running
            proc_info = await adapter.proc_inspect(conn)
            assert proc_info is not None
            assert proc_info.pid > 0

    except (asyncssh.Error, OSError) as exc:
        pytest.skip(f"Cashier monoblock {CASHBOX_HOST}:{CASHBOX_PORT} currently unreachable: {exc}")

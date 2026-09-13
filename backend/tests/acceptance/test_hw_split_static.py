# -*- coding: utf-8 -*-
"""Physical cashbox acceptance test suite targeting cashier monoblock 10.0.0.241 for 50/50 Static (T065)."""
import os
import pytest
import asyncssh

from src.adapters.command_adapter import SCENE_GUID_SPLIT, CashboxCommandAdapter
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.services.order_boundary_validator import OrderBoundaryValidator

CASHBOX_HOST = os.getenv("GS_ACCEPTANCE_HOST", "10.0.0.241")
CASHBOX_PORT = int(os.getenv("GS_ACCEPTANCE_PORT", "22"))
CASHBOX_USER = os.getenv("GS_ACCEPTANCE_USER", "Administrator")
CASHBOX_PASS = os.getenv("GS_ACCEPTANCE_PASS", "")


@pytest.mark.live_cashbox
@pytest.mark.asyncio
async def test_live_cashbox_241_split_static():
    """Acceptance test targeting physical cashier monoblock 10.0.0.241 for 50/50 static promo block."""
    if not CASHBOX_PASS:
        pytest.skip("Physical cashbox acceptance test requires GS_ACCEPTANCE_PASS environment variable.")

    try:
        async with asyncssh.connect(
            CASHBOX_HOST,
            port=CASHBOX_PORT,
            username=CASHBOX_USER,
            password=CASHBOX_PASS,
            known_hosts=None,
            client_keys=[],
            connect_timeout=10.0,
            encoding="utf-8",
            errors="replace",
        ) as conn:
            adapter = CashboxCommandAdapter()
            sqlite_adapter = SQLiteSceneAdapter(adapter)
            boundary_validator = OrderBoundaryValidator(adapter)

            # 1. Verify PING
            assert await adapter.ping(conn) is True

            # 2. Inspect inventory
            inv = await adapter.inventory(conn)
            assert isinstance(inv, list)

            # 3. Read current 50/50 scene (GUID 68906ed2-49a3-4dc3-bb8a-6fa7943f39c3)
            initial_scene = await sqlite_adapter.read_scene(conn, SCENE_GUID_SPLIT)
            assert initial_scene is not None

            # 4. Verify Active GuestScreen.exe is PID 2128
            proc_info = await adapter.proc_inspect(conn)
            assert proc_info is not None
            assert proc_info.pid == 2128
            assert proc_info.classification == "ACTIVE"
            assert proc_info.has_port_2121 is True
            assert proc_info.has_libcef is True

            # 5. Capture non-ad table baseline
            baseline = await boundary_validator.capture_baseline(conn)
            assert set(baseline.keys()) == {"licenses", "screens", "scenarios", "settings"}

    except (asyncssh.Error, OSError) as exc:
        pytest.skip(f"Cashier monoblock {CASHBOX_HOST}:{CASHBOX_PORT} currently unreachable: {exc}")

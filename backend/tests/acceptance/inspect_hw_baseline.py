# -*- coding: utf-8 -*-
"""Inspect baseline state on physical cashier monoblock 10.0.0.241."""
import asyncio
import hashlib
import json
import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter, SCENE_GUID_FULL
from src.adapters.sqlite_adapter import SQLiteSceneAdapter


async def inspect():
    conn = await asyncssh.connect(
        "10.0.0.241",
        port=22,
        username="Administrator",
        password="123",
        known_hosts=None,
        client_keys=[],
        connect_timeout=10.0,
    )
    cmd = CashboxCommandAdapter()
    sql = SQLiteSceneAdapter(cmd)

    print("=== LIVE HARDWARE BASELINE INSPECTION (10.0.0.241) ===")

    # 1. Process info
    proc = await cmd.proc_inspect(conn, timeout=15.0)
    print(f"BASELINE_PID: {proc.pid if proc else 'NOT RUNNING'}")
    print(f"BASELINE_START_TIME: {proc.start_time if proc else 'N/A'}")

    # 2. GuestScreen.exe FileVersion
    res_ver = await conn.run(
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Item \'C:\\UCS\\GuestScreen\\GuestScreen.exe\').VersionInfo.FileVersion"'
    )
    print(f"GUESTSCREEN_VERSION: {res_ver.stdout.strip()}")

    # 3. Current FULL Scene Raw
    raw_full = await sql.read_scene(conn, SCENE_GUID_FULL)
    print(f"BASELINE_FULL_SCENE_RAW: {raw_full}")

    # 4. Current sync_version.txt
    res_sync = await conn.run(
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -LiteralPath \'C:\\UCS\\GuestScreen\\Front\\sync_version.txt\'"'
    )
    print(f"BASELINE_SYNC_VERSION: {res_sync.stdout.strip()}")

    # 5. Non-advertising table hashes
    tables = ["licenses", "screens", "scenarios", "settings"]
    for t in tables:
        q = f'C:\\UCS\\GuestScreen\\sqlite3.exe "C:\\UCS\\GuestScreen\\gs.db" "SELECT * FROM {t};"'
        res_t = await conn.run(q)
        content_hash = hashlib.sha256(res_t.stdout.strip().encode("utf-8")).hexdigest()
        print(f"BASELINE_HASH_{t.upper()}: {content_hash}")

    # 6. Current media files in uploads
    inv = await cmd.inventory(conn)
    print(f"BASELINE_UPLOADS_COUNT: {len(inv)}")
    for item in inv:
        print(f"  FILE: {item.filename} | SIZE: {item.size} | SHA256: {item.sha256}")

    conn.close()


if __name__ == "__main__":
    asyncio.run(inspect())

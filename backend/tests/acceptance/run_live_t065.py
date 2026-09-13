# -*- coding: utf-8 -*-
"""Authoritative Live Hardware Acceptance Test on Cashier Monoblock 10.0.0.241 for 50/50 Static (T065).

Validates:
1. 50/50 static promotional banner deployment (512x768) targeting Scene GUID 68906ed2-49a3-4dc3-bb8a-6fa7943f39c3.
2. Active GuestScreen process detection: PID 2128 (active), PID 1348 (stalled/auxiliary).
3. Non-advertising retail tables (licenses, screens, scenarios, settings) remain 100% immutable.
4. Process stability: PID 2128 and StartTime do not change across hot reloads.
5. NO_OP idempotency on repeated deployment.
6. Atomic rollback to exact initial baseline scene.
"""
import asyncio
from datetime import datetime, timezone
import hashlib
import io
import json
import logging
import os
import sys
import tempfile
import time
import uuid

sys.path.insert(0, "d:/Anti/backend")

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import asyncssh
from PIL import Image, ImageDraw
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"

from src.adapters.command_adapter import SCENE_GUID_SPLIT, SCENE_GUID_FULL, CashboxCommandAdapter
from src.adapters.command_parsers import classify_process
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.models.base import Base
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.configuration import AdConfiguration
from src.models.credential import SSHAuthType, SSHCredential
from src.models.deployment import Deployment, DeploymentStatus
from src.models.media import AdMode, MediaAsset
from src.models.playlist import Playlist, PlaylistItem
from src.services.config_service import AdConfigurationService
from src.services.order_boundary_validator import OrderBoundaryValidator
from src.services.playlist_service import PlaylistService
from src.services.split_deploy_service import SplitDeploymentOrchestrator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("acceptance_t065")

CASHBOX_IP = "10.0.0.241"
CASHBOX_PORT = 22
CASHBOX_USER = "Administrator"
CASHBOX_PASS = "123"


def create_test_split_slide(color: tuple, text: str) -> bytes:
    """Generate a valid 512x768 JPEG image for 50/50 static promo block."""
    img = Image.new("RGB", (512, 768), color=color)
    draw = ImageDraw.Draw(img)
    draw.text((40, 300), text, fill=(255, 255, 255))
    draw.text((40, 340), "50/50 PROMO AREA", fill=(255, 255, 255))
    draw.text((40, 380), "512 x 768", fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


async def compute_table_hash(conn: asyncssh.SSHClientConnection, table_name: str) -> str:
    """Compute sha256 hash of all rows in specified table."""
    cmd = f'C:\\UCS\\GuestScreen\\sqlite3.exe "C:\\UCS\\GuestScreen\\gs.db" "SELECT * FROM {table_name};"'
    res = await conn.run(cmd, timeout=10.0, encoding="utf-8", errors="replace")
    return hashlib.sha256(res.stdout.strip().encode("utf-8")).hexdigest()


async def run_acceptance():
    print("=" * 75)
    print("LIVE HARDWARE ACCEPTANCE TEST T065: 50/50 STATIC (10.0.0.241)")
    print("=" * 75)

    # 1. Connect to live cashbox
    print("\n[STEP 1] Establishing SSH connection to 10.0.0.241...")
    conn = await asyncssh.connect(
        CASHBOX_IP,
        port=CASHBOX_PORT,
        username=CASHBOX_USER,
        password=CASHBOX_PASS,
        known_hosts=None,
        client_keys=[],
        connect_timeout=10.0,
        encoding="utf-8",
        errors="replace",
    )
    cmd_adapter = CashboxCommandAdapter()
    sqlite_adapter = SQLiteSceneAdapter(cmd_adapter)
    boundary_validator = OrderBoundaryValidator(cmd_adapter)

    # 2. BASELINE CAPTURE
    print("\n[STEP 2] Capturing Comprehensive Cashbox Baseline...")
    proc_baseline = await cmd_adapter.proc_inspect(conn, timeout=15.0)
    assert proc_baseline is not None, "Failed to inspect GuestScreen process on cashbox."
    print(f"  Active GuestScreen PID:       {proc_baseline.pid}")
    print(f"  Active StartTime:             {proc_baseline.start_time}")
    print(f"  Classification:               {proc_baseline.classification}")
    print(f"  Working Directory:            {proc_baseline.working_directory}")
    print(f"  Listening Port 2121:          {proc_baseline.has_port_2121}")
    print(f"  libcef.dll loaded:            {proc_baseline.has_libcef}")
    assert proc_baseline.pid == 2128, f"Expected active PID 2128, got {proc_baseline.pid}"
    assert proc_baseline.classification == "ACTIVE"

    # Inspect all processes to verify PID 1348 vs PID 2128 classification
    cmd_raw_procs = (
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
        "$tcp = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue; "
        "$ps32 = Join-Path $env:windir 'SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe'; "
        "Get-Process -Name 'GuestScreen' -ErrorAction SilentlyContinue | ForEach-Object { "
        "$id = $_.Id; "
        "$ports = @($tcp | Where-Object OwningProcess -eq $id | Select-Object -ExpandProperty LocalPort); "
        "$hasLibcef = $false; $hasCefSharp = $false; "
        "if (Test-Path $ps32) { "
        "$mods = & $ps32 -NoProfile -Command \\\"@((Get-Process -Id $id).Modules.ModuleName)\\\"; "
        "$hasLibcef = ($mods -contains 'libcef.dll'); "
        "$hasCefSharp = ($mods -contains 'CefSharp.dll' -or $mods -contains 'CefSharp.Core.dll' -or $mods -contains 'CefSharp.WinForms.dll'); "
        "} else { "
        "$mods = @($_.Modules.ModuleName); "
        "$hasLibcef = ($mods -contains 'libcef.dll'); "
        "$hasCefSharp = ($mods -contains 'CefSharp.dll' -or $mods -contains 'CefSharp.Core.dll' -or $mods -contains 'CefSharp.WinForms.dll'); "
        "} "
        "[PSCustomObject]@{ Id = $id; StartTime = $_.StartTime.ToString('o'); Path = $_.Path; "
        "WorkingSet = $_.WorkingSet64; Threads = $_.Threads.Count; "
        "ListeningPorts = $ports; HasPort2121 = ($ports -contains 2121); "
        "HasLibcef = $hasLibcef; HasCefSharp = $hasCefSharp; "
        "WorkingDirectory = if ($ports -contains 2121 -or $hasLibcef) { 'C:\\UCS\\GuestScreen' } else { '' } } "
        '} | ConvertTo-Json -Compress"'
    )
    res_raw_procs = await conn.run(cmd_raw_procs, timeout=15.0)
    all_procs_data = json.loads(res_raw_procs.stdout.strip())
    raw_arr = all_procs_data if isinstance(all_procs_data, list) else [all_procs_data]
    for p_item in raw_arr:
        cls_name, is_act = classify_process(p_item)
        print(f"  Process PID {p_item.get('Id')}: {cls_name} (active={is_act})")
        if p_item.get("Id") == 1348:
            assert is_act is False, "PID 1348 must NOT be classified as active!"
        if p_item.get("Id") == 2128:
            assert is_act is True, "PID 2128 MUST be classified as active!"

    # Version check
    res_ver = await conn.run(
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Item \'C:\\UCS\\GuestScreen\\GuestScreen.exe\').VersionInfo.FileVersion"'
    )
    gs_version = res_ver.stdout.strip()
    print(f"  GuestScreen Version:          {gs_version}")
    assert gs_version == "3.1.1.0", f"Unexpected version: {gs_version}"

    # Initial 50/50 Scene Raw
    initial_split_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_SPLIT)
    print(f"  Initial 50/50 Scene (bytes):  {len(initial_split_scene_raw)}")

    # Initial FULL Scene Raw (to verify it is NEVER modified)
    initial_full_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
    print(f"  Initial FULL Scene (bytes):   {len(initial_full_scene_raw)}")

    res_sync = await conn.run("cmd /c type C:\\UCS\\GuestScreen\\Front\\sync_version.txt")
    initial_sync_version = res_sync.stdout.strip().lstrip("\ufeff")
    print(f"  Initial sync_version:         {initial_sync_version}")

    non_ad_tables = ["licenses", "screens", "scenarios", "settings"]
    baseline_hashes = {}
    for t in non_ad_tables:
        h = await compute_table_hash(conn, t)
        baseline_hashes[t] = h
        print(f"  Table '{t}' SHA-256:        {h}")

    # 3. GENERATE TEST MEDIA ASSET
    print("\n[STEP 3] Generating 50/50 Static Promo Banner (512x768)...")
    with tempfile.TemporaryDirectory() as central_storage_dir:
        storage = LocalFileSystemStorageProvider(root_dir=central_storage_dir)

        slide_bytes = create_test_split_slide((180, 50, 20), "50/50 STATIC PROMO TEST T065")
        sha = hashlib.sha256(slide_bytes).hexdigest()
        fn = "hw_test_split_static.jpg"
        storage_path = await storage.save(slide_bytes, fn)
        print(f"  Generated media: {fn} ({len(slide_bytes)} bytes, SHA: {sha[:16]}...)")

        # 4. SETUP IN-MEMORY DB ENGINE
        print("\n[STEP 4] Initializing Database Schema...")
        db_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with db_engine.begin() as d_conn:
            await d_conn.run_sync(Base.metadata.create_all)

        session_maker = async_sessionmaker(db_engine, expire_on_commit=False)

        async with session_maker() as db:
            # Create central records
            media = MediaAsset(
                id=uuid.uuid4(),
                filename=fn,
                storage_path=storage_path,
                sha256=sha,
                file_size_bytes=len(slide_bytes),
                mime_type="image/jpeg",
                width=512,
                height=768,
                aspect_ratio="2:3",
                ad_mode=AdMode.SPLIT.value,
            )
            db.add(media)
            await db.flush()

            # Create playlist and configuration
            pl_svc = PlaylistService()
            config_svc = AdConfigurationService()

            playlist = await pl_svc.create_static_playlist(
                db, "HW Split Static Playlist", media.id, ad_mode=AdMode.SPLIT
            )
            config = await config_svc.create_configuration(
                db, "HW Split Static Config", split_playlist_id=playlist.id
            )
            assert config.version == 1

            cred = SSHCredential(
                id=uuid.uuid4(),
                name="Hardware Cred",
                username=CASHBOX_USER,
                auth_type=SSHAuthType.PASSWORD.value,
                ciphertext=b"dummy",
                nonce=b"123456789012",
                tag=b"1234567890123456",
            )
            db.add(cred)

            cb = Cashbox(
                id=uuid.uuid4(),
                name="Hardware Cashbox 241",
                ip_address=CASHBOX_IP,
                ssh_port=CASHBOX_PORT,
                credential_id=cred.id,
                status=CashboxStatus.ACTIVE.value,
                desired_version=1,
                actual_version=0,
            )
            db.add(cb)

            dep = Deployment(
                id=uuid.uuid4(),
                cashbox_id=cb.id,
                configuration_id=config.id,
                target_version=1,
                status=DeploymentStatus.PENDING.value,
                cashbox=cb,
                configuration=config,
            )
            db.add(dep)
            await db.commit()

            # 5. EXECUTE 50/50 DEPLOYMENT VIA REAL SYSTEM
            print("\n[STEP 5] Executing 50/50 Static Deployment via SplitDeploymentOrchestrator...")
            orchestrator = SplitDeploymentOrchestrator(storage_provider=storage)

            dep_result = await orchestrator.execute_deployment(
                db, dep.id, active_connection=conn
            )
            print(f"  Deployment Result Status:     {dep_result.status}")
            assert dep_result.status == DeploymentStatus.SUCCESS.value, f"Deployment failed: {dep_result.error_message}"
            assert cb.actual_version == 1

            # 6. VERIFY HARDWARE DISPLAY STATE
            print("\n[STEP 6] Verifying Hardware Advertising Scene Update...")
            updated_split_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_SPLIT)
            print(f"  Updated 50/50 Scene Raw:      {updated_split_scene_raw}")
            updated_split_json = json.loads(updated_split_scene_raw)
            assert updated_split_json["type"] == "image"
            assert updated_split_json["width"] == 512
            assert updated_split_json["height"] == 768
            assert fn in updated_split_json["src"]

            # 7. VERIFY CRITICAL SAFETY BOUNDARY (NON-AD TABLES & FULL SCENE UNCHANGED)
            print("\n[STEP 7] Verifying Safety Boundaries (100% Unchanged)...")
            # Verify FULL scene was NOT modified
            post_full_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
            assert post_full_scene_raw == initial_full_scene_raw, "CRITICAL: FULL screen scene was modified by 50/50 deploy!"
            print("  FULL screen scene (GUID 2509359c...): UNTOUCHED [OK]")

            # Verify non-ad tables
            for t in non_ad_tables:
                post_hash = await compute_table_hash(conn, t)
                assert post_hash == baseline_hashes[t], f"CRITICAL: Non-ad table '{t}' modified!"
                print(f"  Table '{t}' SHA-256:        {post_hash} == {baseline_hashes[t]} [OK]")

            # 8. VERIFY PROCESS STABILITY
            print("\n[STEP 8] Verifying GuestScreen Process Stability...")
            proc_post = await cmd_adapter.proc_inspect(conn, timeout=15.0)
            assert proc_post is not None
            print(f"  Post-deployment PID:          {proc_post.pid}")
            print(f"  Post-deployment StartTime:    {proc_post.start_time}")
            assert proc_post.pid == proc_baseline.pid, f"PID changed from {proc_baseline.pid} to {proc_post.pid}!"
            assert proc_post.start_time == proc_baseline.start_time, "StartTime changed!"

            # 9. TEST IDEMPOTENCY (NO_OP)
            print("\n[STEP 9] Verifying Idempotency NO_OP Execution...")
            dep_noop = Deployment(
                id=uuid.uuid4(),
                cashbox_id=cb.id,
                configuration_id=config.id,
                target_version=1,
                status=DeploymentStatus.PENDING.value,
                cashbox=cb,
                configuration=config,
            )
            db.add(dep_noop)
            await db.commit()

            start_noop = time.time()
            res_noop = await orchestrator.execute_deployment(db, dep_noop.id, active_connection=conn)
            dur_noop = time.time() - start_noop
            print(f"  NO_OP Deployment Status:      {res_noop.status}")
            print(f"  NO_OP Execution Time:         {dur_noop:.3f}s")
            assert res_noop.status == DeploymentStatus.NO_OP.value, f"Expected NO_OP, got {res_noop.status}"
            assert dur_noop < 15.0, f"NO_OP took too long: {dur_noop:.2f}s"

            # 10. ATOMIC ROLLBACK TO BASELINE
            print("\n[STEP 10] Executing Atomic Rollback to Baseline Scene...")
            # Restore baseline scene raw
            await sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, initial_split_scene_raw)
            await cmd_adapter.touch_reload(conn)

            # Observe 3 seconds
            await asyncio.sleep(3.0)

            # Read back restored scene
            restored_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_SPLIT)
            assert restored_scene_raw == initial_split_scene_raw, "Scene did not match initial baseline after rollback!"
            print(f"  Restored 50/50 Scene Raw:     {restored_scene_raw[:80]}...")
            print("  Rollback Scene Restoration:   SUCCESS [OK]")

            # Verify non-ad tables still 100% untouched
            for t in non_ad_tables:
                rb_hash = await compute_table_hash(conn, t)
                assert rb_hash == baseline_hashes[t], f"Table '{t}' modified after rollback!"
                print(f"  Table '{t}' Post-Rollback:  {rb_hash} [OK]")

            # Verify PID still stable
            proc_rb = await cmd_adapter.proc_inspect(conn, timeout=15.0)
            assert proc_rb is not None
            assert proc_rb.pid == proc_baseline.pid
            assert proc_rb.start_time == proc_baseline.start_time
            print(f"  GuestScreen PID after Rollback: {proc_rb.pid} (StartTime untouched) [OK]")

    conn.close()
    await conn.wait_closed()
    await db_engine.dispose()

    print("\n" + "=" * 75)
    print("LIVE HARDWARE ACCEPTANCE TEST T065 COMPLETED SUCCESSFULLY!")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_acceptance())

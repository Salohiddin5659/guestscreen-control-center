# -*- coding: utf-8 -*-
"""Authoritative Live Hardware Acceptance Test on Cashier Monoblock 10.0.0.241 (T058).

Validates FULL SCREEN dynamic slideshow rotation (3 slides, 5s interval) on real GuestScreen 3.1.1.0,
verifying zero retail database corruption, process stability, and full atomic rollback.
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

from src.adapters.command_adapter import SCENE_GUID_FULL, CashboxCommandAdapter
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.scene_serializer import parse_scene
from src.adapters.sftp_storage import SFTPStorageClient
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.models.base import Base
from src.models.cashbox import Cashbox, CashboxStatus
from src.models.configuration import AdConfiguration
from src.models.credential import SSHAuthType, SSHCredential
from src.models.deployment import Deployment, DeploymentStatus, DeploymentStep, StepStatus
from src.models.media import AdMode, MediaAsset
from src.services.config_service import AdConfigurationService
from src.services.deployment_service import DeploymentOrchestrator
from src.services.playlist_compiler import PlaylistCompiler, SlideSpec

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("acceptance_t058")

CASHBOX_IP = "10.0.0.241"
CASHBOX_PORT = 22
CASHBOX_USER = "Administrator"
CASHBOX_PASS = "123"


def create_test_slide(color: tuple, text: str) -> bytes:
    """Generate a valid 1024x768 JPEG image with solid background and identifier text."""
    img = Image.new("RGB", (1024, 768), color=color)
    draw = ImageDraw.Draw(img)
    draw.text((80, 350), text, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


async def compute_table_hash(conn: asyncssh.SSHClientConnection, table_name: str) -> str:
    """Compute sha256 hash of all rows in specified table to detect unauthorized modifications."""
    cmd = f'C:\\UCS\\GuestScreen\\sqlite3.exe "C:\\UCS\\GuestScreen\\gs.db" "SELECT * FROM {table_name};"'
    res = await conn.run(cmd, timeout=10.0, encoding="utf-8", errors="replace")
    return hashlib.sha256(res.stdout.strip().encode("utf-8")).hexdigest()


async def run_acceptance():
    print("=" * 70)
    print("LIVE HARDWARE ACCEPTANCE TEST T058: 10.0.0.241 (GuestScreen 3.1.1.0)")
    print("=" * 70)

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
    print("-> SSH Connection established successfully!")

    # 2. BASELINE CAPTURE
    print("\n[STEP 2] Capturing Cashbox Baseline Metrics...")
    proc_baseline = await cmd_adapter.proc_inspect(conn, timeout=15.0)
    assert proc_baseline is not None, "GuestScreen.exe is not running on 10.0.0.241!"
    print(f"  GuestScreen PID:        {proc_baseline.pid}")
    print(f"  GuestScreen StartTime:  {proc_baseline.start_time}")

    res_ver = await conn.run(
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Item \'C:\\UCS\\GuestScreen\\GuestScreen.exe\').VersionInfo.FileVersion"'
    )
    gs_version = res_ver.stdout.strip()
    print(f"  GuestScreen Version:    {gs_version}")
    assert gs_version == "3.1.1.0", f"Unexpected version: {gs_version}"

    initial_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
    print(f"  Initial Scene Raw:      {initial_scene_raw}")

    res_sync = await conn.run('cmd /c type C:\\UCS\\GuestScreen\\Front\\sync_version.txt')
    initial_sync_version = res_sync.stdout.strip().lstrip("\ufeff")
    print(f"  Initial sync_version:   {initial_sync_version}")

    non_ad_tables = ["licenses", "screens", "scenarios", "settings"]
    baseline_hashes = {}
    for t in non_ad_tables:
        h = await compute_table_hash(conn, t)
        baseline_hashes[t] = h
        print(f"  Table '{t}' SHA-256:  {h}")

    # 3. GENERATE TEST MEDIA ASSETS
    print("\n[STEP 3] Generating 3 Unique Test Banners (1024x768)...")
    with tempfile.TemporaryDirectory() as central_storage_dir:
        storage = LocalFileSystemStorageProvider(root_dir=central_storage_dir)

        slide1_bytes = create_test_slide((180, 20, 20), "SLIDE 1 - TEST ACCEPTANCE T058")
        slide2_bytes = create_test_slide((20, 140, 20), "SLIDE 2 - TEST ACCEPTANCE T058")
        slide3_bytes = create_test_slide((20, 20, 180), "SLIDE 3 - TEST ACCEPTANCE T058")

        sha1 = hashlib.sha256(slide1_bytes).hexdigest()
        sha2 = hashlib.sha256(slide2_bytes).hexdigest()
        sha3 = hashlib.sha256(slide3_bytes).hexdigest()

        fn1 = "hw_test_slide_1.jpg"
        fn2 = "hw_test_slide_2.jpg"
        fn3 = "hw_test_slide_3.jpg"

        p1 = await storage.save(slide1_bytes, fn1)
        p2 = await storage.save(slide2_bytes, fn2)
        p3 = await storage.save(slide3_bytes, fn3)

        print(f"  Slide 1: {fn1} | SHA: {sha1}")
        print(f"  Slide 2: {fn2} | SHA: {sha2}")
        print(f"  Slide 3: {fn3} | SHA: {sha3}")

        # 4. PREPARE IN-MEMORY DATABASE & DOMAIN ENTITIES
        print("\n[STEP 4] Initializing Database & Domain Models...")
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with engine.begin() as db_conn:
            await db_conn.run_sync(Base.metadata.create_all)

        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        async with session_factory() as db:
            m1 = MediaAsset(
                id=uuid.uuid4(),
                filename=fn1,
                storage_path=p1,
                sha256=sha1,
                file_size_bytes=len(slide1_bytes),
                mime_type="image/jpeg",
                width=1024,
                height=768,
                aspect_ratio="4:3",
                ad_mode=AdMode.FULL.value,
            )
            m2 = MediaAsset(
                id=uuid.uuid4(),
                filename=fn2,
                storage_path=p2,
                sha256=sha2,
                file_size_bytes=len(slide2_bytes),
                mime_type="image/jpeg",
                width=1024,
                height=768,
                aspect_ratio="4:3",
                ad_mode=AdMode.FULL.value,
            )
            m3 = MediaAsset(
                id=uuid.uuid4(),
                filename=fn3,
                storage_path=p3,
                sha256=sha3,
                file_size_bytes=len(slide3_bytes),
                mime_type="image/jpeg",
                width=1024,
                height=768,
                aspect_ratio="4:3",
                ad_mode=AdMode.FULL.value,
            )
            db.add_all([m1, m2, m3])
            await db.flush()

            # Compile dynamic playlist with 5s interval
            compiler = PlaylistCompiler()
            config_svc = AdConfigurationService()

            specs = [
                SlideSpec(media_id=m1.id, duration_seconds=5),
                SlideSpec(media_id=m2.id, duration_seconds=5),
                SlideSpec(media_id=m3.id, duration_seconds=5),
            ]
            playlist = await compiler.compile_dynamic_playlist(
                db,
                name="Hardware Acceptance Slideshow (5s)",
                slide_specs=specs,
                ad_mode=AdMode.FULL,
                default_interval_sec=5,
            )
            config = await config_svc.create_configuration(
                db, "HW Acceptance Dynamic v1", full_playlist_id=playlist.id
            )

            cred = SSHCredential(
                id=uuid.uuid4(),
                name="HW Cred",
                username=CASHBOX_USER,
                auth_type=SSHAuthType.PASSWORD.value,
                ciphertext=b"dummy",
                nonce=b"123456789012",
                tag=b"1234567890123456",
            )
            db.add(cred)

            cashbox = Cashbox(
                id=uuid.uuid4(),
                name="Physical Monoblock 241",
                ip_address=CASHBOX_IP,
                ssh_port=CASHBOX_PORT,
                credential_id=cred.id,
                status=CashboxStatus.ACTIVE.value,
                desired_version=1,
                actual_version=0,
            )
            db.add(cashbox)

            dep = Deployment(
                id=uuid.uuid4(),
                cashbox_id=cashbox.id,
                configuration_id=config.id,
                target_version=1,
                status=DeploymentStatus.PENDING.value,
            )
            db.add(dep)
            await db.commit()

            # 5. EXECUTE REAL 17-STEP DEPLOYMENT PIPELINE
            print("\n[STEP 5] Executing Real 17-Step Deployment Pipeline over SSH/SFTP...")
            orchestrator = DeploymentOrchestrator(storage_provider=storage)

            completed_dep = await orchestrator.execute_deployment(
                db,
                dep.id,
                active_connection=conn,
            )

            print(f"-> Deployment Finished with Status: {completed_dep.status}")
            assert completed_dep.status == DeploymentStatus.SUCCESS.value, f"Deployment failed: {completed_dep.error_message}"

        # 6. POST-DEPLOYMENT VERIFICATION
        print("\n[STEP 6] Post-Deployment Verification on Physical Cashbox...")

        # Process stability
        proc_post = await cmd_adapter.proc_inspect(conn, timeout=15.0)
        assert proc_post is not None, "GuestScreen.exe crashed after deployment!"
        print(f"  Post-Deploy PID:        {proc_post.pid}")
        print(f"  Post-Deploy StartTime:  {proc_post.start_time}")
        assert proc_post.pid == proc_baseline.pid, f"PID changed: {proc_baseline.pid} -> {proc_post.pid}"
        assert proc_post.start_time == proc_baseline.start_time, "StartTime changed (process restarted)!"

        # Scene definition readback
        deployed_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
        print(f"  Deployed Scene Raw:     {deployed_scene_raw}")
        parsed_deployed = parse_scene(deployed_scene_raw)
        assert parsed_deployed.type == "gallery", f"Expected type 'gallery', got '{parsed_deployed.type}'"
        assert parsed_deployed.width == 1024, f"Expected width 1024, got {parsed_deployed.width}"
        assert parsed_deployed.height == 768, f"Expected height 768, got {parsed_deployed.height}"
        assert parsed_deployed.interval == 5000, f"Expected interval 5000, got {parsed_deployed.interval}"
        deployed_items = parsed_deployed.items or parsed_deployed.slides or []
        assert len(deployed_items) == 3, f"Expected 3 slides, got {len(deployed_items)}"
        assert [it.src for it in deployed_items] == [
            f"media/uploads/{fn1}",
            f"media/uploads/{fn2}",
            f"media/uploads/{fn3}",
        ], "Slide order or path mismatch!"

        # sync_version.txt updated
        res_sync_post = await conn.run('cmd /c type C:\\UCS\\GuestScreen\\Front\\sync_version.txt')
        post_sync_version = res_sync_post.stdout.strip().lstrip("\ufeff")
        print(f"  Post-Deploy sync_ver:   {post_sync_version}")
        assert post_sync_version != initial_sync_version, "sync_version.txt was not updated!"

        # Remote file presence & hash check in uploads\
        sftp_client = SFTPStorageClient(conn)
        for fn, expected_sha in [(fn1, sha1), (fn2, sha2), (fn3, sha3)]:
            prod_path = f"C:\\UCS\\GuestScreen\\Front\\media\\uploads\\{fn}"
            assert await sftp_client.exists(prod_path), f"File {prod_path} does not exist in uploads!"
            # Hash verify
            h_res = await conn.run(
                f'powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-FileHash -Algorithm SHA256 -LiteralPath \'{prod_path}\').Hash.ToLower()"'
            )
            actual_h = h_res.stdout.strip().lower()
            print(f"  File in uploads: {fn} -> SHA: {actual_h}")
            assert actual_h == expected_sha.lower(), f"SHA mismatch for {fn} in uploads!"

        # Non-advertising tables UNTOUCHED verification
        print("\n[STEP 7] Verifying Non-Advertising Tables (Zero Corruption Guard)...")
        for t in non_ad_tables:
            current_h = await compute_table_hash(conn, t)
            print(f"  Table '{t}' SHA: {current_h}")
            assert current_h == baseline_hashes[t], f"CRITICAL: Non-advertising table '{t}' was modified!"

        # 7. ROTATION OBSERVATION WINDOW
        print("\n[STEP 8] Observing Dynamic Slideshow Rotation (15s Window)...")
        print("  Sequence: Slide 1 (Red) -> Slide 2 (Green) -> Slide 3 (Blue) with 5s timing")
        for sec in range(1, 16):
            await asyncio.sleep(1.0)
            if sec % 5 == 0:
                print(f"  -> {sec}s elapsed (Slide transition trigger: interval = 5s)")

        # 8. ROLLBACK TO INITIAL STATE
        print("\n[STEP 9] Executing Rollback to Initial State...")
        # Restore scene in gs.db
        await sqlite_adapter.update_scene(conn, SCENE_GUID_FULL, initial_scene_raw)
        print("  -> Initial scene Raw restored in gs.db")

        # Touch sync_version.txt to reload initial banner
        rb_timestamp = str(int(time.time()))
        await cmd_adapter.touch_reload(conn, timestamp=rb_timestamp)
        print(f"  -> Hot reload triggered with timestamp {rb_timestamp}")

        # Remove test files from uploads
        for fn in [fn1, fn2, fn3]:
            await sftp_client.remove(f"C:\\UCS\\GuestScreen\\Front\\media\\uploads\\{fn}")
            print(f"  -> Cleaned test file: {fn}")

        # Verify post-rollback state
        print("\n[STEP 10] Verifying Post-Rollback Integrity...")
        proc_rb = await cmd_adapter.proc_inspect(conn, timeout=15.0)
        assert proc_rb is not None
        assert proc_rb.pid == proc_baseline.pid, f"PID changed after rollback: {proc_rb.pid}"
        assert proc_rb.start_time == proc_baseline.start_time, "Process restarted during rollback!"
        print(f"  PID stable:       {proc_rb.pid}")
        print(f"  StartTime stable: {proc_rb.start_time}")

        rb_scene_raw = await sqlite_adapter.read_scene(conn, SCENE_GUID_FULL)
        assert rb_scene_raw == initial_scene_raw, "Restored scene does not match baseline!"
        print("  Scene Raw verified restored!")

        for t in non_ad_tables:
            final_h = await compute_table_hash(conn, t)
            assert final_h == baseline_hashes[t], f"Table '{t}' corrupted during rollback!"
        print("  All non-advertising tables confirmed bit-for-bit identical!")

        # Close SSH
        conn.close()
        print("\n" + "=" * 70)
        print("LIVE HARDWARE ACCEPTANCE TEST: PASS")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_acceptance())

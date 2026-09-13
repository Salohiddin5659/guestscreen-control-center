# -*- coding: utf-8 -*-
"""Security injection and execution tests for CashboxCommandAdapter (T036)."""
import json
import uuid
import pytest
import asyncssh

from src.adapters.command_adapter import (
    ALLOWED_SCENE_GUIDS,
    SCENE_GUID_FULL,
    SCENE_GUID_SPLIT,
    CashboxCommandAdapter,
)
from src.core.exceptions import (
    SafetyBoundaryViolationError,
    SQLiteExecutionError,
    UnauthorizedCommandError,
)
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_allowlist_happy_path_all_commands():
    """Verify successful execution of all 8 allowlisted commands against mock cashier."""
    async with start_mock_cashbox_server(username="admin", password="password") as (host, port):
        async with asyncssh.connect(
            host, port=port, username="admin", password="password", known_hosts=None
        ) as conn:
            adapter = CashboxCommandAdapter()

            # 1. CMD_PING
            assert await adapter.ping(conn) is True

            # 2. CMD_INVENTORY
            inv = await adapter.inventory(conn)
            assert len(inv) == 1
            assert inv[0].filename == "promo_1024x768.jpg"

            # 3. CMD_HASH_VERIFY
            dep_id = str(uuid.uuid4())
            hash_res = await adapter.hash_verify(conn, dep_id, "promo_1024x768.jpg")
            assert len(hash_res) == 64

            # 4. CMD_STAGING_MOVE
            await adapter.staging_move(conn, dep_id, "promo_1024x768.jpg")

            # 5. CMD_SQLITE_READ_SCENE (FULL & SPLIT)
            full_scene = await adapter.sqlite_read(conn, SCENE_GUID_FULL)
            assert "FULL_SCREEN" in full_scene
            split_scene = await adapter.sqlite_read(conn, SCENE_GUID_SPLIT)
            assert split_scene is not None

            # 6. CMD_SQLITE_UPDATE_SCENE
            payload = json.dumps({"guid": SCENE_GUID_FULL, "ad": "new_campaign"})
            await adapter.sqlite_update(conn, SCENE_GUID_FULL, payload)

            # 7. CMD_TOUCH_RELOAD
            await adapter.touch_reload(conn, timestamp="1700000000000")

            # 8. CMD_PROC_INSPECT
            proc = await adapter.proc_inspect(conn)
            assert proc is not None
            assert proc.pid == 4120


@pytest.mark.asyncio
async def test_safety_boundary_unauthorized_scene_guids():
    """Verify that attempting to touch non-advertising scenes is blocked with SafetyBoundaryViolationError."""
    adapter = CashboxCommandAdapter()
    conn = None  # type: ignore

    # Non-advertising GUID
    evil_guid = "00000000-0000-0000-0000-000000000000"
    with pytest.raises(SafetyBoundaryViolationError) as exc_info:
        await adapter.sqlite_read(conn, evil_guid)
    assert "Modifying non-advertising scenes is strictly forbidden" in str(exc_info.value)

    # SQL injection attempt via GUID parameter
    injection_guid = f"{SCENE_GUID_FULL}'; DROP TABLE licenses; --"
    with pytest.raises(SafetyBoundaryViolationError):
        await adapter.sqlite_read(conn, injection_guid)

    with pytest.raises(SafetyBoundaryViolationError):
        await adapter.sqlite_update(conn, injection_guid, '{"test": 1}')


@pytest.mark.asyncio
async def test_injection_prevention_in_deployment_id():
    """Verify rejection of shell metacharacters in deployment_id."""
    adapter = CashboxCommandAdapter()
    conn = None  # type: ignore

    malicious_ids = [
        "12345678-1234-1234-1234-123456789abc; calc.exe",
        "12345678-1234-1234-1234-123456789abc & calc.exe",
        "12345678-1234-1234-1234-123456789abc | powershell evil.ps1",
        "12345678-1234-1234-1234-123456789abc `whoami`",
        "../../etc/passwd",
        "$(calc.exe)",
    ]

    for evil_id in malicious_ids:
        with pytest.raises(UnauthorizedCommandError):
            await adapter.hash_verify(conn, evil_id, "valid_name.jpg")

        with pytest.raises(UnauthorizedCommandError):
            await adapter.staging_move(conn, evil_id, "valid_name.jpg")


@pytest.mark.asyncio
async def test_injection_prevention_in_filename():
    """Verify rejection of directory traversal and shell metacharacters in filenames."""
    adapter = CashboxCommandAdapter()
    conn = None  # type: ignore
    valid_id = str(uuid.uuid4())

    malicious_filenames = [
        "banner.jpg; calc.exe",
        "banner.jpg & calc.exe",
        "banner.jpg | whoami",
        "banner.jpg`rmdir`",
        "../uploads/banner.jpg",
        "..\\..\\windows\\system32\\calc.exe",
        "/etc/shadow",
        "banner.jpg' OR '1'='1",
    ]

    for evil_fn in malicious_filenames:
        with pytest.raises(UnauthorizedCommandError):
            await adapter.hash_verify(conn, valid_id, evil_fn)

        with pytest.raises(UnauthorizedCommandError):
            await adapter.staging_move(conn, valid_id, evil_fn)


@pytest.mark.asyncio
async def test_malformed_json_and_timestamp_validation():
    """Verify rejection of malformed JSON payloads and invalid timestamp strings."""
    adapter = CashboxCommandAdapter()
    conn = None  # type: ignore

    # Malformed JSON in sqlite_update
    with pytest.raises(UnauthorizedCommandError):
        await adapter.sqlite_update(conn, SCENE_GUID_FULL, "{not valid json}")

    # Malformed timestamp in touch_reload
    with pytest.raises(UnauthorizedCommandError):
        await adapter.touch_reload(conn, timestamp="1234; calc.exe")

    with pytest.raises(UnauthorizedCommandError):
        await adapter.touch_reload(conn, timestamp="now & whoami")

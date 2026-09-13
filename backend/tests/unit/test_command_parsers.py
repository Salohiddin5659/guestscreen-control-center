# -*- coding: utf-8 -*-
"""Unit tests for Windows CLI and PowerShell response parsers (T034)."""
import pytest

from src.adapters.command_parsers import (
    CommandParseError,
    InventoryItem,
    ProcessAmbiguousError,
    ProcessInfo,
    ProcessNotFoundError,
    classify_process,
    parse_inventory_json,
    parse_pong,
    parse_process_inspect,
    parse_sha256,
    parse_sqlite_read,
)


def test_parse_pong():
    """Verify PONG parsing under various line endings."""
    assert parse_pong("PONG") is True
    assert parse_pong("PONG\r\n") is True
    assert parse_pong("  PONG \n") is True
    assert parse_pong("FAILED") is False
    assert parse_pong("") is False


def test_parse_inventory_json():
    """Verify inventory parsing for arrays, single objects, and empty directory."""
    # Array of files
    array_json = """[
        {"filename": "banner1.jpg", "size": 10240, "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "modified_at": "2026-09-10T10:00:00Z"},
        {"filename": "banner2.png", "size": 20480, "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "modified_at": "2026-09-10T11:00:00Z"}
    ]"""
    items = parse_inventory_json(array_json)
    assert len(items) == 2
    assert items[0].filename == "banner1.jpg"
    assert items[0].size == 10240
    assert items[0].sha256 == "a" * 64
    assert items[1].filename == "banner2.png"

    # Single object (PowerShell behavior when only 1 item exists)
    single_json = '{"filename": "single.jpg", "size": 5000, "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc", "modified_at": "2026-09-10T12:00:00Z"}'
    items_single = parse_inventory_json(single_json)
    assert len(items_single) == 1
    assert items_single[0].filename == "single.jpg"

    # Empty string
    assert parse_inventory_json("") == []
    assert parse_inventory_json("   ") == []

    # Invalid JSON raises CommandParseError
    with pytest.raises(CommandParseError):
        parse_inventory_json("This is not JSON")


def test_parse_sha256():
    """Verify SHA-256 hash extraction from CertUtil and Get-FileHash outputs."""
    # Direct hash
    raw_hash = "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"
    assert parse_sha256(raw_hash) == raw_hash.lower()

    # CertUtil format
    certutil_out = f"""
SHA256 hash of C:\\UCS\\GuestScreen\\Front\\media\\uploads\\test.jpg:
{raw_hash}
CertUtil: -hashfile command completed successfully.
"""
    assert parse_sha256(certutil_out) == raw_hash.lower()

    # Invalid output
    with pytest.raises(CommandParseError):
        parse_sha256("Error: file not found")


import json


def test_parse_process_inspect():
    """Verify process inspect parsing for running, stopped, and empty states."""
    running_json = '{"Id": 4120, "StartTime": "2026-09-10T08:00:00.0000000Z"}'
    proc = parse_process_inspect(running_json)
    assert proc is not None
    assert proc.pid == 4120
    assert proc.start_time == "2026-09-10T08:00:00.0000000Z"

    # Not running with allow_none=True
    assert parse_process_inspect("", allow_none=True) is None
    assert parse_process_inspect("null", allow_none=True) is None

    # Not running with default allow_none=False raises ProcessNotFoundError
    with pytest.raises(ProcessNotFoundError):
        parse_process_inspect("")
    with pytest.raises(ProcessNotFoundError):
        parse_process_inspect("null")

    # Malformed JSON
    with pytest.raises(CommandParseError):
        parse_process_inspect("Process error")


SAMPLE_PID_1348 = {
    "Id": 1348,
    "StartTime": "2026-09-09T01:53:45.3877149+05:00",
    "Path": r"C:\UCS\GuestScreen\GuestScreen.exe",
    "WorkingSet": 6537216,
    "Threads": 10,
    "ListeningPorts": [],
    "HasPort2121": False,
    "HasLibcef": False,
    "HasCefSharp": True,
    "WorkingDirectory": "",
}

SAMPLE_PID_2128 = {
    "Id": 2128,
    "StartTime": "2026-09-09T01:53:45.3888691+05:00",
    "Path": r"C:\UCS\GuestScreen\GuestScreen.exe",
    "WorkingSet": 45912064,
    "Threads": 39,
    "ListeningPorts": [2122, 2121],
    "HasPort2121": True,
    "HasLibcef": True,
    "HasCefSharp": True,
    "WorkingDirectory": r"C:\UCS\GuestScreen",
}


def test_two_guestscreen_processes_selects_active_2128():
    """Verify that given both stalled PID 1348 and active PID 2128, PID 2128 is identified."""
    payload = json.dumps([SAMPLE_PID_1348, SAMPLE_PID_2128])
    proc = parse_process_inspect(payload)

    assert proc is not None
    assert proc.pid == 2128
    assert proc.classification == "ACTIVE"
    assert proc.has_port_2121 is True
    assert proc.has_libcef is True
    assert proc.working_directory == r"C:\UCS\GuestScreen"

    # Verify classification of PID 1348 explicitly
    cls_1348, is_act_1348 = classify_process(SAMPLE_PID_1348)
    assert cls_1348 == "AUXILIARY / STALLED / NON-ACTIVE"
    assert is_act_1348 is False


def test_active_process_second_in_array():
    """Verify active PID 2128 is correctly selected when second in process array."""
    payload = json.dumps([SAMPLE_PID_1348, SAMPLE_PID_2128])
    proc = parse_process_inspect(payload)
    assert proc is not None
    assert proc.pid == 2128
    assert proc.classification == "ACTIVE"


def test_active_process_first_in_array():
    """Verify active PID 2128 is correctly selected when first in process array."""
    payload = json.dumps([SAMPLE_PID_2128, SAMPLE_PID_1348])
    proc = parse_process_inspect(payload)
    assert proc is not None
    assert proc.pid == 2128
    assert proc.classification == "ACTIVE"


def test_no_active_process_raises_not_found():
    """Verify ProcessNotFoundError is raised when only stalled process exists or array is empty."""
    # Stalled process only
    with pytest.raises(ProcessNotFoundError) as exc_info:
        parse_process_inspect(json.dumps([SAMPLE_PID_1348]))
    assert "1348" in str(exc_info.value)
    assert "AUXILIARY / STALLED / NON-ACTIVE" in str(exc_info.value)

    # Empty array
    with pytest.raises(ProcessNotFoundError):
        parse_process_inspect("[]")


def test_two_ambiguous_active_processes_raises_ambiguous():
    """Verify ProcessAmbiguousError is raised when two processes both meet active runtime criteria."""
    active_clone = dict(SAMPLE_PID_2128, Id=7777)
    with pytest.raises(ProcessAmbiguousError) as exc_info:
        parse_process_inspect(json.dumps([SAMPLE_PID_2128, active_clone]))
    assert "2128" in str(exc_info.value)
    assert "7777" in str(exc_info.value)


def test_process_array_ordering_invariance():
    """Verify array permutation invariance: result is identical regardless of process order."""
    stalled_extra = dict(SAMPLE_PID_1348, Id=9999)
    order1 = json.dumps([SAMPLE_PID_1348, stalled_extra, SAMPLE_PID_2128])
    order2 = json.dumps([SAMPLE_PID_2128, SAMPLE_PID_1348, stalled_extra])
    order3 = json.dumps([stalled_extra, SAMPLE_PID_2128, SAMPLE_PID_1348])

    res1 = parse_process_inspect(order1)
    res2 = parse_process_inspect(order2)
    res3 = parse_process_inspect(order3)

    assert res1 is not None and res2 is not None and res3 is not None
    assert res1.pid == 2128
    assert res2.pid == 2128
    assert res3.pid == 2128


def test_parse_sqlite_read():
    """Verify raw scene JSON string retrieval."""
    raw = ' {"guid": "2509359c-2d71-4344-9be4-7d90dd453083", "title": "Promo"} \r\n'
    parsed = parse_sqlite_read(raw)
    assert parsed.startswith('{"guid"')

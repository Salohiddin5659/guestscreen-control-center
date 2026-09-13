# -*- coding: utf-8 -*-
"""Unit tests for SettingsIntegrity verification and canonical hashing."""
import json
import pytest

from src.core.settings_integrity import (
    PROTECTED_SETTINGS_KEYS,
    VOLATILE_SETTINGS_KEYS,
    ProtectedSettingsSnapshot,
    normalize_setting_value,
    verify_settings_integrity,
)


@pytest.fixture
def baseline_settings_dict():
    """Returns a realistic baseline dictionary containing all 55 protected keys and 2 volatile keys."""
    base = {k: f"val_{k}" for k in PROTECTED_SETTINGS_KEYS}
    # Specific realistic values for structured keys
    base["DemoOrder"] = json.dumps({"restaurant": "199994887", "station": {"name": "CASH762", "code": 9}})
    base["Rk7CashStationCodes"] = json.dumps([{"port": 0, "ident": 15737, "code": 45, "name": "Касса.Тест2"}])
    base["Rk7XmlInterfaceAddress"] = '"10.0.0.80"'
    base["LicProtectServerAddress"] = '"http://l.ucs.ru:60606"'
    base["LastMetricsCheckDts"] = '"2026-09-12T11:58:00.0000000+05:00"'
    base["AvgTime"] = '{"sessionCnt":1,"totalTime":"07:00:00.0000000"}'
    return base


def test_1_protected_settings_unchanged_pass(baseline_settings_dict):
    """Test 1: When protected settings and volatile settings are identical, integrity check passes."""
    snap_before = ProtectedSettingsSnapshot.from_dict(baseline_settings_dict)
    snap_after = ProtectedSettingsSnapshot.from_dict(baseline_settings_dict)

    result = verify_settings_integrity(snap_before, snap_after)
    assert result.is_valid is True
    assert result.status == "PASS"
    assert result.hash_before == result.hash_after
    assert len(result.protected_changes) == 0
    assert len(result.volatile_changes) == 0


def test_2_last_metrics_check_dts_changed_pass(baseline_settings_dict):
    """Test 2: When runtime telemetry LastMetricsCheckDts changes, integrity check still passes."""
    snap_before = ProtectedSettingsSnapshot.from_dict(baseline_settings_dict)
    
    modified_dict = dict(baseline_settings_dict)
    modified_dict["LastMetricsCheckDts"] = '"2026-09-12T18:59:36.2940736+05:00"'
    snap_after = ProtectedSettingsSnapshot.from_dict(modified_dict)

    result = verify_settings_integrity(snap_before, snap_after)
    assert result.is_valid is True
    assert result.status == "PASS"
    assert result.hash_before == result.hash_after  # Protected hash remains identical!
    assert len(result.protected_changes) == 0
    assert "LastMetricsCheckDts" in result.volatile_changes
    assert result.volatile_changes["LastMetricsCheckDts"]["before"] == '"2026-09-12T11:58:00.0000000+05:00"'
    assert result.volatile_changes["LastMetricsCheckDts"]["after"] == '"2026-09-12T18:59:36.2940736+05:00"'


def test_3_avg_time_changed_pass(baseline_settings_dict):
    """Test 3: When runtime telemetry AvgTime changes, integrity check still passes."""
    snap_before = ProtectedSettingsSnapshot.from_dict(baseline_settings_dict)

    modified_dict = dict(baseline_settings_dict)
    modified_dict["AvgTime"] = '{"sessionCnt":2,"totalTime":"18:57:54.5518836"}'
    snap_after = ProtectedSettingsSnapshot.from_dict(modified_dict)

    result = verify_settings_integrity(snap_before, snap_after)
    assert result.is_valid is True
    assert result.status == "PASS"
    assert result.hash_before == result.hash_after
    assert len(result.protected_changes) == 0
    assert "AvgTime" in result.volatile_changes


def test_4_protected_key_changed_fail(baseline_settings_dict):
    """Test 4: When any protected key (e.g. Rk7XmlInterfaceAddress) is altered, check fails."""
    snap_before = ProtectedSettingsSnapshot.from_dict(baseline_settings_dict)

    modified_dict = dict(baseline_settings_dict)
    modified_dict["Rk7XmlInterfaceAddress"] = '"10.0.0.99"'  # Modified IP!
    snap_after = ProtectedSettingsSnapshot.from_dict(modified_dict)

    result = verify_settings_integrity(snap_before, snap_after)
    assert result.is_valid is False
    assert result.status == "FAIL"
    assert result.hash_before != result.hash_after
    assert "Rk7XmlInterfaceAddress" in result.protected_changes
    assert "Protected configuration keys were modified" in result.error_message


def test_5_new_unknown_settings_key_appears_fail(baseline_settings_dict):
    """Test 5: When an unrecognized key appears in settings, check fails and flags for manual review."""
    snap_before = ProtectedSettingsSnapshot.from_dict(baseline_settings_dict)

    modified_dict = dict(baseline_settings_dict)
    modified_dict["MaliciousInjectedParam"] = "evil_value"
    snap_after = ProtectedSettingsSnapshot.from_dict(modified_dict)

    result = verify_settings_integrity(snap_before, snap_after)
    assert result.is_valid is False
    assert result.status == "FAIL"
    assert "MaliciousInjectedParam" in result.unknown_keys
    assert "unknown configuration keys detected" in result.error_message.lower()


def test_6_dictionary_order_changes_do_not_affect_hash(baseline_settings_dict):
    """Test 6: Internal JSON dictionary key ordering changes do NOT alter normalized value or hash."""
    dict_a = dict(baseline_settings_dict)
    dict_b = dict(baseline_settings_dict)

    # Invert key ordering in JSON object
    dict_a["DemoOrder"] = '{"alpha": 1, "beta": 2, "gamma": 3}'
    dict_b["DemoOrder"] = '{"gamma": 3, "alpha": 1, "beta": 2}'

    snap_a = ProtectedSettingsSnapshot.from_dict(dict_a)
    snap_b = ProtectedSettingsSnapshot.from_dict(dict_b)

    assert snap_a.protected_values["DemoOrder"] == snap_b.protected_values["DemoOrder"]
    assert snap_a.protected_hash == snap_b.protected_hash

    result = verify_settings_integrity(snap_a, snap_b)
    assert result.is_valid is True
    assert result.status == "PASS"


def test_7_canonicalization_produces_deterministic_hash(baseline_settings_dict):
    """Test 7: Canonicalization algorithm is completely deterministic regardless of insertion order."""
    import random

    keys = list(baseline_settings_dict.keys())
    
    # Shuffle keys multiple times
    hashes = set()
    for _ in range(10):
        random.shuffle(keys)
        shuffled_dict = {k: baseline_settings_dict[k] for k in keys}
        snap = ProtectedSettingsSnapshot.from_dict(shuffled_dict)
        hashes.add(snap.protected_hash)

    # All shuffles must result in the exact same SHA-256 hash
    assert len(hashes) == 1

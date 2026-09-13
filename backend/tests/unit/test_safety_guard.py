# -*- coding: utf-8 -*-
"""Unit tests for RetailSafetyGuard retail boundaries and forbidden table interception (T041)."""
import pytest

from src.core.exceptions import SafetyBoundaryViolationError
from src.core.safety_guard import (
    ALLOWED_SCENE_GUIDS,
    SCENE_GUID_FULL,
    SCENE_GUID_SPLIT,
    RetailSafetyGuard,
)


def test_validate_allowed_scene_guids():
    """Verify that only the two advertising GUIDs pass validation."""
    assert RetailSafetyGuard.validate_scene_guid(SCENE_GUID_FULL) == SCENE_GUID_FULL.lower()
    assert RetailSafetyGuard.validate_scene_guid(SCENE_GUID_SPLIT) == SCENE_GUID_SPLIT.lower()

    # Non-advertising GUIDs must raise SafetyBoundaryViolationError
    with pytest.raises(SafetyBoundaryViolationError):
        RetailSafetyGuard.validate_scene_guid("00000000-0000-0000-0000-000000000000")

    with pytest.raises(SafetyBoundaryViolationError):
        # r_keeper check screen GUID
        RetailSafetyGuard.validate_scene_guid("255dc54c-70ea-465d-8b2c-d9d8b0ad63a4")


def test_validate_sql_forbidden_tables():
    """Verify immediate block of queries targeting protected tables."""
    forbidden_queries = [
        "SELECT * FROM licenses;",
        "UPDATE screens SET Raw = 'bad';",
        "SELECT * FROM scenarios WHERE id = 1;",
        "UPDATE settings SET value = '1';",
        "SELECT * FROM orders;",
        "DELETE FROM checks;",
        "SELECT * FROM items;",
        "DROP TABLE licenses;",
        "TRUNCATE scenes;",
        "REPLACE INTO scenes VALUES (1, 2);",
    ]

    for q in forbidden_queries:
        with pytest.raises(SafetyBoundaryViolationError):
            RetailSafetyGuard.validate_sql(q)


def test_validate_sql_allowed_scenes_queries():
    """Verify that surgical queries on scenes with whitelisted GUIDs pass."""
    valid_read = f"SELECT Raw FROM scenes WHERE Guid = '{SCENE_GUID_FULL}';"
    RetailSafetyGuard.validate_sql(valid_read)

    valid_update = f"UPDATE scenes SET Raw = '{{}}' WHERE Guid = '{SCENE_GUID_SPLIT}';"
    RetailSafetyGuard.validate_sql(valid_update)

    # UPDATE on scenes without whitelisted GUID in WHERE clause must fail
    with pytest.raises(SafetyBoundaryViolationError):
        RetailSafetyGuard.validate_sql("UPDATE scenes SET Raw = '{}' WHERE Guid = 'arbitrary';")


def test_validate_file_path_gs_db_protection():
    """Verify that operations attempting to touch or replace gs.db file directly are blocked."""
    forbidden_paths = [
        r"C:\UCS\GuestScreen\gs.db",
        r"C:/UCS/GuestScreen/gs.db",
        r"uploads\..\..\gs.db",
        r"C:\UCS\GuestScreen\gs.db-wal",
        r"C:\UCS\GuestScreen\gs.db-shm",
    ]

    for p in forbidden_paths:
        with pytest.raises(SafetyBoundaryViolationError):
            RetailSafetyGuard.validate_file_path(p, operation="write")

        with pytest.raises(SafetyBoundaryViolationError):
            RetailSafetyGuard.validate_file_path(p, operation="delete")

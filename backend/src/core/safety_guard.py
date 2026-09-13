# -*- coding: utf-8 -*-
"""Retail safety boundary validator guarding gs.db and non-advertising retail data."""
import re
from typing import Set

from src.core.exceptions import SafetyBoundaryViolationError

# Allowed scene GUIDs (CRITICAL RETAIL SAFETY BOUNDARY)
SCENE_GUID_FULL = "2509359c-2d71-4344-9be4-7d90dd453083"  # FULL SCREEN (1024x768)
SCENE_GUID_SPLIT = "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"  # 50/50 Promo Block (512x768)
ALLOWED_SCENE_GUIDS: Set[str] = {SCENE_GUID_FULL.lower(), SCENE_GUID_SPLIT.lower()}

# Protected retail tables that must NEVER be read, modified, or touched
FORBIDDEN_TABLES: Set[str] = {
    "licenses",
    "screens",
    "scenarios",
    "settings",
    "orders",
    "order_items",
    "checks",
    "items",
    "discounts",
    "payments",
    "receipts",
    "taxes",
    "modifiers",
}

# Forbidden destructive SQL operations
FORBIDDEN_SQL_OPERATIONS: Set[str] = {
    "drop",
    "truncate",
    "alter",
    "delete",
    "replace",
    "attach",
    "detach",
    "vacuum",
}


class RetailSafetyGuard:
    """Inviolable retail safety guard preventing arbitrary SQL, db overwrite, or retail data corruption."""

    @classmethod
    def validate_scene_guid(cls, guid: str) -> str:
        """Verify that GUID matches one of the two authorized advertising scene GUIDs."""
        clean = guid.strip().lower()
        if clean not in ALLOWED_SCENE_GUIDS:
            raise SafetyBoundaryViolationError(
                f"Retail Safety Violation: GUID '{guid}' is NOT an authorized advertising scene. "
                f"Modifying non-advertising scenes is strictly forbidden."
            )
        return clean

    @classmethod
    def validate_sql(cls, query: str) -> None:
        """Intercept and reject any SQL statement targeting forbidden tables or non-advertising rows."""
        clean = query.strip()
        tokens = re.split(r"[\s\(\),;]+", clean.lower())

        # Check for forbidden SQL operations
        for token in tokens:
            if token in FORBIDDEN_SQL_OPERATIONS:
                raise SafetyBoundaryViolationError(
                    f"Retail Safety Violation: Operation '{token.upper()}' is strictly prohibited in gs.db."
                )

        # Check for forbidden tables
        for table in FORBIDDEN_TABLES:
            if table in tokens:
                raise SafetyBoundaryViolationError(
                    f"Retail Safety Violation: Access to protected table '{table}' is strictly prohibited."
                )

        # Ensure query strictly targets the 'scenes' table
        if "scenes" not in tokens:
            raise SafetyBoundaryViolationError(
                "Retail Safety Violation: Queries against gs.db must target ONLY the 'scenes' table."
            )

        # If it is an UPDATE statement, enforce GUID whitelisting in WHERE clause
        if "update" in tokens:
            has_allowed_guid = any(allowed_guid in clean.lower() for allowed_guid in ALLOWED_SCENE_GUIDS)
            if not has_allowed_guid:
                raise SafetyBoundaryViolationError(
                    "Retail Safety Violation: UPDATE on 'scenes' must specify an authorized advertising GUID in the WHERE clause."
                )

    @classmethod
    def validate_file_path(cls, path: str, operation: str = "write") -> None:
        """Ensure file operations NEVER overwrite, delete, or replace gs.db directly."""
        normalized = path.replace("/", "\\").lower()
        parts = [p for p in normalized.split("\\") if p]

        # Block any direct file operations on gs.db (copying over, deleting, replacing)
        if "gs.db" in parts or normalized.endswith("gs.db") or "gs.db-wal" in parts or "gs.db-shm" in parts:
            if operation in ("write", "delete", "replace", "move", "copy"):
                raise SafetyBoundaryViolationError(
                    f"Retail Safety Violation: Direct file manipulation of '{path}' is strictly prohibited. "
                    f"gs.db must NEVER be overwritten, replaced, or deleted."
                )

        # Block directory traversal
        if ".." in parts:
            raise SafetyBoundaryViolationError(
                f"Retail Safety Violation: Directory traversal detected in path: '{path}'"
            )

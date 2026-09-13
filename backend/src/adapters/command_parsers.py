# -*- coding: utf-8 -*-
"""Windows CLI and PowerShell response parsing utilities for CashboxCommandAdapter."""
from dataclasses import dataclass
import json
import re
from typing import Any, Dict, List, Optional

from src.core.exceptions import (
    CommandParseError,
    GuestScreenError,
    ProcessAmbiguousError,
    ProcessNotFoundError,
)


@dataclass(frozen=True)
class InventoryItem:
    """Metadata of an uploaded media file on cashier monoblock."""
    filename: str
    size: int
    sha256: str
    modified_at: str


@dataclass(frozen=True)
class ProcessInfo:
    """GuestScreen.exe operating process metadata."""
    pid: int
    start_time: str
    working_directory: str = ""
    has_port_2121: bool = False
    has_libcef: bool = False
    has_cefsharp: bool = False
    classification: str = "ACTIVE"
    raw_data: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class CommandResult:
    """Generic execution result from CashboxCommandAdapter."""
    command: str
    exit_status: int
    stdout: str
    stderr: str


def parse_pong(stdout: str) -> bool:
    """Parse CMD_PING response; verifies presence of exact 'PONG' token."""
    clean = stdout.strip()
    return "PONG" in clean.splitlines() or clean == "PONG"


def parse_inventory_json(stdout: str) -> List[InventoryItem]:
    """Parse PowerShell CMD_INVENTORY JSON output into list of InventoryItem objects.

    Handles single object (PowerShell serializes single item as object instead of array)
    as well as arrays and empty output.
    """
    clean = stdout.strip()
    if not clean:
        return []

    try:
        data = json.loads(clean)
    except json.JSONDecodeError as exc:
        raise CommandParseError(f"Failed to parse CMD_INVENTORY JSON: '{clean[:100]}'") from exc

    items: List[InventoryItem] = []
    raw_list = data if isinstance(data, list) else [data]

    for entry in raw_list:
        if not isinstance(entry, dict):
            continue
        filename = str(entry.get("filename", "")).strip()
        if not filename:
            continue
        try:
            size = int(entry.get("size", 0))
        except (ValueError, TypeError):
            size = 0
        sha256_val = str(entry.get("sha256", "")).strip().lower()
        modified_at = str(entry.get("modified_at", "")).strip()

        items.append(
            InventoryItem(
                filename=filename,
                size=size,
                sha256=sha256_val,
                modified_at=modified_at,
            )
        )

    return items


def parse_sha256(stdout: str) -> str:
    """Extract 64-character lowercase SHA-256 hash from Get-FileHash or CertUtil output."""
    clean = stdout.strip()
    # Match any 64-character hex sequence
    match = re.search(r"\b([0-9a-fA-F]{64})\b", clean)
    if not match:
        raise CommandParseError(f"No valid SHA-256 hash found in output: '{clean[:100]}'")
    return match.group(1).lower()


def classify_process(item: Dict[str, Any]) -> tuple[str, bool]:
    """Evaluate process attributes to determine classification and active status.

    Returns:
        tuple[str, bool]: (classification_label, is_active)
    """
    has_rich_fields = any(
        k in item
        for k in (
            "WorkingDirectory",
            "working_directory",
            "HasPort2121",
            "has_port_2121",
            "HasLibcef",
            "has_libcef",
            "HasCefSharp",
            "has_cefsharp",
            "ListeningPorts",
            "listening_ports",
        )
    )

    if not has_rich_fields:
        # Backward compatibility for mock SSH servers and minimal payloads
        return ("ACTIVE", True)

    working_dir = str(item.get("WorkingDirectory") or item.get("working_directory") or "").strip()
    working_dir_clean = working_dir.rstrip("\\/").lower()
    has_target_cwd = (working_dir_clean == r"c:\ucs\guestscreen")

    has_port_2121 = bool(item.get("HasPort2121") or item.get("has_port_2121"))
    listening_ports = item.get("ListeningPorts") or item.get("listening_ports") or []
    if 2121 in listening_ports:
        has_port_2121 = True

    has_libcef = bool(item.get("HasLibcef") or item.get("has_libcef"))
    has_cefsharp = bool(item.get("HasCefSharp") or item.get("has_cefsharp"))

    is_active = has_target_cwd and has_port_2121 and (has_libcef or has_cefsharp)
    if is_active:
        return ("ACTIVE", True)

    return ("AUXILIARY / STALLED / NON-ACTIVE", False)


def parse_process_inspect(stdout: str, allow_none: bool = False) -> Optional[ProcessInfo]:
    """Parse PowerShell CMD_PROC_INSPECT JSON output into ProcessInfo.

    Validates candidate processes and selects the single ACTIVE process.
    Never relies on process order, array index 0, or min PID.

    Raises:
        CommandParseError: If JSON decoding fails or process Id is invalid.
        ProcessAmbiguousError: If more than one active process is detected.
        ProcessNotFoundError: If zero active processes are found (when allow_none is False).

    Returns:
        ProcessInfo for the single active process, or None if allow_none is True and none found.
    """
    clean = stdout.strip()
    if not clean or clean == "null":
        if allow_none:
            return None
        raise ProcessNotFoundError("No GuestScreen.exe process found running on cashbox.")

    try:
        data = json.loads(clean)
    except json.JSONDecodeError as exc:
        raise CommandParseError(f"Failed to parse CMD_PROC_INSPECT JSON: '{clean[:100]}'") from exc

    raw_list = data if isinstance(data, list) else [data]
    if not raw_list:
        if allow_none:
            return None
        raise ProcessNotFoundError("No GuestScreen.exe processes found in inspect list.")

    candidates: List[tuple[ProcessInfo, bool]] = []

    for item in raw_list:
        if not isinstance(item, dict):
            continue

        pid_raw = item.get("Id") if "Id" in item else item.get("id")
        if pid_raw is None:
            continue

        try:
            pid = int(pid_raw)
        except (ValueError, TypeError) as exc:
            raise CommandParseError(f"Invalid process Id in inspect output: {pid_raw}") from exc

        start_time = str(item.get("StartTime") or item.get("start_time") or "").strip()
        working_dir = str(item.get("WorkingDirectory") or item.get("working_directory") or "").strip()
        has_port_2121 = bool(item.get("HasPort2121") or item.get("has_port_2121"))
        listening_ports = item.get("ListeningPorts") or item.get("listening_ports") or []
        if 2121 in listening_ports:
            has_port_2121 = True
        has_libcef = bool(item.get("HasLibcef") or item.get("has_libcef"))
        has_cefsharp = bool(item.get("HasCefSharp") or item.get("has_cefsharp"))

        classification, is_active = classify_process(item)

        proc_info = ProcessInfo(
            pid=pid,
            start_time=start_time,
            working_directory=working_dir,
            has_port_2121=has_port_2121,
            has_libcef=has_libcef,
            has_cefsharp=has_cefsharp,
            classification=classification,
            raw_data=item,
        )
        candidates.append((proc_info, is_active))

    if not candidates:
        if allow_none:
            return None
        raise ProcessNotFoundError("No valid GuestScreen.exe entries parsed from inspect output.")

    active_procs = [p for p, is_act in candidates if is_act]

    if len(active_procs) == 1:
        return active_procs[0]

    if len(active_procs) > 1:
        pids = [p.pid for p in active_procs]
        raise ProcessAmbiguousError(
            f"Multiple active GuestScreen.exe processes detected ({pids}). "
            "Aborting deployment to avoid ambiguous target state."
        )

    # len(active_procs) == 0
    if allow_none:
        return None

    stalled_desc = ", ".join(f"PID {p.pid} ({p.classification})" for p, _ in candidates)
    raise ProcessNotFoundError(
        f"No active GuestScreen.exe process found matching active runtime criteria. Detected: [{stalled_desc}]."
    )


def parse_sqlite_read(stdout: str) -> str:
    """Return raw scene JSON string from SQLite CLI output, stripping leading/trailing whitespace."""
    return stdout.strip()

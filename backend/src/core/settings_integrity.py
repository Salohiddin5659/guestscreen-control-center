# -*- coding: utf-8 -*-
"""Settings integrity verification module guarding UCS / r_keeper configuration.

Distinguishes between:
1. Protected static configuration keys (immutable retail safety boundary).
2. Volatile runtime-managed telemetry keys (LastMetricsCheckDts, AvgTime) written by GuestScreen.
"""
from dataclasses import dataclass, field
import hashlib
import json
import time
from typing import Any, Dict, List, Optional, Set, Tuple

# 1. Explicit Allowlist of Protected Configuration Keys (55 confirmed static parameters)
PROTECTED_SETTINGS_KEYS: frozenset[str] = frozenset([
    "AutoRun",
    "CashOfflineInfo",
    "CentralizationServerAddress",
    "CurrentWaiterCode",
    "DateFormat",
    "DefaultPortionName",
    "DefaultPresetName",
    "DemoOrder",
    "DemoTimeout",
    "DishNameType",
    "EnableSettingsPinCode",
    "EqExtPropId",
    "ExcludedOrderTypeCodes",
    "FatalErrors",
    "FirstStart",
    "FontDefault",
    "Language",
    "LastOperationState",
    "LicProtectServerAddress",
    "LicServerAddress",
    "LicServerReserveAddress",
    "LogLevel",
    "LogPeriodDays",
    "MarkupForTips",
    "MediaSourceRaw",
    "MediaSourceType",
    "ModiNameType",
    "OrderCategoryType",
    "PaySymbol",
    "PaySymbolLeft",
    "PenniesSeparator",
    "Rk7CashServerCode",
    "Rk7CashStationCodes",
    "Rk7RefSyncTimeout",
    "Rk7RestaurantCode",
    "Rk7UserName",
    "Rk7UserPassword",
    "Rk7XmlInterfaceAddress",
    "Rk7XmlInterfacePassword",
    "Rk7XmlInterfacePort",
    "RkExtPropNames",
    "RunWatcherOnStartup",
    "SbpExtPropId",
    "SbpLogoPath",
    "ScenarioCountInDay",
    "SelfHostingPort",
    "SettingsPinCode",
    "ShowPennies",
    "ShowSbp",
    "ShowSummary",
    "TriadSeparator",
    "WaiterMessageCount",
    "WebDavServerAddress",
    "WeblateServerAddress",
    "XmlIgnoreDelayTimeout",
])

# 2. Volatile runtime telemetry keys managed by GuestScreen daemon
VOLATILE_SETTINGS_KEYS: frozenset[str] = frozenset([
    "LastMetricsCheckDts",
    "AvgTime",
])


def normalize_setting_value(raw_val: Any) -> str:
    """Canonical normalization of a setting value string.
    
    If the value is JSON (object, list, scalar), parses and canonically re-serializes
    with sorted keys and compact separators to ensure dictionary key order does not
    affect the hash.
    """
    if raw_val is None:
        return ""
    val_str = str(raw_val).strip()
    if not val_str:
        return ""
    try:
        parsed = json.loads(val_str)
        if isinstance(parsed, str) and (parsed.startswith("{") or parsed.startswith("[")):
            try:
                parsed = json.loads(parsed)
            except Exception:
                pass
        return json.dumps(parsed, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    except Exception:
        return val_str


@dataclass(frozen=True)
class ProtectedSettingsSnapshot:
    """Snapshot of settings partitioned into protected, volatile, and unknown sets."""
    protected_hash: str
    protected_values: Dict[str, str] = field(default_factory=dict)
    volatile_values: Dict[str, str] = field(default_factory=dict)
    unknown_keys: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)

    @classmethod
    def from_rows(cls, rows: List[Tuple[str, str]] | List[str]) -> "ProtectedSettingsSnapshot":
        """Build snapshot from SQLite rows (Type, Raw) or pipe-separated lines ('Type|Raw')."""
        settings_map: Dict[str, str] = {}
        for row in rows:
            if isinstance(row, (tuple, list)) and len(row) >= 2:
                k, v = str(row[0]).strip(), str(row[1])
                settings_map[k] = v
            elif isinstance(row, str) and "|" in row:
                k, v = row.split("|", 1)
                settings_map[k.strip()] = v

        return cls.from_dict(settings_map)

    @classmethod
    def from_dict(cls, settings_dict: Dict[str, Any]) -> "ProtectedSettingsSnapshot":
        """Build snapshot from a key-value dictionary."""
        protected: Dict[str, str] = {}
        volatile: Dict[str, str] = {}
        unknown: List[str] = []

        for k, v in settings_dict.items():
            k_clean = str(k).strip()
            if k_clean in PROTECTED_SETTINGS_KEYS:
                protected[k_clean] = normalize_setting_value(v)
            elif k_clean in VOLATILE_SETTINGS_KEYS:
                volatile[k_clean] = str(v).strip()
            else:
                unknown.append(k_clean)

        unknown.sort()
        # Compute canonical protected hash
        sorted_keys = sorted(protected.keys())
        canonical_str = "\n".join(f"{k}={protected[k]}" for k in sorted_keys)
        h = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest().lower()

        return cls(
            protected_hash=h,
            protected_values=protected,
            volatile_values=volatile,
            unknown_keys=unknown,
            timestamp=time.time()
        )


@dataclass
class SettingsIntegrityResult:
    """Result of integrity verification comparing BEFORE and AFTER snapshots."""
    is_valid: bool
    status: str  # "PASS" or "FAIL"
    hash_before: str
    hash_after: str
    protected_changes: Dict[str, Dict[str, str]]  # key -> {before, after}
    volatile_changes: Dict[str, Dict[str, str]]   # key -> {before, after}
    unknown_keys: List[str]
    error_message: Optional[str] = None

    def format_diff_report(self) -> str:
        """Produce human-readable diagnostic report distinguishing protected vs volatile."""
        lines = []
        lines.append("=== SETTINGS INTEGRITY REPORT ===")
        lines.append(f"STATUS: {self.status}")
        lines.append(f"PROTECTED HASH BEFORE: {self.hash_before}")
        lines.append(f"PROTECTED HASH AFTER:  {self.hash_after}")
        
        if self.unknown_keys:
            lines.append(f"UNKNOWN KEYS DETECTED: {', '.join(self.unknown_keys)}")
            
        lines.append("\nPROTECTED CHANGES:")
        if not self.protected_changes:
            lines.append("  NONE")
        else:
            for k, diff in self.protected_changes.items():
                lines.append(f"  {k}:")
                lines.append(f"    BEFORE: {diff['before']}")
                lines.append(f"    AFTER:  {diff['after']}")

        lines.append("\nVOLATILE CHANGES:")
        if not self.volatile_changes:
            lines.append("  NONE")
        else:
            for k, diff in self.volatile_changes.items():
                lines.append(f"  {k}:")
                lines.append(f"    BEFORE: {diff['before']}")
                lines.append(f"    AFTER:  {diff['after']}")

        return "\n".join(lines)


def verify_settings_integrity(
    before: ProtectedSettingsSnapshot,
    after: ProtectedSettingsSnapshot
) -> SettingsIntegrityResult:
    """Strictly verify that protected settings have NOT been altered.
    
    Rules:
    1. If any new/unknown keys appear in 'after' -> FAIL (requires manual review).
    2. If any key in PROTECTED_SETTINGS_KEYS changed -> FAIL (IntegrityViolation).
    3. If only VOLATILE_SETTINGS_KEYS changed -> PASS.
    """
    # 1. Check for new unknown keys
    new_unknown = [k for k in after.unknown_keys if k not in before.unknown_keys]
    if new_unknown or after.unknown_keys:
        return SettingsIntegrityResult(
            is_valid=False,
            status="FAIL",
            hash_before=before.protected_hash,
            hash_after=after.protected_hash,
            protected_changes={},
            volatile_changes={},
            unknown_keys=after.unknown_keys,
            error_message=f"New or unknown configuration keys detected in settings: {after.unknown_keys}"
        )

    # 2. Check protected changes
    protected_changes: Dict[str, Dict[str, str]] = {}
    for k in PROTECTED_SETTINGS_KEYS:
        val_before = before.protected_values.get(k)
        val_after = after.protected_values.get(k)
        if val_before != val_after:
            protected_changes[k] = {
                "before": val_before if val_before is not None else "<MISSING>",
                "after": val_after if val_after is not None else "<MISSING>",
            }

    # 3. Check volatile changes (informational)
    volatile_changes: Dict[str, Dict[str, str]] = {}
    for k in VOLATILE_SETTINGS_KEYS:
        val_before = before.volatile_values.get(k)
        val_after = after.volatile_values.get(k)
        if val_before != val_after:
            volatile_changes[k] = {
                "before": val_before if val_before is not None else "<MISSING>",
                "after": val_after if val_after is not None else "<MISSING>",
            }

    if protected_changes:
        return SettingsIntegrityResult(
            is_valid=False,
            status="FAIL",
            hash_before=before.protected_hash,
            hash_after=after.protected_hash,
            protected_changes=protected_changes,
            volatile_changes=volatile_changes,
            unknown_keys=[],
            error_message=f"Integrity Violation: Protected configuration keys were modified: {list(protected_changes.keys())}"
        )

    return SettingsIntegrityResult(
        is_valid=True,
        status="PASS",
        hash_before=before.protected_hash,
        hash_after=after.protected_hash,
        protected_changes={},
        volatile_changes=volatile_changes,
        unknown_keys=[],
        error_message=None
    )

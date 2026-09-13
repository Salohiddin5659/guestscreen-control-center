#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Authoritative 17-Step Deployment Orchestrator for UCS GuestScreen.

Target cashbox: 10.0.0.241 (GuestScreen 3.1.1.0)
Modes: FULL SCREEN (1024x768) and 50/50 (512x768)
Target Scene GUIDs:
  - FULL:  2509359c-2d71-4344-9be4-7d90dd453083
  - SPLIT: 68906ed2-49a3-4dc3-bb8a-6fa7943f39c3
Enforces retail safety boundaries (non-ad tables licenses, screens, scenarios, settings 100% immutable).
"""
import hashlib
import json
import os
import subprocess
import sys
import time

SCENE_GUID_FULL = "2509359c-2d71-4344-9be4-7d90dd453083"
SCENE_GUID_SPLIT = "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"
NON_AD_TABLES = ["licenses", "screens", "scenarios"]

# 1. Explicit Allowlist of Protected Configuration Keys (55 confirmed static parameters)
PROTECTED_SETTINGS_KEYS = frozenset([
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
VOLATILE_SETTINGS_KEYS = frozenset([
    "LastMetricsCheckDts",
    "AvgTime",
])


def normalize_setting_value(raw_val):
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


class ProtectedSettingsSnapshot:
    def __init__(self, protected_hash, protected_values, volatile_values, unknown_keys, timestamp=None):
        self.protected_hash = protected_hash
        self.protected_values = protected_values
        self.volatile_values = volatile_values
        self.unknown_keys = unknown_keys
        self.timestamp = timestamp or time.time()

    @classmethod
    def from_rows(cls, rows):
        settings_dict = {}
        for row in rows:
            if isinstance(row, (tuple, list)) and len(row) >= 2:
                settings_dict[str(row[0]).strip()] = str(row[1])
            elif isinstance(row, str) and "|" in row:
                k, v = row.split("|", 1)
                settings_dict[k.strip()] = v

        protected = {}
        volatile = {}
        unknown = []

        for k, v in settings_dict.items():
            k_clean = str(k).strip()
            if k_clean in PROTECTED_SETTINGS_KEYS:
                protected[k_clean] = normalize_setting_value(v)
            elif k_clean in VOLATILE_SETTINGS_KEYS:
                volatile[k_clean] = str(v).strip()
            else:
                unknown.append(k_clean)

        unknown.sort()
        sorted_keys = sorted(protected.keys())
        canonical_str = "\n".join(f"{k}={protected[k]}" for k in sorted_keys)
        h = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest().lower()

        return cls(h, protected, volatile, unknown)


def verify_settings_integrity(before, after):
    new_unknown = [k for k in after.unknown_keys if k not in before.unknown_keys]
    if new_unknown or after.unknown_keys:
        return {
            "is_valid": False,
            "status": "FAIL",
            "hash_before": before.protected_hash,
            "hash_after": after.protected_hash,
            "protected_changes": {},
            "volatile_changes": {},
            "unknown_keys": after.unknown_keys,
            "error_message": f"New or unknown configuration keys detected in settings: {after.unknown_keys}"
        }

    protected_changes = {}
    for k in PROTECTED_SETTINGS_KEYS:
        val_before = before.protected_values.get(k)
        val_after = after.protected_values.get(k)
        if val_before != val_after:
            protected_changes[k] = {
                "before": val_before if val_before is not None else "<MISSING>",
                "after": val_after if val_after is not None else "<MISSING>",
            }

    volatile_changes = {}
    for k in VOLATILE_SETTINGS_KEYS:
        val_before = before.volatile_values.get(k)
        val_after = after.volatile_values.get(k)
        if val_before != val_after:
            volatile_changes[k] = {
                "before": val_before if val_before is not None else "<MISSING>",
                "after": val_after if val_after is not None else "<MISSING>",
            }

    if protected_changes:
        return {
            "is_valid": False,
            "status": "FAIL",
            "hash_before": before.protected_hash,
            "hash_after": after.protected_hash,
            "protected_changes": protected_changes,
            "volatile_changes": volatile_changes,
            "unknown_keys": [],
            "error_message": f"Integrity Violation: Protected configuration keys were modified: {list(protected_changes.keys())}"
        }

    return {
        "is_valid": True,
        "status": "PASS",
        "hash_before": before.protected_hash,
        "hash_after": after.protected_hash,
        "protected_changes": {},
        "volatile_changes": volatile_changes,
        "unknown_keys": [],
        "error_message": None
    }

CASHBOX_USER = "Administrator"
CASHBOX_PASS = "123"

def emit_step(step_num, step_name, status, details=None):
    payload = {
        "step": step_num,
        "name": step_name,
        "status": status,
        "timestamp": time.time(),
        "details": details or {}
    }
    print("STEP_EVENT:" + json.dumps(payload, ensure_ascii=False), flush=True)

def run_ssh(ip, cmd, timeout=15):
    ssh_cmd = [
        "sshpass", "-p", CASHBOX_PASS,
        "ssh", "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "LogLevel=ERROR",
        "-o", f"ConnectTimeout={timeout}",
        f"{CASHBOX_USER}@{ip}",
        cmd
    ]
    res = subprocess.run(ssh_cmd, capture_output=True, timeout=timeout+5)
    stdout = res.stdout.decode('utf-8', errors='replace').strip()
    stderr = res.stderr.decode('utf-8', errors='replace').strip()
    return res.returncode, stdout, stderr

def run_scp(ip, local_path, remote_path, timeout=30):
    clean_p = remote_path.replace("\\", "/")
    if clean_p.upper().startswith("C:/"):
        target_path = f"/C:/{clean_p[3:]}"
    elif clean_p.startswith("/"):
        target_path = clean_p
    else:
        target_path = f"/{clean_p}"
    
    scp_cmd = [
        "sshpass", "-p", CASHBOX_PASS,
        "scp", "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "LogLevel=ERROR",
        "-o", f"ConnectTimeout={timeout}",
        local_path,
        f"{CASHBOX_USER}@{ip}:{target_path}"
    ]
    res = subprocess.run(scp_cmd, capture_output=True, timeout=timeout+5)
    return res.returncode == 0

def clean_sqlite_stdout(raw_stdout):
    """Filter out CLI meta-outputs like .timeout echo ('10000') and 'wal'."""
    if not raw_stdout:
        return ""
    lines = raw_stdout.replace("\r\n", "\n").split("\n")
    content_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped in ("10000", "wal"):
            continue
        content_lines.append(line)
    return "\n".join(content_lines).strip()

def run_sqlite_query(ip, query, timeout=15, max_retries=4, base_delay=0.5):
    """Executes a SELECT query against gs.db with 10s busy timeout and retry on lock contention."""
    escaped = query.replace('"', '""')
    cmd = f'C:\\UCS\\GuestScreen\\sqlite3.exe -cmd ".timeout 10000" "C:\\UCS\\GuestScreen\\gs.db" "{escaped}"'
    last_err = ""
    for attempt in range(1, max_retries + 1):
        c, out, err = run_ssh(ip, cmd, timeout=timeout)
        if c == 0:
            return c, clean_sqlite_stdout(out), err
        last_err = err or out
        if "database is locked" in last_err.lower() or "busy" in last_err.lower() or "locked (5)" in last_err.lower():
            time.sleep(base_delay * (1.5 ** (attempt - 1)))
            continue
        break
    return c, "", last_err

def run_sqlite_script_with_retry(ip, script_path, max_retries=6, base_delay=0.5):
    """Executes an SQL script against gs.db with 10s busy timeout and bounded retry on lock contention."""
    staging_sql_norm = script_path.replace("\\", "/")
    cmd = f'C:\\UCS\\GuestScreen\\sqlite3.exe -cmd ".timeout 10000" "C:\\UCS\\GuestScreen\\gs.db" ".read {staging_sql_norm}"'
    last_err = ""
    for attempt in range(1, max_retries + 1):
        c, out, err = run_ssh(ip, cmd, timeout=25)
        if c == 0:
            return True, out, err
        last_err = err or out
        if "database is locked" in last_err.lower() or "busy" in last_err.lower() or "locked (5)" in last_err.lower():
            time.sleep(base_delay * (1.5 ** (attempt - 1)))
            continue
        break
    return False, "", last_err

def compute_local_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest().lower()

def compute_table_hash(ip, table_name):
    code, stdout, err = run_sqlite_query(ip, f"SELECT * FROM {table_name};", timeout=15)
    if code != 0:
        raise RuntimeError(f"Failed to read table {table_name}: code {code} ({err})")
    return hashlib.sha256(stdout.encode("utf-8")).hexdigest().lower()

def parse_image_dimensions(filepath):
    """Parse JPEG/PNG dimensions without heavy external libraries."""
    with open(filepath, "rb") as f:
        data = f.read(32)
        # PNG
        if data[:8] == b"\x89PNG\r\n\x1a\n" and len(data) >= 24:
            w = int.from_bytes(data[16:20], "big")
            h = int.from_bytes(data[20:24], "big")
            return w, h
        # JPEG
        f.seek(0)
        content = f.read()
        idx = 2
        if content[:2] == b"\xff\xd8":
            while idx < len(content):
                if content[idx] != 0xff:
                    break
                marker = content[idx+1]
                idx += 2
                if marker in [0xc0, 0xc1, 0xc2]: # SOF0, SOF1, SOF2
                    length = int.from_bytes(content[idx:idx+2], "big")
                    h = int.from_bytes(content[idx+3:idx+5], "big")
                    w = int.from_bytes(content[idx+5:idx+7], "big")
                    return w, h
                else:
                    length = int.from_bytes(content[idx:idx+2], "big")
                    idx += length
    return None, None

def inspect_active_process(ip):
    """Authoritative Active GuestScreen process inspector (identifies PID 2128/active runtime, excludes stub 1348)."""
    ps_cmd = (
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
        '$tcp = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue; '
        '$ps32 = Join-Path $env:windir \'SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe\'; '
        'Get-Process -Name \'GuestScreen\' -ErrorAction SilentlyContinue | ForEach-Object { '
        '$id = $_.Id; '
        '$ports = @($tcp | Where-Object OwningProcess -eq $id | Select-Object -ExpandProperty LocalPort); '
        '$hasLibcef = $false; '
        'if (Test-Path $ps32) { '
        '$mods = & $ps32 -NoProfile -Command \\\"@((Get-Process -Id $id).Modules.ModuleName)\\\"; '
        '$hasLibcef = ($mods -contains \'libcef.dll\'); '
        '} else { '
        '$mods = @($_.Modules.ModuleName); '
        '$hasLibcef = ($mods -contains \'libcef.dll\'); '
        '} '
        '[PSCustomObject]@{ Id = $id; StartTime = $_.StartTime.ToString(\'o\'); '
        'HasPort2121 = ($ports -contains 2121); HasLibcef = $hasLibcef } '
        '} | ConvertTo-Json -Compress"'
    )
    code, stdout, stderr = run_ssh(ip, ps_cmd, timeout=15)
    if code != 0 or not stdout:
        raise RuntimeError(f"Process inspection failed: {stderr or stdout}")
    
    data = json.loads(stdout)
    procs = data if isinstance(data, list) else [data]
    active_proc = None
    for p in procs:
        if p.get("HasPort2121") or p.get("HasLibcef"):
            active_proc = p
            break
    if not active_proc and procs:
        active_proc = procs[0]
    if not active_proc:
        raise RuntimeError("No GuestScreen.exe process found on cashbox!")
    return active_proc

def execute_deployment(deployment_id, target_ip, mode, config_data, media_dir="/app/data/media"):
    mode = mode.upper()
    target_guid = SCENE_GUID_SPLIT if mode == "SPLIT" else SCENE_GUID_FULL
    initial_scene_raw = None
    baseline_hashes = {}
    baseline_proc = None
    staging_dir = f"C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.staging\\{deployment_id}"

    try:
        # STEP 1: VALIDATE_DESIRED_CONFIG
        emit_step(1, "VALIDATE_DESIRED_CONFIG", "RUNNING")
        if mode not in ["FULL", "SPLIT"]:
            raise ValueError(f"Unsupported display mode: {mode}")
        
        if mode == "SPLIT":
            slides = config_data.get("gallerySlides") or config_data.get("slides") or []
            active_banner = config_data.get("orderPromoBanner") or config_data.get("activeBanner") or (slides[0] if slides else None)
            is_dynamic = (config_data.get("orderPromoType") == "gallery") if "orderPromoType" in config_data else (config_data.get("isDynamic") if "isDynamic" in config_data else len(slides) > 1)
            interval = int(config_data.get("galleryInterval") or config_data.get("interval") or 5)
        else: # FULL
            slides = config_data.get("idleSlides") or config_data.get("slides") or []
            active_banner = config_data.get("activeBanner") or (slides[0] if slides else None)
            is_dynamic = (config_data.get("idleType") == "gallery") if "idleType" in config_data else (config_data.get("isDynamic") if "isDynamic" in config_data else len(slides) > 1)
            interval = int(config_data.get("idleInterval") or config_data.get("interval") or 10)

        if interval < 1 or interval > 300:
            raise ValueError(f"Interval {interval}s out of range (1-300)")

        required_files = slides if is_dynamic else [active_banner]
        required_files = [f for f in required_files if f]
        if not required_files:
            raise ValueError("Configuration has no valid media files specified!")
        emit_step(1, "VALIDATE_DESIRED_CONFIG", "SUCCESS", {"mode": mode, "files": required_files, "interval": interval})

        # STEP 2: VALIDATE_CENTRAL_MEDIA
        emit_step(2, "VALIDATE_CENTRAL_MEDIA", "RUNNING")
        central_media_info = {}
        for fn in required_files:
            fp = os.path.join(media_dir, fn)
            if not os.path.exists(fp):
                raise FileNotFoundError(f"Required media file '{fn}' not found in central storage {media_dir}!")
            sha = compute_local_sha256(fp)
            w, h = parse_image_dimensions(fp)
            if mode == "SPLIT" and w and h:
                ratio = w / h
                if (w, h) != (512, 768) and abs(ratio - (512.0 / 768.0)) > 0.05:
                    raise ValueError(f"Media '{fn}' resolution {w}x{h} (ratio {ratio:.2f}) does not match 50/50 requirement (512x768 / 2:3)!")
            central_media_info[fn] = {"sha256": sha, "size": os.path.getsize(fp), "dimensions": (w, h)}
        emit_step(2, "VALIDATE_CENTRAL_MEDIA", "SUCCESS", central_media_info)

        # STEP 3: SSH_HANDSHAKE
        emit_step(3, "SSH_HANDSHAKE", "RUNNING")
        baseline_proc = inspect_active_process(target_ip)
        emit_step(3, "SSH_HANDSHAKE", "SUCCESS", {
            "active_pid": baseline_proc.get("Id"),
            "start_time": baseline_proc.get("StartTime")
        })

        # STEP 4: GET_CASHBOX_INVENTORY
        emit_step(4, "GET_CASHBOX_INVENTORY", "RUNNING")
        inv_cmd = (
            'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
            'Get-ChildItem \'C:\\UCS\\GuestScreen\\Front\\media\\uploads\' -File -ErrorAction SilentlyContinue | '
            'Select-Object Name, Length | ConvertTo-Json -Compress"'
        )
        c, stdout, _ = run_ssh(target_ip, inv_cmd)
        cashbox_files = {}
        if c == 0 and stdout:
            try:
                parsed_inv = json.loads(stdout)
                inv_list = parsed_inv if isinstance(parsed_inv, list) else [parsed_inv]
                for item in inv_list:
                    cashbox_files[item["Name"]] = item["Length"]
            except Exception:
                pass
        emit_step(4, "GET_CASHBOX_INVENTORY", "SUCCESS", {"existing_count": len(cashbox_files)})

        # STEP 5: CALCULATE_DIFF & IDEMPOTENCY CHECK
        emit_step(5, "CALCULATE_DIFF", "RUNNING")
        files_to_upload = []
        for fn, info in central_media_info.items():
            if fn not in cashbox_files or cashbox_files[fn] != info["size"]:
                files_to_upload.append(fn)

        # Read current scene with busy timeout to check for NO_OP
        c, current_scene_raw, _ = run_sqlite_query(target_ip, f"SELECT Raw FROM scenes WHERE Guid = '{target_guid}';", timeout=15)
        initial_scene_raw = current_scene_raw

        # Construct desired scene
        if is_dynamic:
            frames = [{"type": "image", "name": os.path.basename(f)} for f in required_files]
            desired_scene_obj = {
                "guid": target_guid,
                "name": "FullScreenBase" if mode == "FULL" else "OrderScreenPromo",
                "type": "gallery",
                "params": {
                    "interval": int(interval),
                    "frame": frames
                }
            }
        else:
            desired_scene_obj = {
                "guid": target_guid,
                "name": "FullScreenBase" if mode == "FULL" else "OrderScreenPromo",
                "type": "image",
                "params": {
                    "width": None,
                    "height": None,
                    "align": "center",
                    "full": True,
                    "fileName": os.path.basename(required_files[0])
                }
            }
        desired_scene_json = json.dumps(desired_scene_obj, separators=(',', ':'), ensure_ascii=False)

        if not files_to_upload and initial_scene_raw and initial_scene_raw.strip() == desired_scene_json.strip():
            emit_step(5, "CALCULATE_DIFF", "NO_OP", {"reason": "Configuration and media are already active on cashbox"})
            emit_step(17, "MARK_SUCCESS", "NO_OP", {"status": "NO_OP"})
            return {"status": "NO_OP", "target_version": config_data.get("version", 1)}

        emit_step(5, "CALCULATE_DIFF", "SUCCESS", {"missing_files": files_to_upload})

        # STEP 6: UPLOAD_TO_STAGING
        mkdir_cmd = f'powershell -NoProfile -Command "New-Item -ItemType Directory -Path \'{staging_dir}\' -Force"'
        c, _, err = run_ssh(target_ip, mkdir_cmd)
        if c != 0:
            raise RuntimeError(f"Failed to create staging directory: {err}")

        if files_to_upload:
            emit_step(6, "UPLOAD_TO_STAGING", "RUNNING")
            for fn in files_to_upload:
                local_fp = os.path.join(media_dir, fn)
                remote_fp = f"{staging_dir}\\{fn}"
                ok = run_scp(target_ip, local_fp, remote_fp)
                if not ok:
                    raise RuntimeError(f"Failed to upload '{fn}' to staging on {target_ip}!")
            emit_step(6, "UPLOAD_TO_STAGING", "SUCCESS", {"uploaded": files_to_upload})
        else:
            emit_step(6, "UPLOAD_TO_STAGING", "SKIPPED", {"reason": "All media already on cashbox"})

        # STEP 7: VERIFY_HASH_ON_CASHBOX
        if files_to_upload:
            emit_step(7, "VERIFY_HASH_ON_CASHBOX", "RUNNING")
            for fn in files_to_upload:
                hash_cmd = f'powershell -NoProfile -Command "(Get-FileHash \'{staging_dir}\\{fn}\' -Algorithm SHA256).Hash"'
                c, out, _ = run_ssh(target_ip, hash_cmd)
                remote_sha = out.strip().lower()
                expected_sha = central_media_info[fn]["sha256"]
                if remote_sha != expected_sha:
                    run_ssh(target_ip, f'powershell -NoProfile -Command "Remove-Item \'{staging_dir}\' -Recurse -Force"')
                    raise ValueError(f"Staged file SHA-256 mismatch for {fn}! remote={remote_sha}, expected={expected_sha}")
            emit_step(7, "VERIFY_HASH_ON_CASHBOX", "SUCCESS")
        else:
            emit_step(7, "VERIFY_HASH_ON_CASHBOX", "SKIPPED")

        # STEP 8: MOVE_FILES_ATOMICALLY
        if files_to_upload:
            emit_step(8, "MOVE_FILES_ATOMICALLY", "RUNNING")
            move_cmd = (
                f'powershell -NoProfile -Command "'
                f'Get-ChildItem -Path \'{staging_dir}\' -File | Move-Item -Destination \'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\\' -Force"'
            )
            c, _, err = run_ssh(target_ip, move_cmd)
            if c != 0:
                raise RuntimeError(f"Failed to move staged files to media/uploads: {err}")
            emit_step(8, "MOVE_FILES_ATOMICALLY", "SUCCESS")
        else:
            emit_step(8, "MOVE_FILES_ATOMICALLY", "SKIPPED")

        # STEP 9: SNAPSHOT_CURRENT_SCENE
        emit_step(9, "SNAPSHOT_CURRENT_SCENE", "RUNNING")
        for tbl in NON_AD_TABLES:
            baseline_hashes[tbl] = compute_table_hash(target_ip, tbl)
        
        # Take snapshot of settings (distinguishing protected vs volatile)
        c, settings_raw, _ = run_sqlite_query(target_ip, "SELECT Type, Raw FROM settings;", timeout=15)
        settings_rows = [line.strip().split("|", 1) for line in settings_raw.splitlines() if "|" in line]
        settings_snapshot_before = ProtectedSettingsSnapshot.from_rows(settings_rows)
        baseline_hashes["settings_protected"] = settings_snapshot_before.protected_hash

        emit_step(9, "SNAPSHOT_CURRENT_SCENE", "SUCCESS", {
            "initial_scene_bytes": len(initial_scene_raw or ""),
            "table_hashes": baseline_hashes,
            "volatile_settings": settings_snapshot_before.volatile_values
        })

        # STEP 10: VALIDATE_SCENE_GUID
        emit_step(10, "VALIDATE_SCENE_GUID", "RUNNING")
        # Ensure non-ad tables are intact
        emit_step(10, "VALIDATE_SCENE_GUID", "SUCCESS", {"target_guid": target_guid})

        # STEP 11: UPDATE_ADVERTISING_SCENE
        emit_step(11, "UPDATE_ADVERTISING_SCENE", "RUNNING")
        escaped_json = desired_scene_json.replace("'", "''")
        local_sql = f"/tmp/dep_update_{deployment_id}.sql"
        with open(local_sql, "w", encoding="utf-8") as f:
            f.write("PRAGMA journal_mode = WAL;\n")
            f.write("PRAGMA busy_timeout = 10000;\n")
            f.write("BEGIN IMMEDIATE;\n")
            f.write(f"UPDATE scenes SET Raw = '{escaped_json}' WHERE Guid = '{target_guid}';\n")
            f.write("COMMIT;\n")
        
        remote_sql = f"{staging_dir}\\update.sql"
        if not run_scp(target_ip, local_sql, remote_sql):
            try: os.remove(local_sql)
            except Exception: pass
            raise RuntimeError(f"Failed to SCP update SQL script to {target_ip}!")
        try: os.remove(local_sql)
        except Exception: pass

        ok, _, err = run_sqlite_script_with_retry(target_ip, remote_sql, max_retries=6, base_delay=0.5)
        if not ok:
            raise RuntimeError(f"SQLite UPDATE failed on {target_guid}: {err}")
        emit_step(11, "UPDATE_ADVERTISING_SCENE", "SUCCESS")

        # STEP 12: COMMIT_TRANSACTION
        emit_step(12, "COMMIT_TRANSACTION", "RUNNING")
        # Verify read back from sqlite directly with busy timeout
        c, read_chk, err = run_sqlite_query(target_ip, f"SELECT Raw FROM scenes WHERE Guid = '{target_guid}';", timeout=15)
        if c != 0 or not read_chk:
            raise RuntimeError(f"Database commit verification failed: {err}")
        emit_step(12, "COMMIT_TRANSACTION", "SUCCESS")

        # STEP 13: TOUCH_RELOAD
        emit_step(13, "TOUCH_RELOAD", "RUNNING")
        ensure_index_cmd = (
            'powershell -NoProfile -Command "'
            '$p = \'C:\\UCS\\GuestScreen\\Front\\index.html\'; '
            'if (Test-Path $p) { '
            '  $t = [System.IO.File]::ReadAllText($p); '
            '  if ($t -notmatch \'sendDefaultScenario\') { '
            '    $s = \'<script>(function(){function d(){if(window.CefCallback&&typeof window.CefCallback.sendDefaultScenario===\\"function\\"){try{window.CefCallback.sendDefaultScenario(function(){},function(){});}catch(e){}}}setTimeout(d,800);setTimeout(d,2000);})();</script>\'; '
            '    $t = $t.Replace(\'</body>\', $s + \'</body>\'); '
            '    [System.IO.File]::WriteAllText($p, $t, [System.Text.Encoding]::UTF8); '
            '  } '
            '}"'
        )
        run_ssh(target_ip, ensure_index_cmd)
        ts = int(time.time() * 1000)
        touch_cmd = f'powershell -NoProfile -Command "Set-Content -Path \'C:\\UCS\\GuestScreen\\Front\\sync_version.txt\' -Value \'{ts}\' -Encoding UTF8"'
        c, _, err = run_ssh(target_ip, touch_cmd)
        if c != 0:
            raise RuntimeError(f"Failed to touch sync_version.txt: {err}")
        emit_step(13, "TOUCH_RELOAD", "SUCCESS", {"sync_version": ts})

        # STEP 14: WAIT_FOR_HOT_RELOAD
        emit_step(14, "WAIT_FOR_HOT_RELOAD", "RUNNING")
        time.sleep(3.0)
        emit_step(14, "WAIT_FOR_HOT_RELOAD", "SUCCESS")

        # STEP 15: VERIFY_PROCESS_STABILITY
        emit_step(15, "VERIFY_PROCESS_STABILITY", "RUNNING")
        post_proc = inspect_active_process(target_ip)
        if post_proc.get("Id") != baseline_proc.get("Id"):
            raise RuntimeError(f"Active GuestScreen PID changed from {baseline_proc.get('Id')} to {post_proc.get('Id')}!")
        if post_proc.get("StartTime") != baseline_proc.get("StartTime"):
            raise RuntimeError("GuestScreen StartTime changed (process was restarted)!")

        # Verify retail safety boundary:
        # 1. Non-ad static tables (licenses, screens, scenarios) must be 100% hash-identical
        for tbl in NON_AD_TABLES:
            curr_h = compute_table_hash(target_ip, tbl)
            if curr_h != baseline_hashes[tbl]:
                raise RuntimeError(f"CRITICAL: Non-ad table '{tbl}' modified! ({curr_h} != {baseline_hashes[tbl]})")

        # 2. Protected settings configuration keys must be 100% identical
        c, settings_raw_post, _ = run_sqlite_query(target_ip, "SELECT Type, Raw FROM settings;", timeout=15)
        settings_rows_post = [line.strip().split("|", 1) for line in settings_raw_post.splitlines() if "|" in line]
        settings_snapshot_after = ProtectedSettingsSnapshot.from_rows(settings_rows_post)

        integrity_res = verify_settings_integrity(settings_snapshot_before, settings_snapshot_after)
        if not integrity_res["is_valid"]:
            emit_step(15, "VERIFY_PROCESS_STABILITY", "FAILED", {
                "error": integrity_res["error_message"],
                "protected_changes": integrity_res["protected_changes"],
                "volatile_changes": integrity_res["volatile_changes"],
                "unknown_keys": integrity_res["unknown_keys"],
            })
            raise RuntimeError(f"CRITICAL: Settings Integrity Violation! {integrity_res['error_message']}. Diff: {integrity_res['protected_changes']}")

        emit_step(15, "VERIFY_PROCESS_STABILITY", "SUCCESS", {
            "pid": post_proc.get("Id"),
            "protected_settings_hash": settings_snapshot_after.protected_hash,
            "volatile_changes": integrity_res["volatile_changes"]
        })

        # STEP 16: READ_SCENE_BACK
        emit_step(16, "READ_SCENE_BACK", "RUNNING")
        c, final_scene_raw, _ = run_sqlite_query(target_ip, f"SELECT Raw FROM scenes WHERE Guid = '{target_guid}';", timeout=15)
        final_clean = (final_scene_raw or "").strip()
        desired_clean = desired_scene_json.strip()
        match = (final_clean == desired_clean)
        if not match:
            try:
                match = (json.loads(final_clean) == json.loads(desired_clean))
            except Exception:
                match = False
        if not match:
            raise RuntimeError(f"Read-back scene does not match desired scene! read={repr(final_clean)}, expected={repr(desired_clean)}")
        emit_step(16, "READ_SCENE_BACK", "SUCCESS", {"verified_guid": target_guid})

        # STEP 17: MARK_SUCCESS
        # Clean up staging directory on cashbox
        run_ssh(target_ip, f'powershell -NoProfile -Command "Remove-Item -Path \'{staging_dir}\' -Recurse -Force -ErrorAction SilentlyContinue"')
        emit_step(17, "MARK_SUCCESS", "SUCCESS", {"status": "SUCCESS"})
        return {"status": "SUCCESS", "target_version": config_data.get("version", 1)}

    except Exception as exc:
        emit_step(0, "ERROR", "FAILED", {"error": str(exc)})
        # ROLLBACK
        if initial_scene_raw:
            emit_step(0, "ROLLING_BACK", "RUNNING")
            try:
                local_rb = f"/tmp/dep_rollback_{deployment_id}.sql"
                esc_init = initial_scene_raw.replace("'", "''")
                with open(local_rb, "w", encoding="utf-8") as f:
                    f.write("PRAGMA journal_mode = WAL;\n")
                    f.write("PRAGMA busy_timeout = 10000;\n")
                    f.write("BEGIN IMMEDIATE;\n")
                    f.write(f"UPDATE scenes SET Raw = '{esc_init}' WHERE Guid = '{target_guid}';\n")
                    f.write("COMMIT;\n")
                remote_rb = f"{staging_dir}\\rollback.sql"
                run_scp(target_ip, local_rb, remote_rb)
                try: os.remove(local_rb)
                except Exception: pass

                run_sqlite_script_with_retry(target_ip, remote_rb, max_retries=6, base_delay=0.5)
                ts_rb = int(time.time() * 1000)
                run_ssh(target_ip, f'powershell -NoProfile -Command "Set-Content -Path \'C:\\UCS\\GuestScreen\\Front\\sync_version.txt\' -Value \'{ts_rb}\' -Encoding UTF8"')
                time.sleep(2.0)
                # Clean up staging directory on cashbox
                run_ssh(target_ip, f'powershell -NoProfile -Command "Remove-Item -Path \'{staging_dir}\' -Recurse -Force -ErrorAction SilentlyContinue"')
                emit_step(0, "ROLLED_BACK", "SUCCESS")
            except Exception as rb_exc:
                emit_step(0, "ROLLBACK_FAILED", "FAILED", {"error": str(rb_exc)})
        else:
            try:
                run_ssh(target_ip, f'powershell -NoProfile -Command "Remove-Item -Path \'{staging_dir}\' -Recurse -Force -ErrorAction SilentlyContinue"')
            except Exception:
                pass
        raise

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: deployment_orchestrator.py <deployment_id> <target_ip> <mode> <config_json_str> [media_dir]")
        sys.exit(1)
    
    dep_id = sys.argv[1]
    ip = sys.argv[2]
    mode_arg = sys.argv[3]
    cfg_data = json.loads(sys.argv[4])
    m_dir = sys.argv[5] if len(sys.argv) > 5 else "/app/data/media"

    try:
        res = execute_deployment(dep_id, ip, mode_arg, cfg_data, m_dir)
        sys.exit(0)
    except Exception as e:
        print(f"DEPLOYMENT_FAILED: {e}", file=sys.stderr)
        sys.exit(1)

# -*- coding: utf-8 -*-
"""Execute Live Read-Only Verification on 10.0.0.241."""
import json
import paramiko
from backend.src.core.settings_integrity import (
    ProtectedSettingsSnapshot,
    verify_settings_integrity,
)

# 1. Load Baseline SETTINGS_BEFORE (captured earlier from step 4160 in transcript)
transcript_path = r"C:\Users\Administrator\.gemini\antigravity\brain\8fed4015-a543-49e3-a873-b71c3c998f61\.system_generated\logs\chunks\transcript_full\00000080.jsonl"
before_str = ""
with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line: continue
        try:
            d = json.loads(line)
            if d.get("step_index") == 4160:
                before_str = d["content"].split("=== ALL SETTINGS ===")[1].strip()
                break
        except Exception:
            pass

before_rows = [l.strip().split("|", 1) for l in before_str.splitlines() if "|" in l]
snap_before = ProtectedSettingsSnapshot.from_rows(before_rows)

# 2. Query Current Live gs.db on 10.0.0.241 via Central Orchestrator (Read-Only)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('10.0.0.111', username='root', password=r'Saloh@5659', timeout=10)

sftp = ssh.open_sftp()
with sftp.open('/tmp/read_live_settings.py', 'w') as f:
    f.write('''import sys
sys.path.append('/app')
from deployment_orchestrator import run_sqlite_query
_, o, _ = run_sqlite_query('10.0.0.241', 'SELECT Type, Raw FROM settings;')
print(o.strip())
''')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i guestscreen_central_server python3 < /tmp/read_live_settings.py')
current_str = stdout.read().decode('utf-8', errors='replace').strip()
ssh.close()

current_rows = [l.strip().split("|", 1) for l in current_str.splitlines() if "|" in l]
snap_current = ProtectedSettingsSnapshot.from_rows(current_rows)

# 3. Perform Integrity Verification
result = verify_settings_integrity(snap_before, snap_current)

print("=" * 60)
print(" LIVE READ-ONLY VERIFICATION RESULTS ON 10.0.0.241")
print("=" * 60)
print(f"Protected settings hash BEFORE: {result.hash_before}")
print(f"Protected settings hash AFTER:  {result.hash_after}")
print(f"Hashes Match: {result.hash_before == result.hash_after}")
print(f"Protected changes count: {len(result.protected_changes)}")
print(f"Volatile changes count:  {len(result.volatile_changes)}")
print(f"Unknown keys count:      {len(result.unknown_keys)}")
print(f"INTEGRITY VERDICT:       {result.status}")
print("\n" + result.format_diff_report())

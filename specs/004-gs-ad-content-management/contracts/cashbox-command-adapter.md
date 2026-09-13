# Contract: Cashbox Remote Command Adapter (SSH Allowlist)

**Feature**: `004-gs-ad-content-management`  
**Transport**: AsyncSSH (OpenSSH Server on Windows POS Cashbox)  
**Execution Security**: Strict Allowlist (No arbitrary shell commands)

---

## 1. Allowed Command Definitions

All remote execution calls from the central backend to a cashier monoblock must pass through the `CashboxCommandAdapter`. Any attempt to call commands outside this contract raises `SecurityViolationError`.

### 1. `CMD_PING`
- **Purpose**: Verify SSH connectivity and shell responsiveness.
- **Command Template**: `powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Output PONG"`
- **Parameters**: None.
- **Timeout**: 5.0 seconds.
- **Expected Output**: Exact string `PONG`.
- **Exit Code**: 0.

---

### 2. `CMD_INVENTORY`
- **Purpose**: Collect actual state of `C:\UCS\GuestScreen\Front\media\uploads\`.
- **Command Template**:
  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -Command "
  $target = 'C:\UCS\GuestScreen\Front\media\uploads';
  if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null };
  Get-ChildItem -Path $target -File | Where-Object { $_.Name -notlike '.*' } | ForEach-Object {
      [PSCustomObject]@{
          filename = $_.Name;
          size = $_.Length;
          sha256 = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash.ToLower();
          modified_at = $_.LastWriteTimeUtc.ToString('o')
      }
  } | ConvertTo-Json -Compress
  "
  ```
- **Parameters**: None.
- **Timeout**: 8.0 seconds.
- **Expected Output**: JSON array of file metadata.
- **Exit Code**: 0.

---

### 3. `CMD_HASH_VERIFY`
- **Purpose**: Validate SHA-256 of uploaded files inside `.staging\<dep_id>\`.
- **Command Template**:
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\UCS\GuestScreen\Front\media\uploads\.staging\{dep_id}\{filename}').Hash.ToLower()"`
- **Parameter Validation**:
  - `dep_id`: UUID format `^[0-9a-fA-F-]{36}$`
  - `filename`: Safe name format `^[a-zA-Z0-9_\-\.]+$`
- **Timeout**: 10.0 seconds.
- **Expected Output**: 64-character lowercase hexadecimal hash.
- **Exit Code**: 0.

---

### 4. `CMD_STAGING_MOVE`
- **Purpose**: Atomically move verified file from staging to production uploads.
- **Command Template**:
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "Move-Item -LiteralPath 'C:\UCS\GuestScreen\Front\media\uploads\.staging\{dep_id}\{filename}' -Destination 'C:\UCS\GuestScreen\Front\media\uploads\{filename}' -Force; if (Test-Path 'C:\UCS\GuestScreen\Front\media\uploads\.staging\{dep_id}') { Remove-Item -LiteralPath 'C:\UCS\GuestScreen\Front\media\uploads\.staging\{dep_id}' -Recurse -Force -ErrorAction SilentlyContinue }"`
- **Parameter Validation**:
  - `dep_id`: `^[0-9a-fA-F-]{36}$`
  - `filename`: `^[a-zA-Z0-9_\-\.]+$`
- **Timeout**: 5.0 seconds.
- **Exit Code**: 0.

---

### 5. `CMD_SQLITE_READ_SCENE`
- **Purpose**: Read raw scene JSON before update or for verification.
- **Command Template**:
  `C:\UCS\GuestScreen\sqlite3.exe "C:\UCS\GuestScreen\gs.db" "SELECT Raw FROM scenes WHERE Guid = '{guid}';"`
- **Parameter Validation**:
  - `guid`: Must strictly equal either `2509359c-2d71-4344-9be4-7d90dd453083` (Full) or `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3` (50/50).
- **Timeout**: 5.0 seconds.
- **Exit Code**: 0.

---

### 6. `CMD_SQLITE_UPDATE_SCENE`
- **Purpose**: Transactional surgical scene injection into `gs.db`.
- **Command Template**:
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "$script = @' PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000; BEGIN IMMEDIATE; UPDATE scenes SET Raw = '{escaped_payload}' WHERE Guid = '{guid}'; COMMIT; '@; $script | & 'C:\UCS\GuestScreen\sqlite3.exe' 'C:\UCS\GuestScreen\gs.db'"`
- **Parameter Validation**:
  - `guid`: Strict whitelist check.
  - `escaped_payload`: Validated JSON string with single quotes escaped.
- **Timeout**: 12.0 seconds.
- **Retry Schedule on `database is locked`**: 3 attempts (200ms, 500ms, 1000ms).
- **Exit Code**: 0.

---

### 7. `CMD_TOUCH_RELOAD`
- **Purpose**: Trigger CefSharp hot reload watcher.
- **Command Template**:
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Content -Path 'C:\UCS\GuestScreen\Front\sync_version.txt' -Value '{timestamp}' -Encoding UTF8"`
- **Parameter Validation**:
  - `timestamp`: Integer or ISO8601 string `^[0-9T:\-\.Z]+$`
- **Timeout**: 3.0 seconds.
- **Exit Code**: 0.

---

### 8. `CMD_PROC_INSPECT`
- **Purpose**: Post-deployment verification of process stability.
- **Command Template**:
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name 'GuestScreen' -ErrorAction SilentlyContinue | Select-Object -Property Id, @{Name='StartTime'; Expression={$_.StartTime.ToString('o')}} | ConvertTo-Json -Compress"`
- **Parameters**: None.
- **Timeout**: 5.0 seconds.
- **Expected Output**: JSON object `{"Id": 4120, "StartTime": "2026-09-10T08:00:00.0000000Z"}`.
- **Exit Code**: 0.
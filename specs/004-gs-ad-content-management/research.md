# Technical Research & Architectural Decisions: Centralized Advertising Content Management for UCS GuestScreen

**Feature**: `004-gs-ad-content-management`  
**Date**: 2026-09-10  
**Status**: Completed  
**Spec Reference**: [spec.md](./spec.md)

---

## 1. Secret Management & Credential Security (AES-256-GCM Lifecycle)

### Context & Problem
Central management requires SSH access to 200+ POS cash registers. Cashboxes may use Windows username/password authentication or SSH private key authentication (optionally with a passphrase). Credentials must never be stored in plain text, logged, or exposed via the REST API.

### Decision
Implement authenticated symmetric encryption using **AES-256-GCM** via the standard Python `cryptography.hazmat.primitives.ciphers.aead.AESGCM` library.

### Detailed Lifecycle & Specification
1. **Master Key Provisioning**:
   - The master key `APP_MASTER_KEY` is loaded at runtime strictly from the host environment variable or a mounted container secret (e.g. `/run/secrets/app_master_key`).
   - Format: 64-character hexadecimal string representing a 256-bit (32-byte) key.
   - **Startup Validation Gate**: During application startup (FastAPI lifespan), the secret manager validates that `APP_MASTER_KEY` exists, is exactly 32 bytes, and passes a self-test encrypt/decrypt round-trip. If missing or malformed, the application aborts startup immediately (`sys.exit(1)`) with a structured fatal log: `CRITICAL: APP_MASTER_KEY is not configured or invalid. Refusing to start.`
2. **Nonce & Ciphertext Generation**:
   - For every single encryption operation, generate a cryptographically secure 96-bit (12-byte) random nonce using `os.urandom(12)`.
   - Never reuse nonces.
   - Encrypt the secret payload with associated authenticated data (AAD bound to `credential_id`).
   - Ciphertext structure stored in PostgreSQL `BYTEA` column `encrypted_secret`:
     $$\text{Payload} = \text{Nonce (12 bytes)} \parallel \text{Ciphertext} \parallel \text{Auth Tag (16 bytes)}$$
3. **Decryption Flow**:
   - Decryption takes the raw byte sequence, extracts the first 12 bytes as the nonce, and decrypts the remainder using AES-256-GCM with the corresponding AAD.
   - If authentication verification fails (corrupted data or wrong key), an `InvalidTag` exception is raised, and the operation is aborted without exposing raw data.
4. **Key Rotation Protocol**:
   - Support zero-downtime key rotation via an admin CLI utility:
     `python -m src.cli.rotate_keys --old-key $OLD_KEY --new-key $NEW_KEY`
   - Runs in a single PostgreSQL database transaction: fetches all `ssh_credentials` rows, decrypts with `OLD_KEY`, re-encrypts with `NEW_KEY` (generating fresh nonces for each row), and commits atomically.
5. **Backup & Disaster Recovery**:
   - The `APP_MASTER_KEY` must be backed up securely in the enterprise password manager / KMS (Bitwarden / Vault / offline cold storage).
   - Database backups (pg_dump) contain only encrypted ciphertext and are useless without `APP_MASTER_KEY`.

---

## 2. Deployment State Engine & Recovery Architecture

### Context & Problem
Deployments span 200+ network nodes across distributed restaurant branches. Network dropouts or central server restarts must not cause state loss, phantom deployments, or conflicting concurrent modifications to cashboxes. Relying purely on an in-memory queue (`asyncio.Queue`) causes lost state if the server restarts.

### Decision
**PostgreSQL 16 is the sole persistent Source of Truth.** The in-memory `asyncio.Queue` is used strictly as a runtime execution dispatcher.

### State Machine Specification

```text
               ┌─────────────┐
               │   PENDING   │ ◄───────────────────────────┐
               └──────┬──────┘                             │ (Server crash
                      │ (Worker picks up)                  │  recovery /
                      ▼                                    │  re-queue)
               ┌─────────────┐                             │
               │   RUNNING   │ ────────────────────────────┤
               └──────┬──────┘                             │
                      │ (Step 1-13 complete)               │
                      ▼                                    │
               ┌─────────────┐                             │
        ┌───── │  VERIFYING  │ ────────────────────────────┘
        │      └──────┬──────┘
        │             │ (Verification step 14-16 pass)
        │ (Fail)      ▼
        │      ┌─────────────┐
        │      │   SUCCESS   │ (Terminal State)
        │      └─────────────┘
        │
        ▼
 ┌──────────────┐
 │ ROLLING_BACK │ ─────────────┐ (Rollback step 1-6 succeed)
 └──────┬───────┘              ▼
        │               ┌─────────────┐
        │ (Fail)        │ ROLLED_BACK │ (Terminal State)
        ▼               └─────────────┘
 ┌──────────────────────────────┐
 │  FAILED_MANUAL_INTERVENTION  │ (Terminal Alert State)
 └──────────────────────────────┘
```

### Valid State Transitions
1. `PENDING` → `RUNNING`: Worker begins SSH connection and inventory.
2. `PENDING` → `CANCELLED`: Operator manually cancels before execution starts.
3. `RUNNING` → `VERIFYING`: Files moved, SQLite scene updated, `sync_version.txt` touched.
4. `RUNNING` → `FAILED`: Early failure (SSH unreachable, central media missing, hash check failed in staging).
5. `RUNNING` → `NO_OP`: Desired state already matches actual state (idempotent skip).
6. `VERIFYING` → `SUCCESS`: PID stable, scene verified in SQLite, reload acknowledged.
7. `VERIFYING` → `ROLLING_BACK`: PID changed, reload timed out (>15s), or scene corrupted.
8. `ROLLING_BACK` → `ROLLED_BACK`: Scene reverted to snapshot, `sync_version.txt` touched, reload verified.
9. `ROLLING_BACK` → `FAILED_MANUAL_INTERVENTION`: Revert transaction failed or cashbox became unreachable during rollback.

### Server Restart Reconciliation Algorithm (On Lifespan Startup)
When FastAPI boots up:
1. Query `SELECT id, cashbox_id, status FROM deployments WHERE status IN ('RUNNING', 'VERIFYING', 'ROLLING_BACK')`.
2. For each interrupted deployment:
   - Connect to cashbox via SSH.
   - Inspect `GuestScreen.exe` PID and query current scene from `gs.db`.
   - If the target scene is already correctly applied and verified → update status to `SUCCESS`.
   - If in incomplete/inconsistent state → initiate automatic rollback or mark `FAILED_MANUAL_INTERVENTION`.
3. Query `SELECT id FROM deployments WHERE status = 'PENDING' ORDER BY created_at ASC`.
4. Re-enqueue pending IDs into the runtime worker pool.

---

## 3. Concurrency, Worker Pool & Per-Cashbox Serialization

### Context & Problem
Multiple operators or batch campaigns targeting 200+ cashboxes must not overload restaurant branch networks or create race conditions on the same cashbox.

### Decision
1. **Configurable Worker Pool**:
   - A background worker manager maintains $N$ worker tasks (default: **4 concurrent cashboxes**).
   - The value is read from PostgreSQL table `system_settings` (`default_concurrency_pool = 4`) and can be adjusted dynamically via admin API without restart.
2. **Per-Cashbox Mutual Exclusion (PostgreSQL Advisory Locks)**:
   - Before any worker begins touching a cashbox, it acquires a PostgreSQL advisory lock:
     `SELECT pg_try_advisory_lock(hashtext('cashbox:' || :cashbox_id::text))`
   - If the lock returns `FALSE`, another deployment is currently active for this cashbox. The worker skips this item or re-queues it with a delay.
   - Lock is strictly released upon entering a terminal state (`SUCCESS`, `FAILED`, `ROLLED_BACK`, `CANCELLED`).
   - Guarantees **zero concurrent deployments** for the same cashbox across any number of server processes.

---

## 4. SQLite Execution Strategy & Bounded Retry Policy

### Context & Problem
Direct file replacement of `C:\UCS\GuestScreen\gs.db` is strictly forbidden. The system must perform surgical updates of `scenes` using the local CLI `C:\UCS\GuestScreen\sqlite3.exe`. Cashiers actively ringing up orders in r_keeper may cause transient database locks.

### Decision
1. **Local CLI Invocation**:
   Execute `C:\UCS\GuestScreen\sqlite3.exe "C:\UCS\GuestScreen\gs.db"` over AsyncSSH.
2. **WAL Mode & Busy Timeout**:
   Every invocation begins with:
   `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;`
3. **Strict Bounded Retry Schedule**:
   If SQLite returns error code 5 (`SQLITE_BUSY` / `database is locked`):
   - Attempt 1: wait 200ms
   - Attempt 2: wait 500ms
   - Attempt 3: wait 1000ms
   - Maximum total wait time: 1.7 seconds.
   - If all 3 attempts fail: abort transaction, execute `ROLLBACK`, report failure. Never retry indefinitely.
4. **Backend-Controlled Parameterized Statements**:
   Central server constructs typed statements without accepting user SQL.
   - Scene update template:
     ```sql
     BEGIN IMMEDIATE;
     UPDATE scenes SET Raw = :payload WHERE Guid = :guid;
     COMMIT;
     ```

---

## 5. Storage Abstraction Architecture

### Context & Problem
The central server stores media on the local filesystem in MVP, but must allow transparent migration to MinIO/S3 object storage in future iterations without rewriting business services.

### Decision
Implement the **Provider / Port Pattern**:

```python
class StorageProvider(typing.Protocol):
    async def save(self, file_data: bytes, filename: str) -> str: ...
    async def get(self, storage_path: str) -> bytes: ...
    async def exists(self, storage_path: str) -> bool: ...
    async def delete(self, storage_path: str) -> bool: ...
    async def get_stream(self, storage_path: str) -> typing.AsyncIterator[bytes]: ...
```

- MVP Implementation: `LocalFileSystemStorageProvider` storing in `/var/lib/guestscreen/media/` (or Windows path).
- Future Implementation: `S3StorageProvider` connecting via aioboto3.
- Media Service depends strictly on `StorageProvider` interface.
- Path traversal prevention: `filename` must match regex `^[a-zA-Z0-9_\-\.]+$` and cannot contain path separators.

---

## 6. SSH Command Allowlist & Execution Adapter

### Context & Problem
Remote command execution on POS cash registers poses critical security risks. Arbitrary shell access from the UI/API is completely prohibited.

### Decision
Define a closed set of typed commands executed through `CashboxCommandAdapter`:

1. `CMD_PING`: Handshake validation.
2. `CMD_INVENTORY`: Execution of standard PowerShell inventory script returning JSON array of file attributes (`filename`, `size`, `sha256`, `modified_at`).
3. `CMD_HASH_VERIFY`: Execution of `Get-FileHash -Algorithm SHA256` on files in `.staging/<dep_id>/`.
4. `CMD_STAGING_MOVE`: Atomic move from `.staging/<dep_id>/<file>` to `uploads/<file>`.
5. `CMD_SQLITE_EXEC`: Execution of parameterized script with `sqlite3.exe`.
6. `CMD_TOUCH_RELOAD`: Updating `sync_version.txt`.
7. `CMD_PROC_INSPECT`: Querying `Get-Process GuestScreen | Select-Object Id, StartTime`.

Any command outside this allowlist is rejected by the backend adapter with an exception before touching the network.
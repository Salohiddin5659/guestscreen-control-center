# Phase 0: Research & Architectural Decisions — Media File Server Synchronization

**Feature Identifier**: `002-media-file-server-sync`  
**Date**: 2026-09-04  
**Target Environment**: Dedicated Host `10.0.0.111` (100% Docker Compose)  

---

## 1. Storage Compatibility & MinIO Object Key Scheme

### Decision:
Maintain **100% backward compatibility** with the established Iteration 2.0 MinIO object key scheme:
- Media binaries: `media/{sha256}.{ext}` (e.g. `media/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.jpg`).
- Thumbnails: `thumbnails/{sha256}.webp`.
- Conflict copies: `media/conflicts/{sha256}.{ext}`.

### Rationale:
The existing Media Library and publication orchestrator already rely on content-addressed keys formatted as `media/{sha256}.{ext}`. In-flight cashiers (`10.0.0.241` and fleet), workers, and historical publication snapshots reference these exact keys.
By decoupling the **physical File Server path** (e.g. `marketing/seasonal/autumn_menu.png`, stored in `media_assets.file_server_path`) from the **S3 storage key** (`media/<sha256>.png`), we achieve:
1. Complete interoperability between files uploaded via Web UI and files ingested from File Server.
2. Perfect content deduplication across disparate directories.
3. Zero database schema breakage or migration overhead for existing active assets.

### Alternatives Considered:
- *Mirroring File Server folder hierarchy inside MinIO (`media/marketing/seasonal/autumn_menu.png`)*: Rejected. Breaks content-addressed deduplication, creates duplicate binaries when files are moved or renamed, and introduces path-length and URL-encoding bugs.

---

## 2. SMB/CIFS Protocol Implementation in Docker

### Decision:
Use the **`smbprotocol`** library (with its high-level `smbclient` interface) in Python:
- Package: `smbprotocol>=1.15.0`.
- Implemented within an abstract `FileServerAdapter` base class to permit both `SmbAdapter` (primary V1 standard) and `MountedPathAdapter` (for local development, container volume mounts, and automated unit testing).

### Rationale:
1. **Userspace Execution**: `smbprotocol` is a pure Python implementation of the SMBv2 and SMBv3 protocol specifications. It runs entirely inside standard unprivileged Docker containers without requiring Linux kernel CIFS modules, `mount.cifs`, or `cap_add: [SYS_ADMIN]`.
2. **Security & SMBv3**: Supports modern authenticated encryption (AES-128-GCM / AES-128-CCM), NTLMv2, and Kerberos.
3. **Chunked Streaming**: Exposes standard Python file-like objects (`smbclient.open_file()`) with chunked reads and writes, enabling 8MB streaming SHA-256 calculation and atomic `.tmp_<uuid>` uploads without high RAM usage.
4. **Resilience**: Session registration (`smbclient.register_session(host, username, password, port=445)`) can be cleanly re-established on network disconnects with exponential backoff.

### Alternatives Considered:
- *Host-level CIFS mount into container*: Rejected. Requires root host configuration, credentials in `/etc/fstab` or credential files on the host OS, and breaks Docker stack self-containment.
- *`pysmb`*: Rejected. Lacks robust SMBv3 support and connection keepalive mechanisms compared to `smbprotocol`.

---

## 3. Two-Way Sync Loop Prevention (Echo Suppression)

### Problem Statement:
Bidirectional synchronization between two systems (File Server $\leftrightarrow$ Central Control) inherently risks infinite ping-pong loops:
Central Control exports `banner.jpg` $\rightarrow$ File Server mtime updates $\rightarrow$ Scanner detects changed mtime $\rightarrow$ Central Control treats it as external update $\rightarrow$ Re-exports to File Server ...

### Decision:
Implement **Cryptographic Echo Suppression**:
1. In `media_assets`, store:
   - `last_sync_sha256: Optional[str]`
   - `file_server_mtime: Optional[datetime]`
   - `file_server_size: Optional[int]`
2. **Reverse Sync (Central Control $\rightarrow$ File Server)**:
   - Central Control writes binary to File Server via atomic temporary file.
   - Upon rename, Central Control immediately queries remote `mtime` and `size`.
   - Central Control updates in database:
     - `last_sync_sha256 = current_sha256`
     - `file_server_mtime = remote_mtime`
     - `file_server_size = remote_size`
3. **Forward Scan (File Server $\rightarrow$ Central Control)**:
   - For every remote file inspected:
     - If `remote_mtime == file_server_mtime` AND `remote_size == file_server_size` $\rightarrow$ **SKIP** (Zero disk I/O, file unaltered).
     - If mtime or size differs, read first 8KB or stream SHA-256:
       - If calculated `remote_sha256 == last_sync_sha256` $\rightarrow$ **SKIP & UPDATE MTIME** (This is an echo of our own write; update `file_server_mtime` to match without firing a change event).
       - If `remote_sha256 != last_sync_sha256` $\rightarrow$ **LEGITIMATE EXTERNAL CHANGE** (Proceed with ingestion or conflict detection).

### Alternatives Considered:
- *Sidecar metadata files (`.banner.jpg.meta` on File Server)*: Rejected. Pollutes customer corporate network share with hidden files that designers might accidentally delete or modify.

---

## 4. Large Media Files & Write-in-Progress Detection

### Decision:
1. **Write-in-Progress Detection (Size-Stability Probe)**:
   - When the scanner encounters a new or modified file, it records `(size_1, mtime_1)`.
   - If the file is modified within the last 10 seconds, the scanner tests file lock / readability.
   - It re-checks `(size_2, mtime_2)` after a 2-second sleep:
     - If `size_1 != size_2` or the file throws `STATUS_SHARING_VIOLATION` $\rightarrow$ the file is actively being copied by an external designer. Ingestion is deferred to the next sync cycle.
2. **Streaming SHA-256 Calculation**:
   - Files are read in 8MB chunks:
     ```python
     hasher = hashlib.sha256()
     with smb_file as f:
         while chunk := f.read(8 * 1024 * 1024):
             hasher.update(chunk)
     ```
   - Memory consumption remains strictly below 32MB even when processing 500MB MP4 videos.
3. **Atomic Reverse Push**:
   - Files pushed from Central Control to File Server are written to `<filename>.tmp_<uuid>`.
   - The remote SHA-256 of the temporary file is verified against Central Control's hash.
   - Upon verification, an atomic SMB rename replaces `<filename>`.

---

## 5. MinIO S3 Reference Counting with Historical Snapshots

### Decision:
Extend `get_s3_reference_count` to inspect both active `media_assets` AND historical `publication_batches.content_snapshot_json`:

```sql
WITH active_refs AS (
    SELECT count(*) AS cnt 
    FROM media_assets 
    WHERE s3_key = :s3_key AND is_deleted = false AND id != :exclude_id
),
snapshot_refs AS (
    SELECT count(*) AS cnt 
    FROM publication_batches 
    WHERE content_snapshot_json::text LIKE '%' || :s3_key || '%'
)
SELECT (active_refs.cnt + snapshot_refs.cnt) 
FROM active_refs, snapshot_refs;
```

### Rationale:
Constitution Principle VIII dictates full auditability and zero historical data corruption. If a media asset is deleted from Central Control and File Server, its physical binary in MinIO must **NEVER** be deleted if any historical publication batch references it in `content_snapshot_json`. This guarantees that past deployment records and rollback logs can always be inspected.

---

## 6. Background Worker Architecture & Concurrency Lock

### Decision:
1. Use **Arq** background worker pool (already running in `gs_worker_pool` container):
   - Recurring cron job `sync_file_server_cron` scheduled every $N$ seconds.
   - Distributed Redis mutex lock `lock:file_server_sync` with 120s TTL to prevent overlapping runs if a large directory scan takes longer than the poll interval.
2. Manual on-demand trigger (`POST /api/v1/media-sync/reconcile`):
   - Enqueues immediate high-priority Arq task `run_file_server_reconcile_job`.
   - UI polls job status or receives SSE event upon completion.

---

## 7. Test SMB Environment on Target Host `10.0.0.111`

### Decision:
Provision a dedicated, containerized Samba service `gs_test_samba` in `deploy/docker-compose.yml` (or test profile) on host `10.0.0.111`:
- Image: `dperson/samba` or Alpine-based smbd.
- Exposed internally on Docker network `gs_network` at `test_samba:445`.
- Shared volume: `deploy_test_share` mapped to `/share`.
- Pre-configured test credentials: user `smbtest`, password `testpass123`, share `guestscreen`.
- This ensures 100% realistic end-to-end testing of SMB protocol, network timeouts, credential failures, and file transfers purely within host `10.0.0.111` with zero external dependencies.

# Implementation Plan: Bidirectional File Server <-> Central Control Media Synchronization

**Branch**: `002-media-file-server-sync` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-media-file-server-sync/spec.md`  

---

## 1. Executive Summary

This plan details the implementation of **Bidirectional Media Synchronization** between an external corporate File Server (SMB/CIFS primary, LocalMount fallback) and Central Control's Media Library.
The solution guarantees:
1. **Metadata & Business Master**: PostgreSQL 16 on `10.0.0.111`.
2. **Physical Original Master**: Corporate File Server.
3. **Content-Addressed Fast Cache**: MinIO S3 (`media/{sha256}.{ext}`) for serving and worker fleet distribution.
4. **Autonomous Client Cashiers**: Cashiers play 100% locally from `Front\media\uploads\`, completely decoupled from File Server availability.
5. **Robust Safety**: Zero sync loops (echo suppression), zero silent overwrites (conflict copy preservation), safe deletion protecting historical snapshots, and blocking unverified media (`MISSING_ON_SOURCE`) from new publications with `HTTP 422`.
6. **100% POS Invariant Compliance**: Zero full `gs.db` copies, zero touch to `licenses`, `screens`, `settings`, zero background agents on POS, zero process kills.

---

## 2. Technical Context

- **Language/Version**: Python 3.12 (Backend & Workers), TypeScript 5.4 / React 18 (Frontend).
- **Primary Dependencies**:
  - `smbprotocol>=1.15.0`: Pure Python SMBv2/v3 client (userspace, no kernel privileges needed in Docker).
  - `aioboto3>=13.2.0`: Async S3 client for MinIO.
  - `arq>=0.26.1`: Async Redis-backed job queue & cron worker.
  - `cryptography>=43.0.0`: Authenticated symmetric encryption for SMB passwords (`GS_MASTER_KEY`).
  - `sqlmodel>=0.0.22` / `alembic>=1.14.0`: ORM and transactional schema migrations.
  - `pillow>=11.0.0`: Media format & thumbnail verification.
- **Storage Architecture**:
  - PostgreSQL 16: Metadata, sync statuses, conflict records, audit trail.
  - MinIO S3: Content-addressed binary cache (`media/<sha256>.<ext>`) and thumbnails (`thumbnails/<sha256>.webp`).
  - File Server: SMB/CIFS network share (port 445).
- **Testing & Verification**:
  - Automated pytest test suites on `10.0.0.111`.
  - Dedicated containerized Samba service `gs_test_samba` inside `deploy/docker-compose.yml`.
  - Dedicated physical cashier `10.0.0.241` for zero-touch publication verification.
- **Target Platform**: Dedicated server `10.0.0.111` (Ubuntu 24.04 LTS, 100% Docker Compose).
- **Performance Goals**:
  - Ingestion / hashing of 50MB file: $<15$ seconds.
  - Memory consumption during large video (500MB) processing: strictly $<32$MB RAM (streaming 8MB buffer).
  - Conflict detection latency: $<50$ms.
  - Initial reconciliation of 500 files: $<120$ seconds.
- **Constraints**:
  - Never set `sync_status = SYNCED` until both sides have physically verified matching SHA-256 hashes.
  - Prevent ping-pong loops via `last_sync_sha256` and remote `mtime`/`size` recording.

---

## 3. Constitution Check

*GATE: Evaluation against GS Control Center Constitution.*

| Principle | Requirement | Design Compliance | Status |
| :--- | :--- | :--- | :---: |
| **Principle I** | Immutability of `licenses` & `screens` | Media sync operates strictly between File Server, Central Control, and `Front\media\uploads\`. POS tables `licenses`, `screens`, `settings` have 0 writes. | **PASS** |
| **Principle II** | Target Host `10.0.0.111` Only | All builds, Samba containers, PostgreSQL migrations, and tests run exclusively on `10.0.0.111`. Developer PC has 0 dependencies. | **PASS** |
| **Principle III** | 100% Docker-Only | `smbprotocol` runs inside existing `gs_backend_api` and `gs_worker_pool` containers; test Samba runs in `gs_test_samba` container. | **PASS** |
| **Principle IV** | Agentless Push via SSH | Cashiers never connect to File Server. Workers push verified MinIO binaries over SSH. Zero agents on POS. | **PASS** |
| **Principle V** | Surgical & Atomic Media Injection | Only `UPDATE scenes SET Raw` in WAL mode; atomic rollback if verify fails; `GuestScreen.exe` process is never terminated. | **PASS** |
| **Principle VI** | Concurrency & Fault Isolation | File Server downtime does not affect cashier playback or publication rollout; Redis lock prevents overlapping sync runs. | **PASS** |
| **Principle VII** | Centralized Repository & Web UI | All configs, sync status badges, conflict resolutions, and triggers are operated via Central Control Web UI. | **PASS** |
| **Principle VIII** | Security & Full Auditability | SMB passwords encrypted with `GS_MASTER_KEY`; credentials masked in API/logs; all sync events logged to `audit_logs`. | **PASS** |
| **Principle IX** | Empirical Hardware Validation | Zero assumptions: SMB file sync and cashier isolation validated on live test hardware `10.0.0.241`. | **PASS** |

---

## 4. Project Structure & File Layout

```text
d:\Anti\
├── deploy/
│   ├── docker-compose.yml              # Add gs_test_samba container for validation
│   └── docker/
│       └── backend.Dockerfile          # Includes smbprotocol dependency
├── specs/002-media-file-server-sync/
│   ├── spec.md                         # Clarified feature specification
│   ├── plan.md                         # This implementation plan
│   ├── research.md                     # Phase 0: Protocol & loop prevention research
│   ├── data-model.md                   # Phase 1: Extended entities & Alembic plan
│   ├── quickstart.md                   # Phase 1: Validation scenarios on 10.0.0.111
│   ├── contracts/
│   │   └── api.yaml                    # Phase 1: OpenAPI 3.1 specification
│   └── checklists/
│       └── requirements.md             # Spec quality checklist (25/25 PASS)
└── src/
    ├── backend/
    │   ├── requirements.txt            # Add smbprotocol>=1.15.0
    │   ├── app/
    │   │   ├── adapters/
    │   │   │   └── file_server/
    │   │   │       ├── __init__.py
    │   │   │       ├── base.py         # FileServerAdapter interface
    │   │   │       ├── smb_adapter.py  # SMBv2/v3 adapter using smbprotocol
    │   │   │       ├── mount_adapter.py# Container-mounted volume adapter
    │   │   │       └── factory.py      # FileServerAdapterFactory
    │   │   ├── models/
    │   │   │   ├── content.py          # Extended MediaAsset with sync fields
    │   │   │   └── file_server.py      # FileServerConfig, MediaSyncConflict
    │   │   ├── services/
    │   │   │   ├── file_sync_service.py# Sync engine: reconcile, delta, echo suppression
    │   │   │   └── media_gc.py         # S3 ref-count protecting historical snapshots
    │   │   ├── api/v1/
    │   │   │   ├── file_server.py      # Config CRUD & test-connection endpoint
    │   │   │   ├── media_sync.py       # Reconcile trigger, status, conflicts & resolve
    │   │   │   └── publications.py     # Block MISSING_ON_SOURCE with HTTP 422
    │   │   └── main.py                 # Register new API routers
    │   ├── migrations/versions/
    │   │   └── 008_file_server_sync.py # Alembic migration
    │   ├── tests/
    │   │   ├── test_file_server_adapter.py # Adapter unit & mock tests
    │   │   ├── test_file_sync_service.py   # Reconcile, loop prevention, conflicts
    │   │   └── test_s3_snapshot_protection.py # Ref-count snapshot protection
    │   └── workers/
    │       └── main.py                 # Arq background sync cron & lock
    └── frontend/
        └── src/
            ├── api/client.ts           # TS bindings for file-server & sync API
            ├── pages/
            │   ├── MediaLibrary.tsx    # Color-coded sync badges & conflict dialog
            │   └── FileServerSettings.tsx # File Server configuration & status UI
            └── components/
                └── ConflictResolveModal.tsx # Interactive conflict resolution
```

---

## 5. Implementation Phases

### Phase 1: Core Adapters & Protocols (Foundational)
1. Add `smbprotocol>=1.15.0` to `src/backend/requirements.txt`.
2. Implement abstract `FileServerAdapter` in `app/adapters/file_server/base.py`:
   - Methods: `connect()`, `disconnect()`, `list_files(subpath)`, `stat(path)`, `read_chunks(path, chunk_size=8MB)`, `write_atomic(path, data_stream)`, `rename(src, dst)`, `remove(path)`, `archive(path, archive_folder)`.
3. Implement `SmbAdapter` using `smbclient` with session registration, timeouts (45s), and retry on network reset.
4. Implement `MountedPathAdapter` for container-mounted volumes.
5. Unit test adapters with mocks in `tests/test_file_server_adapter.py`.

### Phase 2: Database Schema & Alembic Migration
1. Define SQLModel models `FileServerConfig` and `MediaSyncConflict` in `app/models/file_server.py`.
2. Add sync tracking columns to `MediaAsset` in `app/models/content.py`:
   - `file_server_path`, `file_server_mtime`, `file_server_size`, `last_sync_sha256`, `sync_status`, `sync_error_message`, `source_origin`, `last_synced_at`.
3. Generate Alembic migration `008_file_server_sync.py` (Revises `007_pub_ad_block_nullable`).
4. Apply migration on `10.0.0.111`.

### Phase 3: Synchronization Engine & Echo Suppression
1. Implement `FileSyncService` in `app/services/file_sync_service.py`:
   - **Initial Reconciliation**: 4-way deterministic match (Q09).
   - **Streaming Hashing**: 8MB chunks, calculate SHA-256 without memory spikes (Q14).
   - **Write-in-Progress Detection**: 2-probe size stability check + file lock check (Q14).
   - **Loop Prevention (Echo Suppression)**: Check `last_sync_sha256` and remote `mtime`/`size` to skip Central Control reverse writes (Q10).
   - **Reverse Sync**: Push Central Control uploads/replaces to File Server via `.tmp_<uuid>` and atomic rename (Q02).
   - **Conflict Handling**: Detect concurrent edits, preserve both versions in `media/conflicts/`, mark status `CONFLICT` (Q07, Q08).
   - **Safe Deletion**: Archive to `.archive/<ts>_<filename>` (Policy `ARCHIVE`) or delete; retain MinIO binary if referenced in historical snapshots (Q02).
2. Extend `media_gc.py` to inspect `publication_batches.content_snapshot_json` before deleting physical MinIO binaries (Q02).

### Phase 4: API Endpoints & Publication Guards
1. Implement `app/api/v1/file_server.py`:
   - `GET /api/v1/file-server/config` (masked password).
   - `PUT /api/v1/file-server/config` (encrypted password via `encrypt_secret()`).
   - `POST /api/v1/file-server/test-connection` (round-trip read/write check).
2. Implement `app/api/v1/media_sync.py`:
   - `POST /api/v1/media-sync/reconcile` (on-demand sync trigger).
   - `GET /api/v1/media-sync/status` (engine stats, counts).
   - `GET /api/v1/media-sync/conflicts` (list open conflicts).
   - `POST /api/v1/media-sync/conflicts/{id}/resolve` (interactive resolution).
3. Update `app/api/v1/publications.py`:
   - Enforce check: If any template asset has `sync_status IN ('MISSING_ON_SOURCE', 'CONFLICT', 'ERROR')`, reject publication with `HTTP 422 Unprocessable Entity` (Q03).

### Phase 5: Worker Scheduling & Redis Concurrency Lock
1. In `src/workers/main.py`:
   - Register recurring Arq cron job `sync_file_server_cron`.
   - Implement distributed Redis lock `lock:file_server_sync` (120s TTL) to prevent overlapping runs.
   - Dispatch `run_file_server_reconcile_job` on manual UI trigger.

### Phase 6: Frontend Management Console
1. Update `src/frontend/src/api/client.ts` with TypeScript types and methods.
2. In `MediaLibrary.tsx`:
   - Add status badges (`SYNCED` green, `PENDING` yellow, `CONFLICT` orange, `MISSING`/`ERROR` red).
   - Add filter by `sync_status`.
   - Add "Синхронизировать сейчас" button with live progress spinner.
   - Add interactive `ConflictResolveModal.tsx`.
3. Create `FileServerSettings.tsx` in administration dashboard.

### Phase 7: Automated Testing & Test Samba Stack on `10.0.0.111`
1. Add `gs_test_samba` container to `deploy/docker-compose.yml`.
2. Run automated test suite inside `gs_backend_api` container:
   - `test_file_server_adapter.py`
   - `test_file_sync_service.py`
   - `test_s3_snapshot_protection.py`
3. Execute end-to-end integration scenarios against `gs_test_samba` (50+ file mass drop, reverse push, conflict resolution, loop prevention).
4. Verify cashier isolation on live terminal `10.0.0.241` (zero touch to `licenses`/`screens`/`settings`, pure MinIO push).

---

## 6. Risk Management & Mitigations

| Risk | Criticality | Mitigation Strategy |
| :--- | :---: | :--- |
| **SMB Network Latency / Packet Drops** | Medium | Session pooling in `SmbAdapter`, connection keepalives, 45s command timeout, and exponential backoff retry. |
| **Corporate File Share Write Permission Denied** | High | `test-connection` endpoint verifies both read AND write capabilities; clear error reporting in UI. |
| **Silent Overwrite on External Edit** | High | Non-destructive conflict policy: incoming version always stored in `media/conflicts/`, asset flagged `CONFLICT`. |
| **Infinite Sync Loop** | High | Echo suppression via `last_sync_sha256` and remote `mtime`/`size` match. |
| **POS Display Blanking** | Critical | Constitution Guard: Deleting a file on the File Server sets `MISSING_ON_SOURCE`; MinIO and cashier local binaries are NEVER deleted. |
| **Overlapping Sync Jobs** | Medium | Redis distributed lock `lock:file_server_sync` prevents concurrent scanner instances. |

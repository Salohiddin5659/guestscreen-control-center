# Implementation Plan: GS Control Center

**Feature**: `001-gs-control-center`  
**Date**: 2026-09-04  
**Target Environment**: Dedicated On-Premise Host `10.0.0.111` (Docker Compose)  
**Content Model**: `Advertising Block` → `Area` → `Display Mode` → `Media Items (Playlist)`  
**Spec Reference**: [spec.md](./spec.md) | [data-model.md](./data-model.md) | [cashier-adapter.md](./contracts/cashier-adapter.md) | [api.yaml](./contracts/api.yaml) | [quickstart.md](./quickstart.md)  
**Status**: Plan Revised & Ratified (Ready for Phase 2 Task Decomposition)  

---

## 1. Architecture Overview

GS Control Center is an on-premise centralized digital advertising and signage management system engineered specifically for fast-food restaurant chains operating **UCS / r_keeper Guest Screen** across **200+ cashier monoblocks**.

The entire central infrastructure runs containerized on dedicated server **`10.0.0.111`**. It communicates with Windows POS cashiers strictly via an **agentless push model over SSH**, eliminating the need for client-side daemons, services, or scheduled tasks.

```text
                                  +-------------------------------------------------------------+
                                  |                CENTRAL HOST 10.0.0.111                      |
                                  |                                                             |
   [ Browser Client ]             |   +-----------------------+     +-----------------------+   |
   Marketing / Admin  ───────────►│   |     Reverse Proxy     |────►|      Web UI (SPA)     |   |
                                  |   |     (Nginx Alpine)    |     |   (React 18 + Vite)   |   |
                                  |   +-----------┬-----------+     +-----------------------+   |
                                  |               │                                             |
                                  |               ▼                                             |
                                  |   +-----------------------+     +-----------------------+   |
                                  |   |      Backend API      |◄───►|     PostgreSQL 16     |   |
                                  |   | (FastAPI / Python 3.12|     |  (Single Source Truth)|   |
                                  |   +-----------┬-----------+     +-----------------------+   |
                                  |               │                                             |
                                  |         Enqueue Jobs                                        |
                                  |               ▼                                             |
                                  |   +-----------------------+     +-----------------------+   |
                                  |   |      Redis 7 Queue    |◄───►|       MinIO S3        |   |
                                  |   |    (Atomic Locking)   |     |    (Media Storage)    |   |
                                  |   +-----------┬-----------+     +-----------▲-----------+   |
                                  |               │                             │               |
                                  |         Worker Dispatch               Pull Media            |
                                  |               ▼                             │               |
                                  |   +-----------------------------------------┴-----------+   |
                                  |   |                SSH Worker Pool                      |   |
                                  |   |        (ARQ AsyncIO, 15-30 Workers)                 |   |
                                  +---+-----------------------┬-----------------------------+---+
                                                              │
                                      Agentless Push via SSH  │ Outbound TCP 22
                                                              ▼
               =================================================================================
                                          PRIVATE RETAIL NETWORK (VPN/VLAN)
               =================================================================================
                            │                                                │
                            ▼                                                ▼
              +---------------------------+                    +---------------------------+
              |   POS Monoblock 10.0.0.241|                    |      POS Monoblock N      |
              |   Windows OpenSSH Server  |                    |   Windows OpenSSH Server  |
              |   ----------------------  |                    |   ----------------------  |
              |   Front/media/uploads/    |                    |   Front/media/uploads/    |
              |   gs.db (scenes ONLY)     |                    |   gs.db (scenes ONLY)     |
              |   GuestScreen.exe         |                    |   GuestScreen.exe         |
              +---------------------------+                    +---------------------------+
```

---

## 2. Business Content Model & Inviolable Scene Topology

The system structures all promotional material according to a strict four-tier domain model:
$$\text{Advertising Template} \longrightarrow \text{Area} \longrightarrow \text{Display Mode} \longrightarrow \text{Playlist Items}$$

### 2.1 Areas & Inviolable Physical Scene Mapping
1. **`FULL_SCREEN`**: Fullscreen promotional display on the secondary monitor (Resolution: 1024×768, 4:3 ratio).
   - Mode 1 (standby / idle).
   - **Resolved strictly and exclusively to GUID**: `2509359c-2d71-4344-9be4-7d90dd453083`.
   - `STATIC` mode sets `type: "image"` (renders CefSharp Vue component `image-scene`).
   - `SLIDESHOW` mode sets `type: "gallery"` (renders CefSharp Vue component `gallery-scene`).
   - `VIDEO` mode sets `type: "video"` (renders CefSharp Vue component `video-scene`).
2. **`MODE32_PROMO`**: Right-half promotional block during active order entry (Resolution: 512×768, 2:3 ratio).
   - Mode 32 (50/50 order screen split). Left half (0..512 px) contains customer check and is **100% untouched**.
   - **Resolved strictly and exclusively to GUID**: `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3`.
   - `STATIC` mode sets `type: "image"` (renders CefSharp Vue component `image-scene`).
   - `SLIDESHOW` mode sets `type: "gallery"` (renders CefSharp Vue component `gallery-scene`).
   - `VIDEO` mode sets `type: "video"` (renders CefSharp Vue component `video-scene`).
3. **Forbidden Orphan Scene**:
   - `fad6349b-3aaa-43e2-82c7-ba12abfc1463` is an orphan scene and MUST NEVER be written to (**0 writes**).
4. **Hardware Invariants**:
   - Tables `licenses`, `screens`, and `settings` in `gs.db` are **100% immutable** and MUST NEVER be modified.

### 2.2 Display Modes & CMS Templates
1. **`STATIC`**: Single image asset (represented as playlist containing exactly 1 image).
2. **`SLIDESHOW`**: Multi-image rotating gallery containing 2 to 20 ordered image items with configurable duration per slide (1–60s, default: 7s). Interactive reordering and simulated preview player.
3. **`VIDEO`**: Standalone looping MP4 video asset.
4. **Dynamic Scalability (Zero Hardcoded Packages)**: The CMS supports 1 to 500+ custom marketing templates stored dynamically in PostgreSQL.
5. **1-Click Duplication**: Endpoint `POST /api/v1/templates/{id}/duplicate` clones template records with name `"<Name> — копия"` and duplicates all playlist items.
6. **Optimistic Concurrency Control (OCC)**: `media_assets` and `advertising_blocks` maintain integer `version` field. Stale client mutations are rejected with `HTTP 409 Conflict`.

### 2.3 Supported Content Matrix

| Area | Supported Display Modes | Resolved Scene GUID | V1 Operational Rules |
| :--- | :--- | :--- | :--- |
| **`FULL_SCREEN`** | `STATIC`, `SLIDESHOW`, `VIDEO` | `2509359c-2d71-4344-9be4-7d90dd453083` | Standby screen when no check is open. Dynamic Vue switching via `type: "image"` vs `type: "gallery"`. |
| **`MODE32_PROMO`** | `STATIC`, `SLIDESHOW`, `VIDEO` | `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3` | Right-hand 512×768 upsell block. Left-side receipt check scene (`255dc54c...`) is untouched. |

> **Mixed Slideshow Constraint (Image + Video)**: In V1, slideshows consist strictly of images. Mixing video and image slides in a single gallery is categorized as **VALIDATION REQUIRED / TBD** pending laboratory testing on test node `10.0.0.241`.

---

## 3. Technology Stack & Rationale

| Component | Selected Technology | Rationale | Alternatives Evaluated & Rejected |
| :--- | :--- | :--- | :--- |
| **Host System** | Dedicated `10.0.0.111` | Mandatory per Constitution. Central Linux server with Docker. | Developer local workstation (Rejected: No local footprint allowed). |
| **Container Engine**| Docker Compose v2 | Simple, reproducible, on-premise, zero cloud dependencies. | Kubernetes / Swarm (Rejected: Unnecessary operational complexity for single server). |
| **Backend API** | FastAPI (Python 3.12) | High async throughput, native Pydantic v2 validation, clean typing. | Go Fiber / NestJS (FastAPI matches Python `asyncssh` ecosystem best). |
| **SSH Client** | `asyncssh` | AsyncIO event-loop native. Capable of handling 100+ concurrent SSH connections without subprocess/thread exhaustion. | `paramiko` (Thread-bound, blocking), `ssh.exe` subprocess (High process fork overhead). |
| **Queue & Workers** | Redis 7 + ARQ | Ultra-low latency, atomic locks (`SET NX`), native backpressure, exponential backoff with jitter. | Celery (Overly heavy), Postgres SKIP LOCKED (High write churn on DB). |
| **Database** | PostgreSQL 16 | Mandatory per Constitution. Superior JSONB support for Guest Screen scene payloads. | MariaDB / MySQL. |
| **Object Storage** | MinIO (Docker) | S3 API standard, automatic SHA-256 verification, persistent volume. | Local directory mapping (Lacks S3 metadata, pre-signed URLs, and clean separation). |
| **Frontend UI** | React 18 + Vite | Rich ecosystem for tabular data, live status indicators, modal previews, and drag-and-drop gallery builders. | HTMX (Cumbersome for complex multi-image gallery canvas builders). |
| **Reverse Proxy** | Nginx Alpine | Lightweight, robust SSL termination, fast static asset delivery. | Traefik / Caddy. |
| **Secrets Encryption** | `cryptography` (AES-256-GCM / Fernet) | Authenticated encryption for `cashiers.ssh_password_encrypted`; master key `GS_MASTER_KEY` strictly via Docker env; zero plaintext secrets in API. | Plaintext DB columns (Violates Principle VIII). |

---

## 4. Publication Lifecycle & Cashier Decoupling

### 4.1 Immutable Batch Snapshot Architecture
1. **Snapshot Capture**: In the instant an operator dispatches a publication, the `PublicationOrchestrator` compiles all template attributes, playlist items, media asset dimensions, slide durations, and SHA-256 checksums into an immutable JSON document: `PublicationBatch.content_snapshot_json`.
2. **Worker Isolation**: All asynchronous ARQ workers read strictly and exclusively from this snapshot. Any subsequent edit, rename, or deletion of the template or its media in the CMS does not alter in-flight or historical publications.
3. **Decoupled Cashier Autonomy**:
   - Editing or deleting a template in the CMS **NEVER** sends tasks or mutations to cashiers.
   - Cashiers operate completely decoupled, continuously displaying the last successfully published content from their local `gs.db` until an explicit new publication is dispatched.
   - Deleting a template assigned to a Region, Branch, or Cashier nullifies the foreign key in PostgreSQL, but leaves the physical cashier screen playing untouched. Auto-purge and screen-blanking are strictly forbidden.

### 4.2 Lifecycle State Machine
Each cashier job within a publication batch transitions through strictly defined states:
- `PENDING`: Queued in Redis, awaiting worker assignment.
- `RUNNING`: Worker holds active SSH session; pre-flight, backup, transfer, and SQL update executing.
- `SUCCESS`: Update applied, verified, and hot-update confirmed.
- `PUBLISHED_AWAITING_RESTART`: Content written to `scenes` and verified, but front-end hot-update is unconfirmed; waiting for off-hours Maintenance Window restart.
- `OFFLINE`: Cashier unreachable within connection timeout (10s); queued for exponential retry with full jitter.
- `FAILED`: Pre-flight check, disk space, or SQL failed; two-tier rollback executed; error logged.

### 4.3 Batch Status & "Retry Failed Only"
- If publication succeeds on a subset of cashiers and fails on others (e.g. 198/200 success, 2 offline), the batch status transitions to `PARTIAL`. Cashiers that achieved `SUCCESS` are **never rolled back**.
- The system provides a **"Retry Failed Only"** action (`POST /api/v1/publications/{id}/retry-failed`) that dispatches jobs strictly for cashiers in `FAILED` or `OFFLINE` status within the batch, reusing the exact original immutable snapshot. Already successful cashiers are not touched.

### 4.4 Idempotency Strategy
$$\text{IdempotencyKey} = \text{SHA256}(\text{cashier\_id} + \text{batch\_id} + \text{content\_snapshot\_hash})$$
- If an idempotent job is re-dispatched to a cashier already in `SUCCESS`, the worker verifies the current content hash via a single fast read-only query and completes in $< 500$ ms without transferring files or executing redundant SQL writes.

---

## 5. SSH Orchestration & Fleet Protection

1. **Pre-provisioned Enterprise Keypair**:
   - Public key is pre-deployed on all POS monoblocks by Oqtepa infrastructure.
   - Central server uses private key injected via environment secret `SSH_MASTER_PRIVATE_KEY_B64`.
   - GS Control Center **does not** accept Windows admin passwords to configure SSH.
2. **Worker Pool & Backpressure**:
   - Initial default: **15 concurrent workers** (configurable range: **5–30** via Web UI Settings).
   - Maximum **2 concurrent SSH connections per branch** to protect retail store routers.
   - Connection timeout: 10s; Command timeout: 45s; SFTP timeout: 60s.
   - Retries use exponential backoff with full jitter to avoid thundering herd floods.

---

## 6. Surgical SQLite Safety & Two-Tier Rollback

### 6.1 Inviolable Database Invariants
- **NEVER** modify, drop, or alter `licenses`, `screens`, or `settings`.
- **NEVER** copy the full `gs.db` file from the server to any cashier.
- **NEVER** terminate `GuestScreen.exe` or kill CefSharp processes during operating shifts.

### 6.2 Strict 8-Step Safety Workflow
1. **Connectivity Check**: TCP connect and SSH handshake.
2. **Path & Process Check**: Verify `C:\UCS\GuestScreen\gs.db` and directory `Front\media\uploads` exist.
3. **Disk Space Check**: Verify $\ge 200$ MB free on drive `C:`.
4. **Local Backup**: Copy `gs.db` to `gs.db.bak_YYYYMMDD_HHMMSS`.
5. **Prior State Capture**: Read existing JSON string from `scenes.Raw` into memory before updating.
6. **Media Delivery**: Upload unique `<sha256>.<ext>` to `Front\media\uploads\` via SFTP with checksum check.
7. **Targeted SQL Update**: Execute `UPDATE scenes SET Raw = ? WHERE Guid = ?` with `busy_timeout = 10000`.
8. **Verification & Two-Tier Rollback**:
   - Read back record from `scenes.Raw`.
   - If mismatch or error $\rightarrow$ **Tier 1 (Surgical Rollback)**: Execute `UPDATE scenes SET Raw = @PRIOR_RAW@ WHERE Guid = ?`. This restores the scene **without wiping out any r_keeper order checks or session data** that occurred concurrently.
   - **Tier 2 (Disaster Recovery)**: Restore full `.bak` only in case of SQLite file corruption (subject to validation).

### 6.3 Concurrency & Hot-Update Hypotheses (Experimental)
- **SQLite WAL Mode (`PRAGMA journal_mode = WAL;`)**: Labeled as a **laboratory hypothesis**. Must be tested under active r_keeper order flow on `10.0.0.241` before production activation.
- **Hot-Update Trigger (`Front\sync_version.txt`)**: Labeled as a **laboratory hypothesis**. If invalid on `10.0.0.241`, the system transitions the terminal to `PUBLISHED_AWAITING_RESTART`.

---

## 7. Central Maintenance Window Architecture

- **Timezone**: `Asia/Tashkent`.
- **Location**: Centralized async scheduler running inside `worker_pool` container on `10.0.0.111` (zero client schedulers).
- **Execution**: For terminals in `PUBLISHED_AWAITING_RESTART`:
  - When the branch window (e.g. `02:00`–`05:00`) arrives, the central worker connects via SSH.
  - Verifies cashier is closed (no active r_keeper check session).
  - Restarts `GuestScreen.exe` cleanly (no `taskkill`).
  - Verifies startup and transitions terminal status to `SUCCESS`.

---

## 8. Web UI User Flows (High-Level Administration)

Administrators and marketing operators interact exclusively with business concepts:
1. **Media Library Flow**: Upload image/video (single or drag-and-drop batch) $\rightarrow$ Automatic SHA-256 calculation & deduplication $\rightarrow$ Metadata extraction (dimensions, MIME, file size) $\rightarrow$ In-place rename & replace $\rightarrow$ Usage inspection (`GET /api/v1/media/{id}/usage`) $\rightarrow$ Dependency-protected safe deletion modal (`HTTP 409 Conflict` if in use; physical MinIO deletion strictly if `COUNT == 0`).
2. **Advertising Template Flow**: Create/Edit Template (1..500+ scalable templates) $\rightarrow$ Choose Area (`FULL_SCREEN` / `MODE32_PROMO`) $\rightarrow$ Choose Mode (`STATIC` / `SLIDESHOW` / `VIDEO`) $\rightarrow$ Dynamic playlist reordering & per-slide duration sliders (1–60s) $\rightarrow$ OCC version check on save (`HTTP 409 Conflict` on concurrent edits) $\rightarrow$ 1-Click duplication $\rightarrow$ Interactive preview modal (1024×768 / 512×768 viewports with autoplay & Next/Prev).
3. **Publication Flow**: Select Template $\rightarrow$ Select Target Scope (Region, Branch, Custom Cashier checkboxes) $\rightarrow$ Compile immutable `content_snapshot_json` $\rightarrow$ Dispatch to Redis queue $\rightarrow$ Monitor real-time progress bar & per-cashier status table $\rightarrow$ Partial execution handling (status `PARTIAL`, zero rollbacks of successful nodes) $\rightarrow$ "Retry Failed Only" action using original snapshot.
4. **Audit Flow**: View chronological filterable activity logs in PostgreSQL.

---

## 9. Comprehensive Failure Matrix

| Failure Scenario | Detection Mechanism | Lifecycle State | Automated Action | Operator Action |
| :--- | :--- | :--- | :--- | :--- |
| **Cashier Unreachable** | TCP/SSH connection timeout (10s) | `OFFLINE` | Mark job `OFFLINE`; enqueue retry with exponential backoff & jitter. | Check store power/network if terminal stays offline. |
| **Missing Guest Screen** | Path check fails on `C:\UCS\GuestScreen\` | `FAILED` | Abort immediately; record `GS_NOT_INSTALLED`; no files touched. | Verify monoblock installation. |
| **Low Disk Space (<200MB)** | `Get-PSDrive C` free space check | `FAILED` | Abort immediately; record `INSUFFICIENT_DISK_SPACE`; no upload. | Clean temp files on cashier. |
| **SFTP Transfer Interrupted** | Checksum mismatch or socket disconnect | `FAILED` | Delete partial remote file; abort transaction; no SQL run. | Retry job via UI. |
| **SQLite Locked (`SQLITE_BUSY`)** | SQLite CLI exit code / error string | `FAILED` | Execute surgical in-memory scene rollback; log lock timeout. | Automatic retry during cashier idle window. |
| **Verification Mismatch** | Query back `scenes.Raw` does not match | `FAILED` | Execute surgical in-memory scene rollback; verify prior state. | Inspect diagnostic error log. |
| **CefSharp Hot-Update Ineffective** | Validation indicates visual freeze | `PUBLISHED_AWAITING_RESTART` | Leave updated DB intact; queue controlled restart for maintenance window. | Await off-hours window or click manual restart. |
| **Worker Container Crashes** | Redis lock expires / heartbeat ceases | `PENDING` | Surviving worker re-claims orphaned job via Redis lock timeout. | None (Self-healing). |
| **Database Server Outage** | Healthcheck fails on `postgres_db` | System Paused | Workers pause queue consumption until PostgreSQL health recovers. | Check Docker logs on `10.0.0.111`. |
| **Concurrent Edit Conflict** | OCC version mismatch in PostgreSQL | Request Aborted | Transaction aborted; returns `HTTP 409 Conflict` with error message. | Refresh page to reload newest state. |
| **Partial Batch Failure** | Subset of cashiers failed / offline | `PARTIAL` | Batch marked `PARTIAL`; successful nodes remain active (zero rollback). | Trigger "Retry Failed Only" via UI. |

---

## 10. Empirical Laboratory Validation Protocol (Test Node `10.0.0.241`)

Before mass rollout, the following 29 test points must be executed and confirmed on `10.0.0.241`:

1. SSH connectivity and corporate public key / encrypted password authentication.
2. Accurate path detection for `C:\UCS\GuestScreen\`.
3. Valid `gs.db` presence and SQLite schema check.
4. Timestamped local backup creation.
5. SQLite lock contention test during simulated check entry.
6. Evaluation of `PRAGMA journal_mode = WAL;`.
7. Evaluation of `PRAGMA busy_timeout = 10000;`.
8. Execution of `FULL_SCREEN` `STATIC` update (`2509359c-2d71-4344-9be4-7d90dd453083`, `type: "image"`).
9. Execution of `FULL_SCREEN` `SLIDESHOW` update (`2509359c-2d71-4344-9be4-7d90dd453083`, `type: "gallery"`, $\ge 2$ images, reorder, interval change).
10. Execution of `MODE32_PROMO` `STATIC` update (512×768, `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3`, `type: "image"`).
11. Execution of `MODE32_PROMO` `SLIDESHOW` update (512×768, `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3`, `type: "gallery"`, $\ge 2$ images, reorder, interval change).
12. **Verification that orphan scene `fad6349b-3aaa-43e2-82c7-ba12abfc1463` has strictly 0 writes**.
13. Video banner playback test (MP4, autoplay, loop).
14. **Mixed Image/Video Slideshow Test (Evaluation of actual scene JSON support)**.
15. **Zero modification verification of `licenses` table** (Checksum matches 100%).
16. **Zero modification verification of `screens` table** (Checksum matches 100%).
17. **Zero modification verification of `settings` table** (Checksum matches 100%).
18. Surgical in-memory scene rollback verification.
19. Disaster `.bak` restore verification.
20. Text trigger evaluation on `Front\sync_version.txt`.
21. Front-end visual hot-refresh verification without window blink.
22. Chromium browser cache verification with unique SHA-256 filenames.
23. Offline node detection and graceful timeout.
24. Retry execution on failed node.
25. Full idempotency verification (re-running same batch takes $< 500$ ms).
26. Central maintenance window scheduling and execution.
27. **Optimistic Concurrency Control (OCC) verification** (`HTTP 409 Conflict` on concurrent edit).
28. **Media safe deletion dependency protection & S3 refcount verification** (Blocked when in use; deleted from MinIO strictly when `COUNT == 0`).
29. **Decoupled cashier autonomy & immutable snapshot verification** (Editing/deleting template in CMS sends 0 tasks to cashier; "Retry Failed Only" uses original snapshot).

---

## 11. Open / TBD Engineering Decisions

1. **[TBD-1: Mixed Media in Slideshows]**:
   - Laboratory test on `10.0.0.241` will determine if CefSharp's gallery scene accepts a mixed array of `{ "type": "image" }` and `{ "type": "video" }`. If not supported, UI enforces homogeneous slideshows.
2. **[TBD-2: Optimal Concurrency Worker Ceiling]**:
   - Base default: 15 workers. Load testing will calibrate whether 20 or 25 workers can be safely sustained across corporate WAN tunnels.
3. **[TBD-3: Media & Backup Garbage Collection Policy (Proposed Defaults)]**:
   - Proposed default: 30 days retention for unreferenced media in MinIO; 7 days retention for `.bak` files on cashiers. These remain operational tuning parameters subject to infrastructure review.

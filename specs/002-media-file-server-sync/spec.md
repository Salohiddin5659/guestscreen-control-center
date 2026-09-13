# Feature Specification: Bidirectional File Server <-> Central Control Media Synchronization

**Feature Identifier**: `002-media-file-server-sync`  
**Feature Branch**: `002-media-file-server-sync`  
**Iteration**: 2.1 (External File Server Ingestion & Bidirectional Media Synchronization)  
**Created**: 2026-09-04  
**Last Clarified**: 2026-09-04 (Session 1: Full Architectural & Safety Clarification)  
**Status**: Clarified (Ready for Plan)  
**Target Host**: Dedicated On-Premise Host `10.0.0.111` (100% Docker / Docker Compose)  
**Central Database**: PostgreSQL 16 (Authoritative Entity & Metadata Store)  
**Object Storage**: MinIO S3 (Centralized Caching & Fast Distribution Tier)  
**External Storage**: Corporate File Server (SMB / CIFS Primary V1, LocalMount Fallback)  
**Fleet Target**: 200+ Windows POS Monoblocks running UCS Guest Screen (Dedicated Test Cashier: `10.0.0.241`)  

---

## 1. Executive Summary & Problem Context

In Iteration 2.0 (`001-gs-control-center`), Central Control established a high-performance, containerized CMS with MinIO S3 object storage for media assets, optimistic concurrency control (OCC), dynamic advertising templates, and agentless push delivery to UCS Guest Screen terminals.

**The Infrastructure Reality & Operational Gap:**  
In enterprise retail environments, marketing and content production teams do not work exclusively through the Central Control Web UI. A dedicated corporate **File Server** (SMB/CIFS network share) exists where graphic designers, marketing managers, and regional departments upload, organize, update, and archive high-resolution marketing media.

Currently:
1. Files dropped directly onto the external File Server are invisible to Central Control.
2. Changes and deletions made on the File Server do not propagate into Central Control.
3. Media assets uploaded or modified within Central Control do not replicate back to the File Server, creating split-brain data drift between the marketing asset archive and the active POS display network.

**The Solution:**  
Implement robust, resilient **Bidirectional Media Synchronization** (`FILE SERVER <-> CENTRAL CONTROL MEDIA LIBRARY`) governed by content-addressed SHA-256 fingerprinting, transactional reconciliation, safe deletion policies, loop prevention, and non-destructive conflict resolution, while strictly preserving all POS hardware safety invariants.

---

## 2. Clarifications & Architectural Decisions

### Session 2026-09-04

- **Q01: Source of Truth Hierarchy**  
  - **Decision**: Four distinct tiers are formalized:
    1. `PostgreSQL 16` $\rightarrow$ Sole authoritative source for metadata, business state, templates, playlists, durations, OCC versions, sync statuses, and conflict records.
    2. `Corporate File Server` $\rightarrow$ Authoritative repository for original physical files originated by marketing/design teams.
    3. `MinIO S3` (Host `10.0.0.111`) $\rightarrow$ Synchronized, content-addressed fast cache (`media/<sha256>.<ext>`) for central serving, thumbnail delivery, and worker distribution.
    4. `POS Cashiers` $\rightarrow$ Autonomous local published copy (`C:\UCS\GuestScreen\Front\media\uploads\`).
  - *Applied to*: Section 3 (Architectural Blueprint), Section 6 (Requirements).

- **Q02: Central Control Deletion & Historical Snapshot Safety**  
  - **Decision**: When an asset is deleted via Central Control:
    1. Active templates dependency check: If referenced by any active template, deletion is rejected with `HTTP 409 Conflict`.
    2. File Server: File is archived to `.archive/<timestamp>_<filename>` (Policy `ARCHIVE`) or deleted (Policy `HARD_DELETE`).
    3. MinIO binary: Physically deleted strictly when `COUNT == 0` across all `media_assets` **AND** all historical `publication_batches.content_snapshot_json`.
    4. Historical publication snapshots: Retained 100% immutable; historical audit trail is never compromised.
  - *Applied to*: Section 4 (User Stories 2 & 4), Section 6 (FR-015–FR-019).

- **Q03: File Server Deletion & Publication Blocking**  
  - **Decision**: When a file is deleted directly on the File Server:
    1. Asset transitions to status `MISSING_ON_SOURCE`.
    2. MinIO binary and published cashier files are strictly preserved (zero cashier black screens).
    3. **New Publications**: Asset in `MISSING_ON_SOURCE` is strictly **blocked from new publications** (`HTTP 422 Unprocessable Entity`). It cannot be published until restored on File Server or replaced in CMS.
  - *Applied to*: Section 4 (User Story 4), Section 6 (FR-018, FR-033).

- **Q04: File Server In-Place File Replacement**  
  - **Decision**: When a file on File Server is modified at the same path:
    1. It is treated as an in-place update of the **same `MediaAsset`**, incrementing OCC `version += 1`.
    2. New SHA-256 computed, binary ingested into MinIO (`media/<new_sha256>.<ext>`), thumbnail regenerated.
    3. Templates using this asset automatically reference the updated asset in CMS.
    4. **Cashier fleet behavior**: Cashiers are **NOT automatically updated** (no auto-push). Cashiers continue running previous content until an operator triggers an explicit new publication.
  - *Applied to*: Section 4 (User Story 3), Section 6 (FR-010, FR-034).

- **Q05: File Rename on File Server with Identical SHA-256**  
  - **Decision**: If filename/path changes on File Server but SHA-256 is identical:
    1. It is recognized as the **same `MediaAsset`**.
    2. Only `original_filename` and `file_server_path` metadata are updated in PostgreSQL.
    3. MinIO binary is **NOT duplicated**. Active templates and cashiers remain 100% unaffected.
  - *Applied to*: Section 4 (User Story 1), Section 6 (FR-035).

- **Q06: Identity Model: Same Name with Different SHA-256**  
  - **Decision**:
    1. **Content Identity** = `SHA-256` cryptographic hash.
    2. **Name & Path** = Mutable metadata.
    3. Different folders with same filename $\rightarrow$ distinct `MediaAsset` entities distinguished by full relative path.
    4. Overwriting file at same path $\rightarrow$ version bump (Q04).
  - *Applied to*: Section 3, Section 6 (FR-025).

- **Q07: Strict Definition of Conflict**  
  - **Decision**: A conflict occurs **ONLY IF** Central Control has pending un-synchronized local changes (e.g. user replaced binary in CMS while File Server was offline or pending sync) **AND** the file on File Server was simultaneously modified externally. Normal unilateral edits on either side are processed as standard updates, not conflicts.
  - *Applied to*: Section 4 (User Story 5), Section 6 (FR-021).

- **Q08: Conflict Resolution Workflow**  
  - **Decision**: During `CONFLICT`:
    1. Both versions preserved: Central Control version stays active; File Server version saved as isolated conflict copy (`media/conflicts/<sha256>.<ext>`).
    2. Asset transitions to `CONFLICT`, blocking new publications.
    3. Operator choices:
       - «Оставить Central Control»: Central Control binary overwrites File Server; status becomes `SYNCED`.
       - «Принять File Server»: Conflict binary becomes active version of `MediaAsset`, version increments; status becomes `SYNCED`.
  - *Applied to*: Section 4 (User Story 5), Section 6 (FR-022, FR-023).

- **Q09: Initial Full Reconciliation Deterministic Policy**  
  - **Decision**:
    - Case 1 (FS exists, DB exists, SHA matches, path matches) $\rightarrow$ Linked, status `SYNCED`.
    - Case 2 (FS exists, DB exists, SHA matches, path differs) $\rightarrow$ Metadata path updated to match FS, status `SYNCED`, zero S3 duplicate.
    - Case 3 (FS exists, DB absent) $\rightarrow$ Ingested as new `MediaAsset`, binary to MinIO, status `SYNCED`, `source_origin = FILE_SERVER`.
    - Case 4 (DB exists, FS absent):
      - If referenced by templates $\rightarrow$ Status `MISSING_ON_SOURCE`, warning logged, MinIO binary preserved.
      - If unreferenced and `source_origin = CENTRAL_CONTROL_UI` $\rightarrow$ Status `PENDING_UPLOAD` (scheduled to push to FS).
      - If unreferenced and `source_origin = FILE_SERVER` $\rightarrow$ Status `MISSING_ON_SOURCE`.
  - *Applied to*: Section 4 (User Story 1), Section 6 (FR-003, FR-036).

- **Q10: Two-Way Sync Loop Prevention**  
  - **Decision**:
    1. `MediaAsset` tracks `last_sync_sha256`, `file_server_mtime`, and `file_server_size`.
    2. When Central Control writes to File Server, it records remote `mtime` and sets `last_sync_sha256 = current_sha256`.
    3. When File Server scanner runs, any file matching `last_sync_sha256` and recorded `mtime`/`size` is recognized as an echo of its own sync and skipped.
  - *Applied to*: Section 6 (FR-037).

- **Q11: Partial Sync & Fault Isolation**  
  - **Decision**:
    - If File Server OK, but MinIO Down: File Server file is untouched. Ingestion job retries with backoff; status `ERROR: MINIO_UNAVAILABLE`. Zero data loss.
    - If MinIO OK, but File Server Down: Upload/replace succeeds in CMS locally; asset marked `PENDING_UPLOAD`; background retry queued. Cashiers and templates continue operating.
  - *Applied to*: Section 5 (Edge Cases), Section 6 (FR-012, FR-038).

- **Q12: Transactional Atomicity (No Ghost Sync)**  
  - **Decision**: An asset can NEVER reach `sync_status = SYNCED` unless the file is physically verified on File Server with matching SHA-256 AND physically present in MinIO with matching SHA-256. Any failure leaves asset in `PENDING_*` or `ERROR`.
  - *Applied to*: Section 6 (FR-039).

- **Q13: Sync Intervals & Manual Trigger**  
  - **Decision**:
    - Default interval: 60 seconds.
    - Bounds: Minimum 10 seconds, Maximum 3600 seconds (1 hour).
    - Configurable in UI via `FileServerConfig.sync_interval_seconds`.
    - Manual «Синхронизировать сейчас» (Sync Now) button executes immediate reconciliation.
  - *Applied to*: Section 6 (FR-005, FR-007, FR-040).

- **Q14: Large File Handling (Videos up to 500MB)**  
  - **Decision**:
    1. Streaming SHA-256 hashing in 8MB chunks without loading entire file into RAM.
    2. Write-in-progress check: File size must be identical across 2 probes spaced 2s apart and file must not be locked.
    3. Atomic reverse push: Central Control writes to `<filename>.tmp_<uuid>` on File Server, verifies checksum, then atomically renames to target filename.
  - *Applied to*: Section 5 (Edge Cases), Section 6 (FR-006, FR-041).

- **Q15: File Server Protocol V1**  
  - **Decision**:
    - **Primary V1 Standard**: **SMB / CIFS** (via `smbprotocol`, native Windows network share protocol).
    - **Secondary / Staging**: **Container-Mounted Volume (`LOCAL_MOUNT`)** (host-mounted share).
    - Standardized interface `FileServerAdapter` implemented to support both SMB and Mounted Path.
  - *Applied to*: Section 6 (FR-001, FR-042).

- **Q16: Security & Minimal Permissions**  
  - **Decision**:
    1. Credentials encrypted via `encrypt_secret()` with `GS_MASTER_KEY`; never returned in API (`has_credentials: bool`).
    2. Credentials scrubbed from logs via `LoggingFilter`.
    3. Minimal required share permissions: Read, Write, List, Create Directory, Delete (or Move to `.archive/`).
  - *Applied to*: Section 6 (FR-002, FR-043).

- **Q17: In-Flight Publication Safety**  
  - **Decision**: Publication batches execute strictly against immutable `content_snapshot_json` captured at launch. Mid-flight file sync changes do not affect ongoing publications; new versions apply only to future publications.
  - *Applied to*: Section 4 (User Story 7), Section 6 (FR-031, FR-044).

- **Q18: POS Hardware Safety Invariants (Constitution Guaranteed)**  
  - **Decision**:
    1. Immutability of `licenses`, `screens`, `settings` (zero touch).
    2. Zero full `gs.db` copies (targeted WAL `UPDATE scenes SET Raw` only).
    3. Cashiers play 100% locally from `Front\media\uploads\`.
    4. Zero resident agents, services, tasks, or autostarts on POS.
    5. `GuestScreen.exe` process is never terminated.
  - *Applied to*: Section 6 (FR-032).

---

## 3. Architectural Blueprint & Source of Truth

```
+-----------------------------------------------------------------------------------+
|                            CORPORATE FILE SERVER                                  |
|            (Designers / Marketers direct upload, edit, rename, delete)            |
|              Protocol: SMB/CIFS (Port 445) / LocalMount Share                     |
+-----------------------------------------------------------------------------------+
                                  ^               |
            (Reverse Sync:        |               | (Ingest & Change Detection:
         Central Control -> FS)   |               |    FS -> Central Control)
                                  v               v
+-----------------------------------------------------------------------------------+
|                        CENTRAL CONTROL (HOST: 10.0.0.111)                         |
|                                                                                   |
|  +----------------------------------+     +------------------------------------+  |
|  |     Metadata & Policy Master     |     |       Media Fast-Cache Tier        |  |
|  |       (PostgreSQL 16)            |     |             (MinIO S3)             |  |
|  |  - Authoritative for templates,  |     |  - Content-addressed binaries:     |  |
|  |    playlists, OCC versions,      |     |    media/<sha256>.<ext>            |  |
|  |    sync statuses & conflict logs |     |  - Fast local streaming to workers |  |
|  +----------------------------------+     +------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                    Bidirectional Synchronization Engine                     |  |
|  |  - Initial Full Reconciliation (Hash scan, entity match, orphan detection)  |  |
|  |  - Incremental Delta Sync (Periodic polling 10..3600s, mtime/size/SHA-256)  |  |
|  |  - Loop Prevention (Echo detection via last_sync_sha256 & remote mtime)     |  |
|  |  - Conflict Resolver (Preserve both versions, zero silent overwrite)       |  |
|  |  - Deletion Policy Guard (Dependency check; prevent POS screen-blanking)     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Push Distribution (SSH / SCP / SFTP)
                                         | (Only validated & synced media assets)
                                         v
+-----------------------------------------------------------------------------------+
|                           CASHIER FLEET (200+ POS)                                |
|  - Test Terminal: 10.0.0.241 (GuestScreen.exe, CefSharp Chromium, gs.db)          |
|  - Local Media: C:\UCS\GuestScreen\Front\media\uploads\                           |
|  - Zero connection to File Server; 100% autonomous local playback                 |
+-----------------------------------------------------------------------------------+
```

---

## 4. User Scenarios & Testing *(mandatory)*

### User Story 1 — External File Server Ingestion & Initial Full Reconciliation (Priority: P1)
**Why this priority**: Ingests enterprise marketing assets into Central Control without duplicate storage.  
**Independent Test**: Populate File Server with 50 images and 5 MP4 videos. Trigger Initial Reconciliation. Verify all 55 assets indexed, SHA-256 hashed, binaries cached in MinIO, thumbnails generated, zero duplicates for identical hashes, status `SYNCED`.

**Acceptance Scenarios**:
1. **Given** 50 images and 5 MP4s on File Server, **When** Initial Reconciliation executes, **Then** 55 `MediaAsset` records created with status `SYNCED`, unique binaries stored in MinIO.
2. **Given** two different filenames with identical SHA-256, **When** reconciled, **Then** both `MediaAsset` records link to the same MinIO object without duplicate binary storage.
3. **Given** non-media files on File Server, **When** scanned, **Then** skipped without error and recorded in sync audit log.

---

### User Story 2 — Reverse Sync: Central Control Uploads & Replaces to File Server (Priority: P1)
**Why this priority**: Ensures any media asset created or replaced in Central Control is mirrored on File Server.  
**Independent Test**: Upload `autumn_promo.png` via Central Control UI. Verify it appears on File Server with identical SHA-256. Replace it via `POST /media/{id}/replace`; verify File Server file updates atomically.

**Acceptance Scenarios**:
1. **Given** asset uploaded via Central Control, **When** upload completes, **Then** binary pushed to File Server via temporary file and atomic rename; verified SHA-256; marked `SYNCED`.
2. **Given** asset replaced in Central Control, **When** replace executes, **Then** MinIO updated, OCC version incremented, File Server file updated, status `SYNCED`.
3. **Given** File Server offline during CMS upload, **When** upload finishes, **Then** asset stored locally, marked `PENDING_UPLOAD`, and auto-pushed upon reconnect.

---

### User Story 3 — Incremental Synchronization & External Change Detection (Priority: P1)
**Why this priority**: Discovers designer changes in the background without manual user intervention.  
**Independent Test**: Copy `weekend_deal.jpg` to File Server. Wait $\le 60$ seconds. Verify it appears in Media Library as `SYNCED`.

**Acceptance Scenarios**:
1. **Given** background worker running (60s interval), **When** new file added to File Server, **Then** detected, hashed, ingested into MinIO, thumbnail rendered, status `SYNCED`.
2. **Given** file overwritten on File Server, **When** sync pass detects changed mtime/size, **Then** re-hashes, stores new binary in MinIO, bumps asset OCC `version += 1`, updates thumbnail, status `SYNCED`.
3. **Given** file currently being copied to File Server (write in progress), **When** inspected, **Then** size stability check detects unstable size or lock and defers ingestion until complete.

---

### User Story 4 — Deletion Policies & POS Screen-Blanking Prevention (Priority: P2)
**Why this priority**: Prevents customer-facing POS displays from going black due to upstream file deletions.  
**Independent Test**: Link `promo.jpg` to published template on `10.0.0.241`. Delete `promo.jpg` on File Server. Run sync. Verify asset marked `MISSING_ON_SOURCE`, MinIO binary preserved, cashier `10.0.0.241` continues playing uninterrupted.

**Acceptance Scenarios**:
1. **Given** asset in active template, **When** user tries to delete in Central Control, **Then** blocked with `HTTP 409 Conflict`; File Server untouched.
2. **Given** asset deleted on File Server while published, **When** sync runs, **Then** status becomes `MISSING_ON_SOURCE`, warning logged, MinIO and POS files preserved.
3. **Given** asset with status `MISSING_ON_SOURCE`, **When** operator attempts to include it in a new publication, **Then** blocked with `HTTP 422 Unprocessable Entity`.

---

### User Story 5 — Conflict Detection & Interactive Resolution (Priority: P2)
**Why this priority**: Guarantees zero silent data loss when simultaneous edits occur on both sides.  
**Independent Test**: Modify `slide.jpg` on File Server while replacing `slide.jpg` in Central Control. Run sync. Verify status `CONFLICT`, both versions preserved, prompt displayed in UI.

**Acceptance Scenarios**:
1. **Given** concurrent modification on both sides, **When** sync runs, **Then** status `CONFLICT`, File Server version saved to `media/conflicts/`, Central Control version stays active.
2. **Given** asset in `CONFLICT`, **When** user chooses "Оставить Central Control", **Then** Central Control binary pushed to File Server; status `SYNCED`.
3. **Given** asset in `CONFLICT`, **When** user chooses "Принять File Server", **Then** conflict copy becomes active in Central Control, OCC version bumps; status `SYNCED`.

---

### User Story 6 — Monitoring, Badges, Loop Prevention & Audit (Priority: P2)
**Why this priority**: Full visibility and enterprise auditability for all media synchronization operations.  
**Independent Test**: View Media Library; verify badges (`SYNCED`, `PENDING`, `CONFLICT`, `ERROR`, `MISSING_ON_SOURCE`). Verify sync audit log entries. Verify Central Control push does not echo back as new change.

**Acceptance Scenarios**:
1. **Given** assets in various states, **When** viewing Media Library, **Then** color-coded badges displayed.
2. **Given** Central Control pushes file to File Server, **When** next sync scan runs, **Then** echo detection identifies matching `last_sync_sha256` and skips without reverse loop.
3. **Given** operator clicks "Синхронизировать сейчас", **When** clicked, **Then** on-demand reconciliation job queued immediately.

---

### User Story 7 — Cashier Publication Isolation & Zero POS Touch (Priority: P1)
**Why this priority**: Constitution Principles I, IV, and V: Cashier stability is supreme.  
**Independent Test**: Disconnect File Server. Publish template to `10.0.0.241`. Verify publication succeeds at full speed from MinIO cache via SSH.

**Acceptance Scenarios**:
1. **Given** active publication batch, **When** File Server modified mid-flight, **Then** workers use immutable `content_snapshot_json`; zero impact on in-flight publication.
2. **Given** publication dispatch, **Then** cashiers receive files strictly from MinIO cache; zero requests to File Server.
3. **Given** cashier `10.0.0.241`, **Then** zero writes to `licenses`, `screens`, `settings`, zero process restarts, zero background agents.

---

## 5. Edge Cases & Safety Matrix

| Edge Case Scenario | Potential Risk | Mitigation & System Behavior |
| :--- | :--- | :--- |
| **File Server Offline / Timeout** | Sync crashes; Media Library hangs. | Network timeout caught; status `DISCONNECTED`; Media Library and Cashier Publications continue using local MinIO cache; exponential retry. |
| **Partial / In-Progress File Write** | Corrupt asset ingested. | Size-stability probe (2 consecutive checks, 2s gap) + file lock check; ingestion deferred until write completes. |
| **Duplicate Content, Different Names** | Redundant MinIO / POS storage. | Content-addressed storage by SHA-256; reuses existing MinIO object; creates distinct `MediaAsset` record pointing to same binary. |
| **Identical Name, Different Content** | Silent overwrite. | Content identity check: In-place replace bumps version; concurrent uncoordinated edit triggers `CONFLICT` without overwrite. |
| **Active Banner Deleted on File Server** | Black screens on POS registers. | Constitution Guard: Status set to `MISSING_ON_SOURCE`; MinIO binary and cashier files are NOT deleted; new publications blocked (`HTTP 422`). |
| **Two-Way Echo / Infinite Loop** | Endless sync loop between FS and CMS. | Echo detection: `last_sync_sha256` and remote `mtime`/`size` match $\rightarrow$ scanner ignores event. |
| **Large Media Files ($\le 500$MB Video)** | RAM exhaustion, timeout failure. | Streaming 8MB chunked hashing; atomic write to `.tmp_<uuid>` before final rename; dynamically scaled timeouts. |
| **MinIO Offline, File Server Online** | Data loss on File Server. | File Server file is NEVER touched; ingestion job retries; status `ERROR: MINIO_UNAVAILABLE`. |
| **Clock Skew between Hosts** | False mtime comparisons. | SHA-256 hash comparison is the ultimate arbiter whenever mtime is ambiguous. |
| **Unsupported File Formats** | POS CefSharp browser crash. | Domain validator (Pillow/ffprobe) validates format and codecs before accepting asset as `READY`. |

---

## 6. Functional Requirements *(mandatory)*

### 6.1. File Server Integration & Ingestion (FR-001 – FR-008, FR-033 – FR-036)
- **FR-001**: The system MUST support connecting to an external corporate File Server via SMB/CIFS (port 445) as the primary V1 protocol, with optional container-mounted volume (`LOCAL_MOUNT`) support via a unified `FileServerAdapter` interface.
- **FR-002**: File Server credentials (username, password, domain, share) MUST be stored encrypted in PostgreSQL using `encrypt_secret()` with `GS_MASTER_KEY` and NEVER exposed in API responses or logs.
- **FR-003**: The system MUST implement an Initial Full Reconciliation routine executing the 4-way deterministic policy (link matches, update path changes, ingest new files, flag missing files).
- **FR-004**: The system MUST ingest new valid media files (JPEG, PNG, WebP, MP4) from the File Server, compute streaming SHA-256, store unique binaries in MinIO (`media/<sha256>.<ext>`), generate WebP thumbnails, and register `MediaAsset` records.
- **FR-005**: The system MUST implement an Incremental Synchronization background worker running at a configurable interval between 10 and 3600 seconds (default: 60 seconds).
- **FR-006**: The system MUST verify file write completeness prior to ingestion by checking size stability across 2 consecutive probes spaced 2 seconds apart and testing file lock readability.
- **FR-007**: The system MUST support manual on-demand synchronization triggered via the Web UI (`POST /api/v1/media-sync/reconcile`).
- **FR-008**: The system MUST skip non-media files and system files (`Thumbs.db`, `.DS_Store`, `.tmp*`) during File Server scans.
- **FR-033**: Media assets with status `MISSING_ON_SOURCE`, `CONFLICT`, or `ERROR` MUST be strictly blocked from inclusion in new publication batches with `HTTP 422 Unprocessable Entity`.
- **FR-034**: External file modification at the same path on the File Server MUST be treated as an in-place version update of the existing `MediaAsset`, incrementing OCC `version += 1`, without auto-pushing to cashiers until an explicit new publication.
- **FR-035**: Renaming a file on the File Server without changing its SHA-256 MUST update only the `original_filename` and `file_server_path` metadata in PostgreSQL without duplicating the MinIO binary or affecting active templates.
- **FR-036**: During Initial Reconciliation, files present in PostgreSQL but missing on the File Server MUST be marked `MISSING_ON_SOURCE` (if referenced) or `PENDING_UPLOAD` (if unreferenced and originated from Central Control UI).

### 6.2. Reverse Synchronization & Atomicity (FR-009 – FR-014, FR-037 – FR-041)
- **FR-009**: Media assets uploaded via Central Control UI MUST be asynchronously pushed to the File Server via atomic write (`.tmp_<uuid>` then rename) and verified by remote SHA-256.
- **FR-010**: In-place replacement in Central Control (`POST /api/v1/media/{id}/replace`) MUST update the corresponding physical file on the File Server.
- **FR-011**: Media rename in Central Control MUST update the logical display name and optionally rename the remote file if configured.
- **FR-012**: If the File Server is unreachable during reverse sync, the asset status MUST transition to `PENDING_UPLOAD`, and a background retry job with exponential backoff MUST be scheduled.
- **FR-013**: The system MUST verify remote SHA-256 after writing to the File Server to guarantee data integrity.
- **FR-014**: All reverse sync operations MUST be recorded in `audit_logs`.
- **FR-037**: The system MUST prevent two-way sync loops by storing `last_sync_sha256` and remote `mtime`/`size` upon reverse sync, causing the scanner to ignore its own echoes.
- **FR-038**: If MinIO is temporarily unavailable while File Server is accessible, File Server files MUST NOT be modified; ingestion MUST retry with status `ERROR: MINIO_UNAVAILABLE`.
- **FR-039**: An asset MUST NEVER be marked `sync_status = SYNCED` unless physically verified in MinIO with matching SHA-256 AND physically present on File Server with matching SHA-256.
- **FR-040**: The sync interval MUST be configurable via API/UI within the range of 10 to 3600 seconds.
- **FR-041**: For large files ($\le 500$MB), SHA-256 hashing MUST use 8MB chunked streaming, and reverse push MUST use dynamic timeout scaling.

### 6.3. Deletion, Conflict Resolution & POS Safety (FR-015 – FR-032, FR-042 – FR-044)
- **FR-015**: Deletion of a media asset in Central Control MUST be blocked with `HTTP 409 Conflict` if referenced by any active Advertising Template.
- **FR-016**: Safe deletion from Central Control MUST archive the remote file on the File Server to `.archive/<timestamp>_<filename>` (default `ARCHIVE` policy) or unlink it (`HARD_DELETE` policy).
- **FR-017**: Physical MinIO object deletion MUST occur strictly when `COUNT == 0` across all `media_assets` AND historical `publication_batches.content_snapshot_json`.
- **FR-018**: Deletion on the File Server MUST transition asset status to `MISSING_ON_SOURCE`, log an audit warning, and PRESERVE MinIO binaries and cashier displays.
- **FR-020**: The system MUST NEVER perform silent overwrites when a conflict is detected.
- **FR-021**: A conflict MUST be declared ONLY IF Central Control has pending un-synchronized local changes AND the File Server was simultaneously modified externally.
- **FR-022**: Upon conflict, both versions MUST be preserved: Central Control version stays active; File Server version is saved to `media/conflicts/<sha256>.<ext>`, and asset is marked `CONFLICT`.
- **FR-023**: An interactive conflict resolution endpoint (`POST /api/v1/media-sync/conflicts/{id}/resolve`) MUST allow operators to select "Оставить Central Control" or "Принять File Server".
- **FR-024**: Media asset mutations MUST enforce Optimistic Concurrency Control (OCC) via the `version` column.
- **FR-026**: Every media asset MUST maintain sync status: `SYNCED`, `PENDING_UPLOAD`, `PENDING_DOWNLOAD`, `CONFLICT`, `ERROR`, `MISSING_ON_SOURCE`.
- **FR-027**: The Media Library UI MUST display color-coded status badges with informative tooltips.
- **FR-028**: The administration dashboard MUST show File Server connection health, latency, and last reconciliation timestamp.
- **FR-029**: All sync operations, conflicts, resolutions, and errors MUST be immutably recorded in `audit_logs`.
- **FR-030**: Synchronization errors MUST NOT disrupt cashier publications or CMS template operations.
- **FR-031**: Cashier publications MUST fetch binaries strictly from MinIO cache via agentless SSH; zero network requests to File Server.
- **FR-032**: All POS invariants remain 100% enforced: zero writes to `licenses`, `screens`, `settings`, zero full `gs.db` copies, zero background agents/services on cashiers, zero `GuestScreen.exe` kills.
- **FR-042**: The system MUST provide an abstract `FileServerAdapter` supporting `SmbAdapter` and `MountedPathAdapter`.
- **FR-043**: Minimal required permissions for the File Server user account: Read, Write, List, Create Directory, Delete/Move.
- **FR-044**: In-flight publication batches MUST execute strictly against immutable `content_snapshot_json`; sync updates apply only to future publications.

---

## 7. Key Entities & Data Model Extensions

```
+-------------------------------------------------------------+
|                      FileServerConfig                       |
+-------------------------------------------------------------+
| id: UUID [PK]                                               |
| protocol: Enum (SMB, LOCAL_MOUNT)                           |
| host: String                                                |
| port: Integer (Default: 445 for SMB)                        |
| share_name: Optional[String]                                |
| base_path: String                                           |
| username: Optional[String]                                  |
| password_encrypted: Optional[LargeBinary]                   |
| domain: Optional[String]                                    |
| sync_interval_seconds: Integer (Default: 60, Range: 10..3600)|
| deletion_policy: Enum (ARCHIVE, HARD_DELETE)                |
| archive_subfolder: String (Default: ".archive")             |
| enabled: Boolean                                            |
| last_sync_at: Optional[DateTime]                            |
| last_sync_status: Enum (OK, ERROR, IN_PROGRESS)             |
| last_error_message: Optional[String]                        |
| created_at: DateTime                                        |
| updated_at: DateTime                                        |
+-------------------------------------------------------------+
                              | 1
                              |
                              | *
+-------------------------------------------------------------+
|                       MediaAsset (Extended)                 |
+-------------------------------------------------------------+
| id: UUID [PK]                                               |
| original_filename: String                                   |
| file_server_path: Optional[String]                          |
| file_server_mtime: Optional[DateTime]                       |
| file_server_size: Optional[BigInteger]                      |
| last_sync_sha256: Optional[String] (Loop Prevention)        |
| sha256: String                                              |
| s3_key: String                                              |
| sync_status: Enum (SYNCED, PENDING_UPLOAD,                  |
|                    PENDING_DOWNLOAD, CONFLICT,              |
|                    ERROR, MISSING_ON_SOURCE)                |
| sync_error_message: Optional[String]                        |
| source_origin: Enum (FILE_SERVER, CENTRAL_CONTROL_UI)       |
| last_synced_at: Optional[DateTime]                          |
| version: Integer (OCC Version)                              |
| is_deleted: Boolean                                         |
+-------------------------------------------------------------+
                              | 1
                              |
                              | 0..*
+-------------------------------------------------------------+
|                     MediaSyncConflict                       |
+-------------------------------------------------------------+
| id: UUID [PK]                                               |
| media_asset_id: UUID [FK -> MediaAsset]                     |
| local_sha256: String                                        |
| local_mtime: DateTime                                       |
| remote_sha256: String                                       |
| remote_mtime: DateTime                                      |
| remote_path: String                                         |
| conflict_copy_s3_key: Optional[String]                      |
| status: Enum (OPEN, RESOLVED_LOCAL, RESOLVED_REMOTE)        |
| detected_at: DateTime                                       |
| resolved_at: Optional[DateTime]                             |
| resolved_by_user_id: Optional[UUID]                         |
+-------------------------------------------------------------+
```

---

## 8. Success Criteria *(measurable & technology-agnostic)*

- **SC-001**: During Initial Reconciliation, 100% of valid media files on File Server ($\ge 50$ assets) are indexed, hashed, and registered in Central Control without human intervention.
- **SC-002**: 100% of files uploaded/replaced in Central Control appear on File Server with bit-for-bit identical SHA-256 within 15 seconds under normal network conditions.
- **SC-003**: New files placed on File Server are detected and visible in Central Control within $\le 2$ poll intervals ($\le 120$s with default 60s configuration).
- **SC-004**: Zero duplicate binaries are stored in MinIO for identical content across multiple paths or filenames.
- **SC-005**: 100% of active cashier screens continue playing without interruption when files are deleted on File Server; zero deletion tasks sent to POS.
- **SC-006**: 100% of conflicting concurrent modifications are caught before overwrite, preserving both versions with status `CONFLICT` and zero data loss.
- **SC-007**: Complete disconnection of File Server causes 0% failure in cashier publications: all rollout tasks succeed using Central Control cached binaries.
- **SC-008**: 100% of sync actions, errors, and conflict resolutions are recorded in the central audit trail.
- **SC-009**: Operator can resolve a conflict in $\le 2$ clicks from the Media Library interface.
- **SC-010**: All POS invariants remain 100% satisfied: zero writes to `licenses`, `screens`, `settings`, zero `gs.db` full overwrite, zero resident agents on cashiers.
- **SC-011**: Zero infinite sync loops: Reverse sync from Central Control never triggers a reverse ingestion event on the next scan cycle.
- **SC-012**: 100% of assets in `MISSING_ON_SOURCE`, `CONFLICT`, or `ERROR` are rejected from new publications (`HTTP 422`).
- **SC-013**: MinIO physical deletion never deletes binaries referenced by historical `publication_batches` snapshots.
- **SC-014**: Large file ingestion up to 500MB completes without memory exhaustion and verifies bit-for-bit checksums.

---

## 9. Assumptions & Scope Boundaries

### Assumptions:
1. **Network Connectivity**: The Central Control host (`10.0.0.111`) has route access to the File Server via SMB port 445 or a container mount.
2. **File Server Permissions**: The credentials provided have read, write, create-directory, and move permissions on the target share.
3. **Supported Formats**: JPEG, PNG, WebP for static/slideshow; MP4 (H.264/AAC) for standalone video.
4. **Deduplication Baseline**: File equality is determined strictly by SHA-256 cryptographic hash.

### Out of Scope:
- Installing agents or daemons on the corporate File Server.
- Video transcoding on the File Server.
- Direct network access between cashiers and File Server.

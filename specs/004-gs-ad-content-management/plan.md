# Master Implementation Plan: Centralized UCS GuestScreen Advertising Content Management

**Project**: Centralized UCS GuestScreen Advertising Content Management  
**Feature Identifier**: `004-gs-ad-content-management`  
**Date**: 2026-09-10  
**Central Server Host**: Dedicated On-Premise Host `10.0.0.111`  
**Central Technology Stack**: Python 3.13 | FastAPI | Pydantic v2 | SQLAlchemy 2.x | asyncpg | AsyncSSH  
**Authoritative Persistent Store**: PostgreSQL 16 (Single Source of Truth)  
**Target Cashier Fleet**: 200+ Windows POS Monoblocks (Dedicated Acceptance Cashier: `10.0.0.241`, GuestScreen 3.1.1.0)  
**Spec References**: [spec.md](./spec.md) | [data-model.md](./data-model.md) | [research.md](./research.md) | [contracts/api.yaml](./contracts/api.yaml) | [contracts/cashbox-command-adapter.md](./contracts/cashbox-command-adapter.md) | [quickstart.md](./quickstart.md)  
**Status**: Final Master Technical Plan (Approved for Planning; Ready for Tasks)

---

## 1. Executive Summary & Approved Architecture

The Centralized UCS GuestScreen Advertising Content Management System is a specialized, agentless digital signage orchestration platform designed specifically for fast-food chains operating **UCS GuestScreen v3.1.1.0** integrated with **r_keeper v7**.

The system centrally controls **ONLY** advertising media and scene configuration metadata for:
1. **FULL SCREEN** standby displays (`1024×768`, 4:3, Scene GUID `2509359c-2d71-4344-9be4-7d90dd453083`).
2. **50/50** active order promo blocks (`512×768`, 2:3, Scene GUID `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3`).

For both display areas, the system supports:
- **STATIC**: A single, high-impact promotional image.
- **DYNAMIC PLAYLIST**: An ordered sequence of promotional media items with configurable display intervals (e.g., 5, 7, 10 seconds).

### 1.1 Scope Boundaries & System Invariants
- **ZERO Renderer Modification**: The system does **not** construct an alternative HTML/Web player. GuestScreen's embedded CefSharp Chromium engine natively renders both Full Screen and 50/50 modes from SQLite `gs.db` scenes.
- **ZERO POS Interference**: The system does **not** manage orders, checks, line items, prices, discounts, taxes, or modifiers.
- **ZERO r_keeper Interaction**: The left half of the 50/50 order screen (`0..512×768`) and all r_keeper cash register logic remain 100% untouched.
- **ZERO Database Overwrite**: The system **NEVER** replaces, copies, deletes, or recreates `gs.db`. Tables `licenses`, `screens`, `scenarios`, and `settings` are strictly immutable.
- **ZERO Arbitrary Remote Shell**: Operations over SSH are strictly restricted to a typed, backend-enforced command allowlist.

```text
                                 CENTRAL MANAGEMENT HOST (10.0.0.111)
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +-----------------------+         +---------------------------------------------------------------+   |
|   |   Web UI (SPA Admin)  |         |                      FastAPI Backend Engine                   |   |
|   |   - Cashboxes         |         |                                                               |   |
|   |   - Media Library     |  HTTP   |  [ REST API Layer ] ──► [ Auth / RBAC & Audit Middleware ]    |   |
|   |   - Playlists         |───────► |                                 │                             |   |
|   |   - Full Screen       | JSON/API|                                 ▼                             |   |
|   |   - 50 / 50           |         |  [ Domain & Application Services ]                            |   |
|   |   - Deployments       |         |   - MediaStorageService (Local Filesystem Decoupled)          |   |
|   |   - Audit Logs        |         |   - ConfigurationService (Full & 50/50 Versioning)            |   |
|   +-----------------------+         |   - InventoryReconciliationEngine (Desired vs Actual Diff)    |   |
|                                     |   - DeploymentOrchestrator (State Machine & Concurrency Pool) |   |
|                                     |   - VerificationService (PID, StartTime, Scene Readback)      |   |
|                                     |   - RollbackService (Scene Revert & Reload Trigger)           |   |
|                                     |                                 │                             |   |
|                                     |                                 ▼                             |   |
|                                     |  [ Transport & Security Adapters ]                            |   |
|                                     |   - AsyncSSH Client & SFTP File Transfer Engine               |   |
|                                     |   - CashboxCommandAdapter (Strict Typed Allowlist Runner)     |   |
|                                     |   - SecretManager (AES-256-GCM Authenticated Encryption)      |   |
|                                     +---------------------------------┬────────────────-------------+   |
|                                                                       │                                 |
|                                        PostgreSQL 16 (Source of Truth)│                                 |
|                                        +──────────────────────────────┴─────────────────────────────+   |
|                                        | Persistent Tables: cashboxes, locations, cashbox_groups,   |   |
|                                        | ssh_credentials, media, playlists, playlist_items,         |   |
|                                        | ad_configs, assignments, cashbox_inventory, deployments,   |   |
|                                        | deployment_steps, rollback_snapshots, audit, settings      |   |
|                                        +────────────────────────────────────────────────────────────+   |
+-----------------------------------------------------------------------┬---------------------------------+
                                                                        │
                                       Outbound SSH / SFTP (TCP 22)     │ Managed Push Pipeline
                                                                        ▼
+---------------------------------------------------------------------------------------------------------+
|                                    RETAIL CASHIER MONOBLOCK (Windows POS)                               |
|                                                                                                         |
|    +-----------------------------+       +------------------------------------+                         |
|    |    Windows OpenSSH Server   |       | C:\UCS\GuestScreen\Front\media\    |                         |
|    +--------------┬--------------+       |  ├── uploads\ (Target Media)       |                         |
|                   │                      |  └── uploads\.staging\<dep_id>\    |                         |
|                   ▼                      +-----------------▲------------------+                         |
|    +-----------------------------+                         │                                            |
|    |    Allowlist Command Exec   | ────────────────────────┤ Atomic Move after SHA-256 Check            |
|    +--------------┬--------------+                         │                                            |
|                   │                                        ▼                                            |
|                   ├──► C:\UCS\GuestScreen\sqlite3.exe "gs.db" (Surgical UPDATE scenes WHERE Guid=...)  |
|                   │                                                                                     |
|                   └──► Touch C:\UCS\GuestScreen\Front\sync_version.txt ──► CefSharp Hot Reload Watcher  |
|                                                                                                         |
|    +-----------------------------------------------------------------------------------------------+    |
|    | Process: GuestScreen.exe (PID preserved continuously) | Monitor: DISPLAY2 (1024x768)          |    |
+----+-----------------------------------------------------------------------------------------------+----+
```

---

## 2. Inviolable Safety Boundaries & Retail Protection Rules

| Boundary Identifier | Absolute Operational Rule | Technical Enforcement Mechanism |
| :--- | :--- | :--- |
| **SAFE-001** | **gs.db Immutability** | Never replace, copy, delete, or recreate `gs.db`. Only surgical updates to specific rows in the `scenes` table are permitted. | `CashboxCommandAdapter` strictly limits SQL targets to `scenes WHERE Guid = ...` using local `sqlite3.exe`. |
| **SAFE-002** | **System Table Protection** | Tables `licenses`, `screens`, `scenarios`, and `settings` in `gs.db` are 100% immutable. | Hardcoded validation in backend `SQLiteSceneService`. Rejects any query referencing forbidden tables. |
| **SAFE-003** | **Hardware Screen Geometry Lock** | Secondary display geometry (`\\.\DISPLAY2`, 1024×768) must never be altered. | Table `screens` in `gs.db` is never updated. Scene width/height values strictly constrained to 1024×768 or 512×768. |
| **SAFE-004** | **r_keeper Order Isolation** | Left half of the 50/50 order screen (`0..512×768`) and check content must never be touched. | Scene GUID `255dc54c-70ea-465d-8b2c-d9d8b0ad63a4` (check scene) is excluded from all update routines. |
| **SAFE-005** | **Zero POS Interruption** | `GuestScreen.exe` process must never be killed or restarted during cashier operations. | Updates are applied via CefSharp hot reload watcher (`sync_version.txt`). Pre/post PID checks verify zero process restart. |
| **SAFE-006** | **Mandatory Pre-Flight Media Gate** | No advertising scene configuration is applied until 100% of required media files pass SHA-256 validation on the cashbox. | Step 7 of the 17-step pipeline blocks execution immediately if a hash mismatch occurs; staging is deleted. |
| **SAFE-007** | **Zero Arbitrary Remote Shell** | Users and API consumers cannot execute arbitrary shell commands on cashboxes. | All commands are mapped to pre-compiled, parameterized allowlist templates; raw string execution is blocked. |

---

## 3. Central System Architecture & Component Boundaries

### 3.1 Layered Architecture Overview
The backend adheres strictly to layered domain-driven design principles:

```text
[ Presentation Layer: FastAPI Routes & Web UI ]
       │ (HTTP / JSON / Pydantic v2 DTOs)
       ▼
[ Application Service Layer: Business Orchestration ]
  ├── MediaStorageService (StorageProvider Abstraction)
  ├── ConfigurationService (Full & 50/50 Reconciler)
  ├── InventoryReconciliationEngine (Desired vs Actual Diff)
  ├── DeploymentOrchestrator (State Machine & Concurrency Manager)
  ├── SQLiteSceneService (sqlite3.exe Transaction Engine)
  ├── HotReloadService (sync_version.txt Trigger)
  ├── VerificationService (Process Stability & Scene Readback)
  ├── RollbackService (Scene Restoration & Cleanup)
  └── AuditService (Immutable Append-Only Log)
       │ (Domain Entities / Protocols)
       ▼
[ Domain Layer: Business Invariants, Models & Validations ]
       │ (Repository / Adapter Interfaces)
       ▼
[ Infrastructure Layer: Database, Transport & Security ]
  ├── PostgreSQL 16 Repository (SQLAlchemy 2.x + asyncpg)
  ├── AsyncSSH Connection Pool & SFTP Staging Manager
  ├── CashboxCommandAdapter (Typed Allowlist Runner)
  ├── SecretManager (AES-256-GCM Authenticated Encryption)
  └── LocalFileSystemStorageProvider
```

---

## 4. Repository Structure & Source Code Layout

```text
d:/Anti/
├── backend/
│   ├── alembic/                      # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/                 # Versioned migration revisions
│   ├── src/
│   │   ├── core/                     # Foundational primitives
│   │   │   ├── config.py             # Pydantic v2 Settings (env, master key, pool)
│   │   │   ├── security.py           # AES-256-GCM secret manager & auth utilities
│   │   │   ├── database.py           # Async SQLAlchemy engine & session factory
│   │   │   └── exceptions.py         # Domain, safety, and security exceptions
│   │   ├── models/                   # SQLAlchemy 2.x Declarative Models
│   │   │   ├── base.py               # DeclarativeBase, UUIDPrimaryKey, TimestampMixin
│   │   │   ├── cashbox.py            # Cashbox, Location, CashboxGroup
│   │   │   ├── credential.py         # SSHCredential
│   │   │   ├── media.py              # MediaAsset
│   │   │   ├── playlist.py           # Playlist, PlaylistItem
│   │   │   ├── configuration.py      # AdConfiguration, ConfigurationAssignment
│   │   │   ├── inventory.py          # CashboxInventory
│   │   │   ├── deployment.py         # Deployment, DeploymentStep, RollbackSnapshot
│   │   │   └── audit.py              # AuditLog, SystemSetting
│   │   ├── schemas/                  # Pydantic v2 Request/Response DTOs
│   │   │   ├── cashbox.py
│   │   │   ├── media.py
│   │   │   ├── playlist.py
│   │   │   ├── configuration.py
│   │   │   └── deployment.py
│   │   ├── adapters/                 # Outbound Infrastructure Adapters
│   │   │   ├── ssh_client.py         # AsyncSSH connection pool & session manager
│   │   │   ├── sftp_storage.py       # SFTP transfer & remote staging manager
│   │   │   ├── command_adapter.py    # Strict Cashbox Allowlist Command Runner
│   │   │   ├── sqlite_adapter.py     # Remote sqlite3.exe surgical execution
│   │   │   └── media_storage.py      # StorageProvider Protocol & LocalFileSystemProvider
│   │   ├── services/                 # Domain Application Services
│   │   │   ├── media_service.py      # Upload validation, hashing, metadata
│   │   │   ├── playlist_service.py   # Playlist compilation, item reordering
│   │   │   ├── config_service.py     # Versioning & assignment logic
│   │   │   ├── inventory_service.py  # Actual State collector & Diff Engine
│   │   │   ├── deployment_service.py # 17-step orchestrator & Concurrency pool
│   │   │   ├── verification_service.py # PID, StartTime & Scene readback checks
│   │   │   ├── rollback_service.py   # Atomic scene restoration from snapshot
│   │   │   └── audit_service.py      # Immutable logging service
│   │   ├── api/                      # FastAPI HTTP Layer
│   │   │   ├── deps.py               # Dependency injection (sessions, services)
│   │   │   └── v1/
│   │   │       ├── api.py            # Route aggregator
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── cashboxes.py
│   │   │       │   ├── media.py
│   │   │       │   ├── playlists.py
│   │   │       │   ├── configurations.py
│   │   │       │   ├── deployments.py
│   │   │       │   └── audit.py
│   │   └── main.py                   # FastAPI app factory, lifespan & recovery
│   └── tests/
│       ├── conftest.py
│       ├── unit/                     # Fast isolated unit tests
│       ├── integration/              # Database, models & service tests
│       ├── mock_ssh/                 # AsyncSSH mock test harness
│       └── acceptance/               # Dedicated acceptance suite on 10.0.0.241
├── frontend/                         # Lightweight SPA (React 18 / Vite)
│   ├── src/
│   │   ├── components/               # Pure ad UI components (no raw SQL/shell)
│   │   ├── views/                    # Cashboxes, Media, Playlists, Full, 50/50, Deployments, Audit
│   │   └── api/                      # Strongly typed REST client
│   └── package.json
└── docker-compose.yml                # Central stack (FastAPI, Postgres, Nginx)
```

---

## 5. PostgreSQL 16 Relational Schema & Domain Models

PostgreSQL 16 is the persistent source of truth. The schema models all 15 required domain entities with strict foreign key constraints, indexes, timestamps, and state checks.

### 5.1 Complete DDL Specification

```sql
-- Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Locations (Cities / Regions)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cashbox Groups (Restaurant Branches / Outlets within Locations)
CREATE TABLE cashbox_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES cashbox_groups(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SSH Credentials Vault (AES-256-GCM Authenticated Encryption)
CREATE TABLE ssh_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('PASSWORD', 'SSH_KEY')),
    username VARCHAR(100) NOT NULL,
    encrypted_secret BYTEA NOT NULL,
    secret_iv BYTEA NOT NULL,
    passphrase_encrypted BYTEA,
    key_fingerprint VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Cashbox Fleet Registry
CREATE TABLE cashboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    group_id UUID NOT NULL REFERENCES cashbox_groups(id) ON DELETE RESTRICT,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    hostname VARCHAR(100),
    ssh_port INTEGER NOT NULL DEFAULT 22,
    ssh_credential_id UUID NOT NULL REFERENCES ssh_credentials(id) ON DELETE RESTRICT,
    guest_screen_version VARCHAR(50) DEFAULT '3.1.1.0',
    os_info VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'UNREACHABLE')),
    sync_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_UPDATE' CHECK (sync_status IN ('SYNCHRONIZED', 'PENDING_UPDATE', 'IN_PROGRESS', 'ERROR')),
    current_full_version INTEGER DEFAULT 0,
    current_split_version INTEGER DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cashboxes_group ON cashboxes(group_id);
CREATE INDEX idx_cashboxes_status ON cashboxes(status, sync_status);

-- 5. Media Library Metadata
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL UNIQUE,
    storage_path VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    sha256 CHAR(64) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_media_sha256 ON media(sha256);

-- 6. Playlists (Reusable Dynamic Collections)
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_type VARCHAR(20) NOT NULL CHECK (display_type IN ('FULL_SCREEN', 'SPLIT_50_50')),
    default_interval_sec INTEGER NOT NULL DEFAULT 5 CHECK (default_interval_sec >= 1),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Playlist Items (Ordered Media Slides with Configurable Intervals)
CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    duration_sec INTEGER CHECK (duration_sec IS NULL OR duration_sec >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (playlist_id, sort_order)
);

-- 8. Advertising Configurations (Discrete FULL SCREEN and 50/50 Entities)
CREATE TABLE advertising_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('FULL_SCREEN', 'SPLIT_50_50')),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('STATIC', 'DYNAMIC')),
    media_id UUID REFERENCES media(id) ON DELETE RESTRICT,
    playlist_id UUID REFERENCES playlists(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_config_payload CHECK (
        (content_type = 'STATIC' AND media_id IS NOT NULL AND playlist_id IS NULL) OR
        (content_type = 'DYNAMIC' AND playlist_id IS NOT NULL AND media_id IS NULL)
    )
);

-- 9. Configuration Assignments (Target Binding to Cashboxes or Groups)
CREATE TABLE configuration_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID REFERENCES cashboxes(id) ON DELETE CASCADE,
    group_id UUID REFERENCES cashbox_groups(id) ON DELETE CASCADE,
    full_configuration_id UUID REFERENCES advertising_configurations(id) ON DELETE RESTRICT,
    split_configuration_id UUID REFERENCES advertising_configurations(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID,
    CONSTRAINT check_target_mutually_exclusive CHECK (
        (cashbox_id IS NOT NULL AND group_id IS NULL) OR
        (group_id IS NOT NULL AND cashbox_id IS NULL)
    )
);

-- 10. Actual Cashbox Media Inventory (Actual State on Monoblock Filesystem)
CREATE TABLE cashbox_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256 CHAR(64) NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cashbox_id, filename)
);
CREATE INDEX idx_cashbox_inv_lookup ON cashbox_inventory(cashbox_id, sha256);

-- 11. Rollback Snapshots (Surgical Scene State for Revert)
CREATE TABLE rollback_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE CASCADE,
    scene_guid VARCHAR(50) NOT NULL,
    previous_raw TEXT NOT NULL,
    previous_version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Persistent Deployments (Authoritative State Machine)
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    target_full_version INTEGER,
    target_split_version INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'RUNNING', 'VERIFYING', 'SUCCESS', 'FAILED', 'ROLLING_BACK', 'ROLLED_BACK', 'CANCELLED', 'FAILED_MANUAL_INTERVENTION', 'NO_OP')
    ),
    error_code VARCHAR(50),
    error_message TEXT,
    rollback_reason TEXT,
    rollback_snapshot_id UUID REFERENCES rollback_snapshots(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_deployments_active ON deployments(status) WHERE status IN ('PENDING', 'RUNNING', 'VERIFYING', 'ROLLING_BACK');

-- 13. Deployment Steps (Granular 17-Step Execution Telemetry)
CREATE TABLE deployment_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
    duration_ms INTEGER NOT NULL DEFAULT 0,
    log_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. System Settings (PostgreSQL Configurable Concurrency & Timeouts)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO system_settings (key, value, description)
VALUES ('concurrency', '{"default_concurrency_pool": 4, "reload_timeout_sec": 15, "sqlite_busy_retry_ms": [200, 500, 1000]}', 'Runtime execution pool settings')
ON CONFLICT (key) DO NOTHING;

-- 15. Immutable Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

---

## 6. Central Desired State vs. Cashbox Actual State

```text
Central Desired State (PostgreSQL 16)
               │
               ▼
   Collect Actual State (SSH)
   ├── 1. Filesystem: C:\UCS\GuestScreen\Front\media\uploads\ (CMD_INVENTORY)
   └── 2. Database: SELECT Raw FROM scenes WHERE Guid = ... (CMD_SQLITE_READ)
               │
               ▼
   InventoryReconciliationEngine
   ├── Compare Hashes & Versions
   └── Generate Media Diff:
        ├── OK: Hash matches central metadata (No action)
        ├── MISSING: File does not exist on cashbox (Upload to staging)
        ├── OUTDATED: File exists but hash differs (Upload to staging, replace)
        └── UNEXPECTED: File exists, not in desired campaign (Retain untouched)
               │
       ┌───────┴───────┐
   Diff Empty       Diff Found
       │               │
       ▼               ▼
 [ Status: NO_OP ] [ 17-Step Deployment ]
```

### Reconciliation Invariants
1. **Never Trust History Alone**: Actual state is **NEVER** inferred purely from past deployment records. It must be confirmed by active SSH inventory scanning and scene readback.
2. **Safe Old Media Policy**: Files classified as `UNEXPECTED` are **NOT deleted**. Garbage collection is explicitly excluded from MVP to allow instant re-activation of previous campaigns without re-uploading media.

---

## 7. Media Storage Service & Decoupled StorageProvider

### 7.1 Provider Protocol (Port & Adapter Pattern)

```python
import typing

class StorageProvider(typing.Protocol):
    async def save(self, file_bytes: bytes, filename: str) -> str:
        '''Save raw binary to storage; return absolute or relative storage_path.'''
        ...

    async def get(self, storage_path: str) -> bytes:
        '''Retrieve binary content from storage.'''
        ...

    async def exists(self, storage_path: str) -> bool:
        '''Verify object existence.'''
        ...

    async def delete(self, storage_path: str) -> bool:
        '''Remove binary content from storage.'''
        ...
```

### 7.2 MVP Implementation: `LocalFileSystemStorageProvider`
- Stores media in `/var/lib/guestscreen/media/` (Linux host) or `D:\GuestScreen_Media\` (Windows host).
- S3/MinIO is excluded from MVP. However, because `MediaStorageService` references only `StorageProvider`, an `S3StorageProvider` can be substituted in Phase 2 without changing a single line of domain code.
- **Path Traversal Protection**: Uploaded filenames are sanitized via regex `^[a-zA-Z0-9_\-\.]+$`. Any presence of `..`, `/`, `\`, or null bytes raises `SecurityViolationError` before any disk I/O.

---

## 8. SSH Transport & SFTP File Transfer Engine

### 8.1 AsyncSSH Client Management
- The central backend utilizes `asyncssh` for high-concurrency non-blocking SSH/SFTP orchestration.
- Connection parameters:
  - Connect timeout: 5.0 seconds.
  - Command execution timeout: 10.0 seconds (customizable per command).
  - Keepalive interval: 15.0 seconds.
  - Strict host key verification against managed `known_hosts` or fingerprint pinning.

### 8.2 File Upload Pipeline (SFTP over SSH)
- Files are uploaded exclusively via SFTP (`sftp.put`) to the isolated staging directory:
  `C:\UCS\GuestScreen\Front\media\uploads\.staging\<deployment_id>\`
- Direct upload to `uploads\` is strictly prohibited.
- If an upload fails midway, the staging directory is purged, leaving the active `uploads\` directory clean and uninterrupted.

---

## 9. CashboxCommandAdapter: Strict Typed Allowlist Runner

Remote commands on POS registers are governed by a closed allowlist. Raw string execution is physically blocked by the adapter.

| Command Identifier | Allowed Invocation Template | Parameter Validations | Timeout |
| :--- | :--- | :--- | :--- |
| `CMD_PING` | `powershell -NoProfile -ExecutionPolicy Bypass -Command Write-Output PONG` | None | 5.0s |
| `CMD_INVENTORY` | PowerShell script scanning `C:\UCS\GuestScreen\Front\media\uploads\` | None | 8.0s |
| `CMD_HASH_VERIFY` | `powershell -NoProfile -ExecutionPolicy Bypass -Command (Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\UCS\GuestScreen\Front\media\uploads\.staging\{dep_id}\{filename}').Hash.ToLower()` | `dep_id`: UUID regex<br>`filename`: `^[a-zA-Z0-9_\-\.]+$` | 10.0s |
| `CMD_STAGING_MOVE` | `powershell -NoProfile -ExecutionPolicy Bypass -Command Move-Item -LiteralPath '...\.staging\{dep_id}\{filename}' -Destination '...\uploads\{filename}' -Force; Remove-Item '...\.staging\{dep_id}' -Recurse -Force` | `dep_id`: UUID regex<br>`filename`: `^[a-zA-Z0-9_\-\.]+$` | 5.0s |
| `CMD_SQLITE_READ` | `C:\UCS\GuestScreen\sqlite3.exe "C:\UCS\GuestScreen\gs.db" "SELECT Raw FROM scenes WHERE Guid = '{guid}';"` | `guid`: Must equal Full GUID or 50/50 GUID | 5.0s |
| `CMD_SQLITE_UPDATE`| `powershell -NoProfile -ExecutionPolicy Bypass -Command "@' PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000; BEGIN IMMEDIATE; UPDATE scenes SET Raw = '{escaped_payload}' WHERE Guid = '{guid}'; COMMIT; '@ | & 'C:\UCS\GuestScreen\sqlite3.exe' 'C:\UCS\GuestScreen\gs.db'"` | `guid`: Whitelist check<br>`escaped_payload`: Validated JSON | 12.0s |
| `CMD_TOUCH_RELOAD` | `powershell -NoProfile -ExecutionPolicy Bypass -Command Set-Content -Path 'C:\UCS\GuestScreen\Front\sync_version.txt' -Value '{timestamp}' -Encoding UTF8` | `timestamp`: ISO8601 string | 3.0s |
| `CMD_PROC_INSPECT` | `powershell -NoProfile -ExecutionPolicy Bypass -Command Get-Process -Name 'GuestScreen' | Select-Object -Property Id, @{Name='StartTime'; Expression={$_.StartTime.ToString('o')}} | ConvertTo-Json -Compress` | None | 5.0s |

---

## 10. Secret Management: AES-256-GCM Complete Lifecycle

### 10.1 Key Lifecycle & Source
1. **Master Key Provisioning**:
   - `APP_MASTER_KEY` is loaded strictly from the environment or container secret (`/run/secrets/app_master_key`).
   - Must be a 32-byte (256-bit) cryptographically secure random hexadecimal string (64 chars).
   - **Fail-Fast Startup Gate**: During FastAPI lifespan startup, `SecretManager` validates that `APP_MASTER_KEY` exists, is 32 bytes, and performs an encryption/decryption self-test. If missing or invalid, the backend immediately terminates (`sys.exit(1)`) with structured fatal log: `"CRITICAL: APP_MASTER_KEY is not configured or invalid. Refusing to start."`
2. **Master Key Isolation**:
   - `APP_MASTER_KEY` is **NEVER** stored in PostgreSQL, Git, source code, logs, API responses, or UI payloads.

### 10.2 Encryption & Nonce Generation
- Uses Python `cryptography.hazmat.primitives.ciphers.aead.AESGCM`.
- For every secret encryption operation, generates a unique 96-bit (12-byte) random nonce via `os.urandom(12)`.
- Associated Authenticated Data (AAD) is bound to the credential's UUID string to prevent ciphertext transplantation across records.
- Ciphertext format in PostgreSQL `BYTEA` column `encrypted_secret`:
  $$\text{Stored Payload} = \text{Nonce (12B)} \parallel \text{Ciphertext} \parallel \text{Auth Tag (16B)}$$

### 10.3 Key Rotation & Failure Handling
- **Rotation Script**: `backend/src/cli/rotate_keys.py --old-key <key> --new-key <key>` executes inside a single database transaction:
  - Fetches all records from `ssh_credentials`.
  - Decrypts with `old-key`.
  - Re-encrypts with `new-key` (generating fresh random nonces for every row).
  - Updates PostgreSQL and commits atomically.
- **Decryption Failure**: Any authentication tag mismatch or corrupted ciphertext raises `CredentialDecryptionError` without leaking data.
- **Disaster Recovery**: PostgreSQL backups contain only ciphertext. Restoring a database backup requires provisioning the same `APP_MASTER_KEY`.

---

## 11. SQLite Surgical Update Service: Parameters & Bounded Retry

### 11.1 Execution Environment & WAL Mode
- Direct replacement of `gs.db` is strictly prohibited.
- All scene modifications execute through `C:\UCS\GuestScreen\sqlite3.exe` on the cashbox.
- Every transaction enforces write-ahead logging and a 10-second lock timeout:
  ```sql
  PRAGMA journal_mode=WAL;
  PRAGMA busy_timeout=10000;
  BEGIN IMMEDIATE;
  UPDATE scenes SET Raw = :raw_payload WHERE Guid = :guid;
  COMMIT;
  ```

### 11.2 Bounded Retry Schedule for `SQLITE_BUSY`
When cashiers actively punch in orders in r_keeper, SQLite may briefly encounter concurrent lock contention.
- The service implements a **strict bounded retry schedule**:
  - **Attempt 1**: Wait 200 ms (+/- 20ms jitter)
  - **Attempt 2**: Wait 500 ms (+/- 50ms jitter)
  - **Attempt 3**: Wait 1000 ms (+/- 100ms jitter)
  - **Total retry window**: Maximum 1.7 seconds.
- **Strict Limit**: If all 3 attempts fail with `database is locked` / `SQLITE_BUSY`, the operation immediately raises `SQLiteLockTimeoutError` and rolls back. Infinite retries are strictly prohibited.

---

## 12. Hot Reload Service: 15-Second Observable Verification

- **Trigger File**: `C:\UCS\GuestScreen\Front\sync_version.txt`.
- **Mechanism**: Modifying this file triggers CefSharp Chromium's internal file watcher, reloading the DOM scenes seamlessly without restarting the `GuestScreen.exe` process.
- **Verification Window**: The system grants CefSharp a strict timeout of **15 seconds** to acknowledge the reload.
- **Observable Verification**: Writing the file is **NOT** considered success. Success requires:
  1. `GuestScreen.exe` PID and StartTime remain identical to the pre-deployment baseline.
  2. Scene readback (`SELECT Raw FROM scenes WHERE Guid = ...`) confirms the target JSON is persistent.
  3. If verification fails or times out after 15 seconds, the deployment is marked `FAILED` and automatic rollback is triggered.

---

## 13. The 17-Step Deployment Pipeline & Mandatory Staging Gate

The deployment pipeline executes in a strict, linear, atomic sequence. If any critical step fails, execution **STOPS IMMEDIATELY**.

```text
 [1. Validate Desired Config] -> [2. Validate Central Media] -> [3. SSH Handshake]
                                                                        │
 ┌──────────────────────────────────────────────────────────────────────┘
 │
 ▼
 [4. Get Cashbox Inventory] -> [5. Calculate Diff]
                                      │
         ┌────────────────────────────┴────────────────────────────┐
      No Diff & Versions Match                                Diff Detected
         │                                                         │
         ▼                                                         ▼
 [18. Mark NO-OP & Synced]                        [6. Upload Missing/Outdated to Staging]
                                                                   │
                                                                   ▼
                                                  [7. Verify SHA-256 on Cashbox]
                                                                   │ (Fail -> STOP & Cleanup)
                                                                   ▼
                                                  [8. Move Files Atomically to uploads/]
                                                                   │
 ┌─────────────────────────────────────────────────────────────────┘
 │
 ▼
 [9. Snapshot Current Scene] -> [10. Validate Scene GUID] -> [11. Update Scene via sqlite3.exe]
                                                                   │
                                                                   ▼
                                                           [12. Commit Transaction]
                                                                   │
 ┌─────────────────────────────────────────────────────────────────┘
 │
 ▼
 [13. Update sync_version.txt] -> [14. Wait for Hot Reload (<=15s)]
                                               │
 ┌─────────────────────────────────────────────┘
 │
 ▼
 [15. Verify GuestScreen PID/StartTime] -> [16. Read Scene Back] -> [17. Mark SUCCESS]
                                                            │
                                                  (Any Verification Fail)
                                                            │
                                                            ▼
                                                [ Rollback Service Revert ]
```

### Detailed Pipeline Steps:
1. **Validate Desired Configuration**: Validate the configuration structure, playlist items, and display mode in PostgreSQL.
2. **Validate Central Media**: Verify that 100% of required media binaries exist on the central server's storage disk. If missing, abort before network connection.
3. **SSH Handshake**: Connect to the cashbox on port 22; execute `CMD_PING` to verify shell responsiveness.
4. **Get Cashbox Inventory**: Execute `CMD_INVENTORY` on `Front\media\uploads\` to collect actual filenames, sizes, and SHA-256 hashes.
5. **Calculate Diff**: Reconcile desired vs actual inventory (`OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`). If diff is empty and target version matches current version, complete as `NO_OP`.
6. **Upload Missing/Outdated to Staging**: Transfer only `MISSING` and `OUTDATED` files via SFTP into `uploads\.staging\<dep_id>\`.
7. **Verify SHA-256 on Cashbox (Mandatory Pre-Flight Gate)**: Execute `CMD_HASH_VERIFY` on every file in staging. **If any hash does not match: STOP. Purge staging. Never touch gs.db.**
8. **Move Files Atomically**: Execute `CMD_STAGING_MOVE` to move verified files into `uploads\` and delete the staging directory.
9. **Snapshot Advertising Scene**: Read current scene `Raw` via `CMD_SQLITE_READ` and persist in `rollback_snapshots`.
10. **Validate Scene GUID**: Confirm the target GUID matches the expected constant (`2509359c...` for Full or `68906ed2...` for 50/50).
11. **Update Advertising Scene**: Invoke `CMD_SQLITE_UPDATE` via `sqlite3.exe` using WAL mode and bounded retries.
12. **Commit Transaction**: Verify zero exit code from `sqlite3.exe`.
13. **Update sync_version.txt**: Execute `CMD_TOUCH_RELOAD` to write the current timestamp into `Front\sync_version.txt`.
14. **Wait for Hot Reload**: Await CefSharp Chromium reload within the 15-second observable window.
15. **Verify Process Stability**: Execute `CMD_PROC_INSPECT`. Assert that `GuestScreen.exe` PID and StartTime have not changed.
16. **Read Scene Back**: Execute `CMD_SQLITE_READ` to confirm target configuration JSON is physically stored in `gs.db`.
17. **Mark SUCCESS**: Update deployment status to `SUCCESS` in PostgreSQL, update cashbox `current_full_version` / `current_split_version`, set `sync_status = 'SYNCHRONIZED'`, release advisory lock.

---

## 14. Deployment State Machine, Worker Queue & Crash Recovery

### 14.1 State Machine Specification

| State | Type | Description | Valid Transitions |
| :--- | :--- | :--- | :--- |
| `PENDING` | Transient | Deployment queued in PostgreSQL, awaiting worker pickup | `RUNNING`, `CANCELLED` |
| `RUNNING` | Active | Pipeline actively executing (Steps 1–13) | `VERIFYING`, `FAILED`, `NO_OP` |
| `VERIFYING` | Active | Reload triggered, awaiting verification (Steps 14–16) | `SUCCESS`, `ROLLING_BACK` |
| `SUCCESS` | Terminal | All 17 steps completed and verified | None |
| `FAILED` | Terminal | Execution stopped due to pre-flight or transmission failure | None |
| `ROLLING_BACK`| Active | Post-update verification failed; reverting scene in `gs.db` | `ROLLED_BACK`, `FAILED_MANUAL_INTERVENTION` |
| `ROLLED_BACK` | Terminal | Scene reverted to snapshot; reload triggered and verified | None |
| `FAILED_MANUAL_INTERVENTION` | Terminal Alert | Rollback failed or cashbox became unreachable during revert | None |
| `NO_OP` | Terminal | Idempotent skip; cashbox already in desired state | None |
| `CANCELLED` | Terminal | User cancelled job before worker pickup | None |

### 14.2 Server Restart Recovery Algorithm
If the central management server crashes or restarts:
1. On startup (FastAPI `lifespan`), `DeploymentReconciliationWorker.reconcile()` queries PostgreSQL for all deployments in active states:
   `SELECT * FROM deployments WHERE status IN ('RUNNING', 'VERIFYING', 'ROLLING_BACK')`
2. For each interrupted deployment:
   - Connect to the cashbox via SSH.
   - Read current scene from `gs.db` and query `GuestScreen.exe` PID.
   - If the target scene is present and verified → update status to `SUCCESS`.
   - If in an incomplete or corrupt state → trigger `RollbackService` to restore `previous_state_snapshot`.
   - If cashbox is completely unreachable → mark status `FAILED` with message `"Interrupted by central server crash; cashbox unreachable"`.
3. Re-queue all `PENDING` deployments into the in-memory `asyncio.Queue`.
4. **Zero Lost Deployments**: Incomplete deployments are never silently dropped.

---

## 15. Concurrency Control & Per-Cashbox PostgreSQL Advisory Locking

1. **Worker Pool Architecture**:
   - Central backend spawns a configurable worker pool (default: **4 concurrent cashbox workers**).
   - Value is stored in PostgreSQL table `system_settings` (`default_concurrency_pool = 4`).
2. **Mutual Exclusion per Cashbox**:
   - Two deployments for the same cashbox must **NEVER** execute concurrently.
   - Before touching any cashbox, the worker acquires a transactional advisory lock:
     ```sql
     SELECT pg_try_advisory_xact_lock(hashtext('cashbox:' || :cashbox_id::text));
     ```
   - If the function returns `FALSE`, another worker is actively modifying this cashbox. The current deployment remains queued or is deferred with a 5-second backoff.
   - When the transaction ends (terminal state reached), PostgreSQL automatically releases the advisory lock.
   - Independent cashboxes execute in full parallel concurrency.

---

## 16. Full Idempotency Engine: Zero-Impact NO-OP

- **Condition**:
  $$\text{target\_version} == \text{current\_version} \quad \land \quad \forall \text{media} \in \text{desired}: \text{hash}_{\text{actual}} == \text{hash}_{\text{desired}}$$
- **Behavior**:
  - The pipeline terminates at Step 5.
  - **Zero bytes transferred** over SFTP.
  - **Zero queries executed** against `gs.db`.
  - **Zero file touches** to `sync_version.txt`.
  - Deployment status recorded as `NO_OP` in under 1.0 second. The secondary display does not flicker.

---

## 17. Atomic Rollback Engine & Terminal State Handling

### 17.1 Rollback Invariants
- **Scene-Only Revert**: Rollback restores **ONLY** the modified scene record in `gs.db` using `previous_raw` and `previous_version` from `rollback_snapshots`.
- **Media Preservation**: Rollback of a scene does **NOT** delete media files. Existing media remain safely cached in `uploads\`.
- **Rollback Sequence**:
  1. Execute `CMD_SQLITE_UPDATE` with `previous_raw`.
  2. Commit transaction.
  3. Execute `CMD_TOUCH_RELOAD` on `sync_version.txt`.
  4. Wait up to 15 seconds for CefSharp reload.
  5. Verify PID/StartTime and read back restored scene.
  6. Transition deployment to status `ROLLED_BACK`.
- **Terminal Intervention State**: If rollback fails (e.g., cashbox loses power during revert), deployment transitions to **`FAILED_MANUAL_INTERVENTION`** and triggers an urgent priority alert in `audit_logs`.

---

## 18. Comprehensive Failure Matrix

| Pipeline Step | Failure Event | Detection Mechanism | State Transition | Cleanup Action | Rollback Scene? | Final State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Invalid config / broken playlist | Pre-flight validation in DB | `PENDING` → `FAILED` | None | No | `FAILED` |
| **Step 2** | Central media file missing | StorageProvider `exists()` check | `PENDING` → `FAILED` | None | No | `FAILED` |
| **Step 3** | Cashbox unreachable / offline | SSH connection timeout (5s) | `PENDING` → `FAILED` | Close socket | No | `FAILED` (Cashbox: `OFFLINE`) |
| **Step 4** | Inventory scan failure | Non-zero exit code on `CMD_INVENTORY` | `RUNNING` → `FAILED` | None | No | `FAILED` |
| **Step 6** | SFTP upload interrupted | SSH socket disconnect / timeout | `RUNNING` → `FAILED` | Purge `.staging/<dep_id>/` | No | `FAILED` |
| **Step 7** | SHA-256 checksum mismatch | `CMD_HASH_VERIFY` hash != metadata | `RUNNING` → `FAILED` | Purge `.staging/<dep_id>/` | No | `FAILED` |
| **Step 8** | Atomic move error (disk full) | Non-zero exit code on `CMD_STAGING_MOVE` | `RUNNING` → `FAILED` | Purge `.staging/<dep_id>/` | No | `FAILED` |
| **Step 11** | SQLite lock contention | `SQLITE_BUSY` after 3 retries | `RUNNING` → `FAILED` | None (`gs.db` untouched) | No | `FAILED` |
| **Step 14** | Hot reload timeout (>15s) | Reload watcher unconfirmed | `VERIFYING` → `ROLLING_BACK` | None | **Yes** | `ROLLED_BACK` |
| **Step 15** | Process crash (PID changed) | `CMD_PROC_INSPECT` PID mismatch | `VERIFYING` → `ROLLING_BACK` | None | **Yes** | `ROLLED_BACK` |
| **Step 16** | Scene readback mismatch | `CMD_SQLITE_READ` Raw != desired | `VERIFYING` → `ROLLING_BACK` | None | **Yes** | `ROLLED_BACK` |
| **Rollback** | Rollback execution failed | SSH drop / SQLite error during revert | `ROLLING_BACK` → `FAILED_MANUAL_INTERVENTION` | None | Attempted | `FAILED_MANUAL_INTERVENTION` |

---

## 19. FastAPI Application Architecture & REST API Design

The REST API strictly delegates to Application Services. Direct SQL queries, raw SSH calls, or command execution from route handlers are **prohibited**.

```text
[ Route Handler: POST /deployments ]
         │ (Pydantic v2 DTO validation)
         ▼
[ DeploymentService.enqueue_deployment(request) ]
         │ (Persists 'PENDING' in PostgreSQL, notifies Worker Pool)
         ▼
[ Worker: execute_deployment(deployment_id) ]
         │ (Acquires Advisory Lock, coordinates 17 steps)
         ▼
[ CashboxCommandAdapter / SFTPStorageAdapter ]
```

### 19.1 Core Endpoints & Route Mapping

| HTTP Verb & Path | Layer Delegated To | Operation Summary |
| :--- | :--- | :--- |
| `POST /api/v1/media` | `MediaService.upload_media()` | Multipart image upload, hashing, thumbnail generation |
| `GET /api/v1/media` | `MediaService.list_media()` | Filtered pagination of active media |
| `DELETE /api/v1/media/{id}` | `MediaService.delete_media()` | Safe delete guarded by dependency check |
| `POST /api/v1/playlists` | `PlaylistService.create_playlist()` | Ordered playlist creation with slide intervals |
| `GET /api/v1/playlists` | `PlaylistService.list_playlists()` | Dynamic playlist listing |
| `POST /api/v1/configurations` | `ConfigService.create_configuration()`| Create FULL / 50/50 config with auto-versioning |
| `GET /api/v1/cashboxes` | `CashboxService.list_fleet()` | Cashbox fleet overview with sync badges |
| `POST /api/v1/cashboxes` | `CashboxService.register_cashbox()` | Register monoblock (IP, group, credential ref) |
| `POST /api/v1/cashboxes/{id}/inventory` | `InventoryService.scan_cashbox()` | Live SSH inventory scan |
| `POST /api/v1/deployments` | `DeploymentService.enqueue()` | Enqueue deployment in PostgreSQL |
| `GET /api/v1/deployments/{id}` | `DeploymentService.get_status()` | Real-time 17-step deployment progress |
| `POST /api/v1/deployments/{id}/rollback` | `RollbackService.trigger_rollback()` | User-initiated emergency rollback |
| `GET /api/v1/audit` | `AuditService.query_logs()` | Filtered query of immutable audit trail |

---

## 20. Frontend Architecture: Strict Scope Lock SPA

The Web UI (React 18 + Vite) provides a clean, focused user experience designed exclusively for marketing operations:

```text
+-----------------------------------------------------------------------------------------------+
|  UCS GuestScreen Media Manager                                      [Operator: Ivan] [Logout] |
+-----------------------------------------------------------------------------------------------+
| [ Кассы ]   [ Медиа ]   [ Плейлисты ]   [ FULL SCREEN ]   [ 50 / 50 ]   [ Деплои ]   [ Аудит ]|
+-----------------------------------------------------------------------------------------------+
```

### 20.1 UI Views & Core Interactions
1. **Кассы (Cashboxes)**:
   - Branch tree view. Online/offline indicators, sync status badges (`Synchronized`, `Pending Update`, `In Progress`, `Error`).
   - "Проверить связь" (Ping) and "Инвентаризация" action triggers.
2. **Медиа (Media Library)**:
   - Drag-and-drop file uploader with dimension hints (1024×768 or 512×768).
   - Card grid with thumbnail, dimensions, file size, SHA-256 copy button, and active usage list.
   - Delete button is disabled with tooltip if media is used in any playlist.
3. **Плейлисты (Playlists)**:
   - Visual playlist constructor.
   - Drag-and-drop reordering of slides.
   - Duration slider per slide (1–60s, default 5s or 7s).
   - Interactive preview viewport simulating slide rotation.
4. **FULL SCREEN**:
   - Radio selector: `Static` (single banner) vs `Dynamic` (select playlist).
   - Target scope: All cashboxes / Branch / Single cashbox.
   - One-click "Опубликовать" button with auto-version increment.
5. **50 / 50**:
   - Radio selector: `Static` (single promo) vs `Dynamic` (select playlist).
   - Target scope. One-click "Опубликовать" button.
6. **Деплои (Deployments)**:
   - Real-time progress monitor showing the active step of the 17-step pipeline.
   - Status badges with detailed error message on failure.
   - "Откатить" (Rollback) button on every deployment record.
7. **Аудит (Audit Log)**:
   - Filterable table of all administrative actions, timestamps, and IP addresses.

**Scope Lock**: The UI contains **NO** arbitrary SQL inputs, **NO** terminal/remote shell windows, **NO** order management tabs, and **NO** GuestScreen screen/scenario editor.

---

## 21. Security Model, RBAC & Audit Logging

1. **Authentication & Authorization**:
   - JWT session tokens (HS256 or RS256).
   - Role-Based Access Control (RBAC):
     - `Admin`: Full management of cashboxes, credentials, system settings, and deployments.
     - `Operator / Content Manager`: Media library upload, playlist builder, configuration publishing.
     - `Auditor`: Read-only access to audit logs, cashbox statuses, and deployment histories.
2. **Credential Masking**:
   - Passwords and SSH private keys are never returned via the API or logged.
   - Pydantic DTOs use `SecretStr` for write-only fields.
3. **Immutable Audit Trail**:
   - Every state change, login, upload, deployment, and rollback writes an append-only row to `audit_logs`.

---

## 22. Observability, Structured Telemetry & Error Handling

1. **Structured JSON Logging**:
   - All server logs use Python `structlog` outputting JSON:
     ```json
     {"timestamp": "2026-09-10T16:00:00.123Z", "level": "info", "event": "step_completed", "deployment_id": "9b1deb4d...", "cashbox_id": "e4b6c8a1...", "step_number": 7, "step_name": "CMD_HASH_VERIFY", "duration_ms": 142}
     ```
2. **Safety Against Data Leakage**:
   - `APP_MASTER_KEY`, SSH passwords, and private keys are strictly scrubbed from log outputs via custom logging filters.

---

## 23. Test Strategy & Dedicated Hardware Acceptance Suite

### 23.1 Test Matrix

```text
                                  TEST HIERARCHY
                ┌─────────────────────────────────────────────────┐
                │      E2E Hardware Suite (Cashier 10.0.0.241)     │
                ├─────────────────────────────────────────────────┤
                │      AsyncSSH Mock Integration Tests            │
                ├─────────────────────────────────────────────────┤
                │      Database & Service Integration Tests       │
                ├─────────────────────────────────────────────────┤
                │      Fast Unit Tests (Pytest / Pydantic)        │
                └─────────────────────────────────────────────────┘
```

1. **Unit Tests (`tests/unit/`)**:
   - `test_security.py`: AES-256-GCM encryption/decryption, wrong tag rejection, master key validation.
   - `test_allowlist.py`: Command template regex validation, rejection of arbitrary shell injection.
   - `test_diff_engine.py`: Inventory diff calculations (`OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`).
2. **Integration Tests (`tests/integration/`)**:
   - `test_db_schema.py`: Foreign key cascades, unique constraints, advisory lock acquisition.
   - `test_concurrency.py`: Worker pool limit (4 cashboxes), per-cashbox lock contention.
   - `test_recovery.py`: Startup reconciliation of interrupted deployments.
3. **Mock SSH Tests (`tests/mock_ssh/`)**:
   - `test_pipeline.py`: Full 17-step pipeline execution against simulated AsyncSSH server.

### 23.2 Dedicated Hardware Acceptance Suite on `10.0.0.241` (GuestScreen 3.1.1.0)
The dedicated test suite (`tests/acceptance/test_cashbox_241.py`) verifies:

| Test Case | Operational Scenario | Strict Assertions |
| :--- | :--- | :--- |
| **TC-001** | Deploy FULL static banner | File transferred; SHA matches; scene `2509359c...` updated; `GuestScreen.exe` PID unchanged; display shows banner |
| **TC-002** | Deploy FULL dynamic slideshow | 3 slides deployed; interval 5s; verify slides rotate every 5s on secondary display |
| **TC-003** | Deploy 50/50 static during active order | Open check in r_keeper; deploy promo; right half shows promo; left half check is 100% uninterrupted |
| **TC-004** | Deploy 50/50 dynamic slideshow | Deploy 2 slides with 7s interval during active check; verify rotation |
| **TC-005** | Missing central media | Request deploy with missing file; assert pipeline aborts at Step 2; zero SSH contact |
| **TC-006** | Wrong SHA-256 checksum | Corrupt file in `.staging/`; assert abort at Step 7; staging purged; `gs.db` untouched |
| **TC-007** | SFTP network drop | Disconnect network mid-upload; assert status `FAILED`; staging purged; cashbox ad uninterrupted |
| **TC-008** | SQLite lock contention | Hold lock on `gs.db`; verify 3 bounded retries (200ms, 500ms, 1000ms); assert safe abort |
| **TC-009** | Hot reload failure & rollback | Simulate reload timeout (>15s); assert automatic rollback restores previous scene |
| **TC-010** | Verification failure (PID change) | Terminate `GuestScreen.exe` during reload; assert Step 15 failure and critical alert |
| **TC-011** | Rollback execution | Trigger manual rollback; assert previous scene restored in `gs.db`; reload acknowledged |
| **TC-012** | Offline cashbox in group | Power off one cashbox in a group batch; assert it marks `OFFLINE` while others succeed |
| **TC-013** | Re-deployment Idempotency (NO-OP) | Deploy same version; assert returns `NO_OP` in < 1s; zero bytes uploaded; zero SQL updates |
| **TC-014** | **Hardware Invariant Verification** | Verify MD5/SHA256 of `licenses`, `screens`, `scenarios`, `settings` tables are **100% identical** before and after all 13 test runs |

---

## 24. 16 Concrete Implementation Phases

```text
Phase 0: Repository & Foundation ──► Phase 1: PostgreSQL Schema ──► Phase 2: Security & Credentials
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
▼
Phase 3: Media Storage Provider ──► Phase 4: Playlists & Configs ──► Phase 5: Cashbox Fleet Registry
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
▼
Phase 6: SSH & SFTP Engine ───────► Phase 7: Inventory & Diff ───► Phase 8: SQLite Scene Adapter
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
▼
Phase 9: Deployment Orchestrator ─► Phase 10: Hot Reload Service ─► Phase 11: Rollback & Recovery
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
▼
Phase 12: FastAPI REST API ───────► Phase 13: Lightweight UI SPA ─► Phase 14: Observability & Audit
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
▼
Phase 15: Hardware Acceptance Suite on 10.0.0.241 (Production Sign-Off)
```

- **Phase 0: Repository & Foundation**: Python 3.13 venv, core config, structlog, exceptions.
- **Phase 1: PostgreSQL Schema & Migrations**: Alembic setup, 15 tables, indexes, constraints.
- **Phase 2: Security & Credentials**: AES-256-GCM secret manager, `APP_MASTER_KEY` startup check, rotation CLI.
- **Phase 3: Media Storage Service**: `StorageProvider` protocol, `LocalFileSystemStorageProvider`, upload validation.
- **Phase 4: Playlist & Configuration Domain**: Reusable playlist models, version incrementing, DTOs.
- **Phase 5: Cashbox Fleet Registry**: Cashbox CRUD, group hierarchy, SSH credential binding.
- **Phase 6: SSH & SFTP Engine**: AsyncSSH client pool, SFTP staging upload manager.
- **Phase 7: Cashbox Inventory**: `CMD_INVENTORY` runner, actual state collection, diff engine (`OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`).
- **Phase 8: GuestScreen SQLite Adapter**: `sqlite3.exe` wrapper, WAL mode, bounded retry schedule (200ms, 500ms, 1000ms).
- **Phase 9: Deployment Orchestrator**: 17-step pipeline coordinator, PostgreSQL advisory lock per cashbox, concurrency pool (4 workers).
- **Phase 10: Hot Reload & Verification**: `sync_version.txt` trigger, 15s timeout watcher, `CMD_PROC_INSPECT` PID stability check.
- **Phase 11: Rollback & Crash Recovery**: `RollbackService` (scene revert only), startup reconciliation worker.
- **Phase 12: FastAPI REST API**: Endpoints for media, playlists, configs, cashboxes, deployments, and audit.
- **Phase 13: Frontend SPA**: Lightweight React/Vite UI strictly limited to ad management.
- **Phase 14: Observability & Audit**: Structured audit logger, telemetry metrics, credential masking filters.
- **Phase 15: Hardware Acceptance Testing on `10.0.0.241`**: Execution of TC-001 through TC-014 on genuine GuestScreen 3.1.1.0 POS hardware.

---

## 25. Traceability Matrix: Mapping Requirements to Implementation

| Spec.md Requirement | Implementation Component / Module | Test Suite & Verification |
| :--- | :--- | :--- |
| **FR-001 - FR-005** (Media upload, storage, hashing) | `backend/src/services/media_service.py`<br>`backend/src/adapters/media_storage.py` | `tests/unit/test_media.py`<br>Upload API integration tests |
| **FR-006 - FR-011** (Playlists & Configurations) | `backend/src/services/playlist_service.py`<br>`backend/src/services/config_service.py` | `tests/unit/test_playlist.py`<br>`tests/integration/test_config.py` |
| **FR-012 - FR-015** (Fleet Registry & Inventory) | `backend/src/services/inventory_service.py`<br>`backend/src/models/cashbox.py` | `tests/unit/test_diff_engine.py`<br>Inventory scan integration tests |
| **FR-016 - FR-019** (SFTP Staging & Mandatory SHA Gate) | `backend/src/adapters/sftp_storage.py`<br>`backend/src/services/deployment_service.py` | `tests/mock_ssh/test_staging.py`<br>TC-006 (Wrong SHA-256 test) |
| **FR-020 - FR-021** (Surgical `sqlite3.exe` Scene Updates) | `backend/src/adapters/sqlite_adapter.py`<br>`backend/src/adapters/command_adapter.py` | `tests/integration/test_sqlite.py`<br>TC-001, TC-003, TC-014 on 10.0.0.241 |
| **FR-022 - FR-024** (Hot Reload & Idempotency NO-OP) | `backend/src/services/verification_service.py`<br>`backend/src/services/deployment_service.py` | `tests/unit/test_idempotency.py`<br>TC-013 (NO-OP test) |
| **FR-025 - FR-028** (AES-256-GCM, Allowlist & Audit) | `backend/src/core/security.py`<br>`backend/src/adapters/command_adapter.py` | `tests/unit/test_security.py`<br>`tests/unit/test_allowlist.py` |
| **NFR-001 - NFR-005** (Concurrency 4, Performance) | `backend/src/services/deployment_service.py` | `tests/integration/test_concurrency.py` |
| **NFR-006 - NFR-008** (Zero POS Downtime & Safety) | `backend/src/adapters/sqlite_adapter.py` | TC-003 (Active r_keeper order test) |
| **SC-001 - SC-008** (Measurable Success Criteria) | `backend/tests/acceptance/test_cashbox_241.py` | TC-001 through TC-014 acceptance suite |

---

## 26. Pre-Flight Architectural Verifications (Checks A through J)

| Check | Architectural Verification Question | Verified Plan Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **A** | Can deployment state be safely recovered after central server crash? | Yes. PostgreSQL 16 persists all states. `DeploymentReconciliationWorker` re-evaluates active cashbox states and re-queues `PENDING` jobs on startup. | **VERIFIED** |
| **B** | Can deployments be safely retried after SSH connection loss without state corruption? | Yes. Uploads go to `.staging/<dep_id>/`; `gs.db` is never touched until 100% verified; interrupted staging directories are safely purged. | **VERIFIED** |
| **C** | Can 4 different cashboxes be updated simultaneously? | Yes. The worker pool defaults to 4 concurrent workers, processing independent cashboxes in parallel. | **VERIFIED** |
| **D** | Is it impossible for two deployments to target the same cashbox simultaneously? | Yes. Enforced via PostgreSQL advisory transaction locks: `pg_try_advisory_xact_lock(hashtext('cashbox:' || :id))`. | **VERIFIED** |
| **E** | Is it guaranteed that scene configurations cannot apply before media files exist? | Yes. Step 7 (SHA-256 validation) and Step 8 (Atomic move) form a mandatory gate prior to Step 11 (`sqlite3.exe` update). | **VERIFIED** |
| **F** | Is it impossible for corrupted media to enter production uploads? | Yes. Pre-flight SHA-256 check occurs inside `.staging/`. Any hash mismatch aborts the pipeline and purges the staging directory. | **VERIFIED** |
| **G** | Does rollback restore the previous scene without touching licenses or screens? | Yes. Rollback executes a single SQL statement updating only the scene `Raw` by GUID, leaving all other tables untouched. | **VERIFIED** |
| **H** | Does NO-OP truly avoid all cashier alterations? | Yes. When `desired == actual` and hashes match, the pipeline terminates at Step 5. Zero SFTP bytes, zero SQL updates, zero reload touches. | **VERIFIED** |
| **I** | Can API or UI initiate arbitrary SQL or remote shell commands? | **NO**. The API only calls application services. The remote adapter permits only typed commands from the strict allowlist. | **VERIFIED** |
| **J** | Is `APP_MASTER_KEY` absent from PostgreSQL and Git repositories? | Yes. It is loaded strictly from the host environment or Docker secrets with a fail-fast startup gate. | **VERIFIED** |

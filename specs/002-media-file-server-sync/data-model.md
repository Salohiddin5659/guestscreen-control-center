# Phase 1: Data Model & Schema Design — Media File Server Synchronization

**Feature Identifier**: `002-media-file-server-sync`  
**Date**: 2026-09-04  
**Target Database**: PostgreSQL 16 (Authoritative Metadata Store)  
**ORM**: SQLModel / SQLAlchemy 2.0 Async  
**Migration**: Alembic Revision `008_file_server_sync_schema`  

---

## 1. Entity-Relationship Overview

```
+-------------------------------------------------------------+
|                      FileServerConfig                       |
+-------------------------------------------------------------+
| id: UUID [PK]                                               |
| protocol: String(20) [SMB, LOCAL_MOUNT]                     |
| host: String(255)                                           |
| port: Integer (Default: 445)                                |
| share_name: Optional[String(100)]                           |
| base_path: String(500) (Default: "")                        |
| username: Optional[String(100)]                             |
| password_encrypted: Optional[LargeBinary]                   |
| domain: Optional[String(100)]                               |
| sync_interval_seconds: Integer (Default: 60, Range 10..3600)|
| deletion_policy: String(20) (ARCHIVE, HARD_DELETE)          |
| archive_subfolder: String(100) (Default: ".archive")        |
| enabled: Boolean (Default: True)                            |
| last_sync_at: Optional[DateTime(timezone=True)]             |
| last_sync_status: String(20) (IDLE, RUNNING, OK, ERROR)     |
| last_error_message: Optional[Text]                          |
| created_at: DateTime(timezone=True)                         |
| updated_at: DateTime(timezone=True)                         |
+-------------------------------------------------------------+
                              | 1
                              |
                              | 0..* (Managed files)
                              v
+-------------------------------------------------------------+
|                    MediaAsset (Extended)                    |
+-------------------------------------------------------------+
| id: UUID [PK]                                               |
| original_name: String(255)                                  |
| stored_name: String(100) [Index] (<sha256>.<ext>)           |
| sha256: String(64) [Index]                                  |
| mime_type: String(100)                                      |
| media_type: String(20) [IMAGE, VIDEO]                       |
| file_size_bytes: BigInteger                                 |
| width: Optional[Integer]                                    |
| height: Optional[Integer]                                   |
| s3_bucket: String(100) (Default: "media")                   |
| s3_key: String(255)                                         |
| file_server_path: Optional[String(500)] [Index] [NEW]       |
| file_server_mtime: Optional[DateTime(tz=True)] [NEW]        |
| file_server_size: Optional[BigInteger] [NEW]                |
| last_sync_sha256: Optional[String(64)] [NEW]                |
| sync_status: String(30) [Index] [NEW]                       |
| sync_error_message: Optional[Text] [NEW]                    |
| source_origin: String(30) [NEW]                             |
| last_synced_at: Optional[DateTime(tz=True)] [NEW]           |
| uploaded_by_user_id: Optional[UUID] [FK -> users.id]        |
| version: Integer (Default: 1, OCC)                          |
| is_deleted: Boolean (Default: False)                        |
| created_at: DateTime(timezone=True)                         |
+-------------------------------------------------------------+
                              | 1
                              |
                              | 0..* (Conflicts)
                              v
+-------------------------------------------------------------+
|                     MediaSyncConflict                       |
+-------------------------------------------------------------+
| id: UUID [PK]                                               |
| media_asset_id: UUID [FK -> media_assets.id, OnDelete=CASCADE]
| local_sha256: String(64)                                    |
| local_mtime: DateTime(timezone=True)                        |
| remote_sha256: String(64)                                   |
| remote_mtime: DateTime(timezone=True)                       |
| remote_path: String(500)                                    |
| conflict_copy_s3_key: Optional[String(255)]                 |
| status: String(20) [OPEN, RESOLVED_LOCAL, RESOLVED_REMOTE]  |
| detected_at: DateTime(timezone=True)                        |
| resolved_at: Optional[DateTime(timezone=True)]              |
| resolved_by_user_id: Optional[UUID] [FK -> users.id]        |
| resolution_notes: Optional[Text]                            |
+-------------------------------------------------------------+
```

---

## 2. Sync Status Lifecycle & State Machine

```
                            [External Ingestion]
                                     |
                                     v
                           +-------------------+
             +------------>|  PENDING_DOWNLOAD |
             |             +-------------------+
             |                       | (Binary downloaded to MinIO,
             |                       |  verified SHA-256 match)
             |                       v
             |                 +-----------+
    [External Update] -------->|  SYNCED   |<------- [Reverse Push verified]
             |                 +-----------+                    ^
             |                   |       |                      |
             |  (Missing on FS)  |       | (CMS upload/replace) |
             |  +----------------+       +-------------------+  |
             |  |                                            |  |
             v  v                                            v  |
     +-------------------+                          +------------------+
     | MISSING_ON_SOURCE |                          |  PENDING_UPLOAD  |
     +-------------------+                          +------------------+
             |                                               |
             |                                               | (FS network timeout)
             |                                               v
             |                                         +-----------+
             +---------------------------------------->|   ERROR   |
                                                       +-----------+
                                                             |
                 (Concurrent uncoordinated edit)            |
                                |                            |
                                v                            |
                        +---------------+                    |
                        |   CONFLICT    |<-------------------+
                        +---------------+
```

### State Definitions & Publication Guards:

| State | Description | Eligible for New Publications? |
| :--- | :--- | :---: |
| **`SYNCED`** | Binary verified in MinIO and on File Server with matching SHA-256. | **YES (100% Ready)** |
| **`PENDING_DOWNLOAD`** | File discovered on File Server; downloading into MinIO. | **NO (HTTP 422)** |
| **`PENDING_UPLOAD`** | File uploaded/replaced in CMS; scheduled to push to File Server. | **NO (HTTP 422)** |
| **`MISSING_ON_SOURCE`** | File deleted on File Server. MinIO/POS copy preserved. | **NO (HTTP 422)** |
| **`CONFLICT`** | Concurrent edits detected on both sides. Manual resolution required. | **NO (HTTP 422)** |
| **`ERROR`** | Network or I/O error during transfer. Automated retry active. | **NO (HTTP 422)** |

---

## 3. Detailed Field Specifications

### 3.1. `FileServerConfig` Table
- `id`: UUID Primary Key.
- `protocol`: Enum `'SMB'` or `'LOCAL_MOUNT'`.
- `host`: Hostname or IP of the File Server (e.g. `'192.168.10.50'`).
- `port`: TCP Port (445 for SMB, ignored for LOCAL_MOUNT).
- `share_name`: Windows Share name (e.g. `'guestscreen'`).
- `base_path`: Relative folder inside share (e.g. `'marketing/banners'`).
- `username`: Domain or local user for SMB authentication.
- `password_encrypted`: Encrypted via Fernet/AES-256 with `GS_MASTER_KEY`.
- `domain`: Windows Active Directory domain (optional).
- `sync_interval_seconds`: Check interval (10 to 3600 seconds, default: 60).
- `deletion_policy`: `'ARCHIVE'` (default, moves to `.archive/`) or `'HARD_DELETE'`.
- `archive_subfolder`: Subfolder for archived files (default: `'.archive'`).
- `enabled`: Global toggle for background sync worker.

### 3.2. `MediaAsset` Extended Fields
- `file_server_path`: Relative path on File Server (e.g. `'breakfast/combo.jpg'`).
- `file_server_mtime`: Modification time recorded from File Server.
- `file_server_size`: File size in bytes recorded from File Server.
- `last_sync_sha256`: Cryptographic hash at last successful sync (used for loop echo suppression).
- `sync_status`: Current synchronization state (`SYNCED`, `PENDING_UPLOAD`, `PENDING_DOWNLOAD`, `CONFLICT`, `ERROR`, `MISSING_ON_SOURCE`).
- `sync_error_message`: Human-readable error trace for operator UI.
- `source_origin`: `'FILE_SERVER'` or `'CENTRAL_CONTROL_UI'`.
- `last_synced_at`: Timestamp of last verified handshake.

### 3.3. `MediaSyncConflict` Table
- `id`: UUID Primary Key.
- `media_asset_id`: FK to `media_assets.id`.
- `local_sha256`: SHA-256 of Central Control active version.
- `local_mtime`: Last update timestamp in Central Control.
- `remote_sha256`: SHA-256 of incoming File Server version.
- `remote_mtime`: Modification timestamp on File Server.
- `remote_path`: Relative path of conflicting file.
- `conflict_copy_s3_key`: MinIO path storing the File Server version (`media/conflicts/<sha256>.<ext>`).
- `status`: `'OPEN'`, `'RESOLVED_LOCAL'`, `'RESOLVED_REMOTE'`.

---

## 4. Alembic Migration Plan (`008_file_server_sync_schema`)

```python
"""file_server_sync_schema

Revision ID: 008_file_server_sync
Revises: 007_pub_ad_block_nullable
Create Date: 2026-09-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # 1. Create file_server_configs table
    op.create_table(
        'file_server_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('protocol', sa.String(20), nullable=False, server_default='SMB'),
        sa.Column('host', sa.String(255), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False, server_default='445'),
        sa.Column('share_name', sa.String(100), nullable=True),
        sa.Column('base_path', sa.String(500), nullable=False, server_default=''),
        sa.Column('username', sa.String(100), nullable=True),
        sa.Column('password_encrypted', sa.LargeBinary(), nullable=True),
        sa.Column('domain', sa.String(100), nullable=True),
        sa.Column('sync_interval_seconds', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('deletion_policy', sa.String(20), nullable=False, server_default='ARCHIVE'),
        sa.Column('archive_subfolder', sa.String(100), nullable=False, server_default='.archive'),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_sync_status', sa.String(20), nullable=False, server_default='IDLE'),
        sa.Column('last_error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 2. Add sync columns to media_assets
    op.add_column('media_assets', sa.Column('file_server_path', sa.String(500), nullable=True))
    op.add_column('media_assets', sa.Column('file_server_mtime', sa.DateTime(timezone=True), nullable=True))
    op.add_column('media_assets', sa.Column('file_server_size', sa.BigInteger(), nullable=True))
    op.add_column('media_assets', sa.Column('last_sync_sha256', sa.String(64), nullable=True))
    op.add_column('media_assets', sa.Column('sync_status', sa.String(30), nullable=False, server_default='SYNCED'))
    op.add_column('media_assets', sa.Column('sync_error_message', sa.Text(), nullable=True))
    op.add_column('media_assets', sa.Column('source_origin', sa.String(30), nullable=False, server_default='CENTRAL_CONTROL_UI'))
    op.add_column('media_assets', sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True))
    
    op.create_index('ix_media_assets_file_server_path', 'media_assets', ['file_server_path'])
    op.create_index('ix_media_assets_sync_status', 'media_assets', ['sync_status'])

    # 3. Create media_sync_conflicts table
    op.create_table(
        'media_sync_conflicts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('media_asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('media_assets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('local_sha256', sa.String(64), nullable=False),
        sa.Column('local_mtime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('remote_sha256', sa.String(64), nullable=False),
        sa.Column('remote_mtime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('remote_path', sa.String(500), nullable=False),
        sa.Column('conflict_copy_s3_key', sa.String(255), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='OPEN'),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True)
    )
```

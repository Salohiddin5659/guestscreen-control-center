# Quickstart & Verification Guide: Media File Server Synchronization

**Feature Identifier**: `002-media-file-server-sync`  
**Target Environment**: Dedicated Host `10.0.0.111` (100% Docker Stack)  
**Dedicated Cashier**: `10.0.0.241` (Physical POS Monoblock, UCS Guest Screen)  

---

## 1. Prerequisites & Test Infrastructure Setup (`10.0.0.111`)

All services run exclusively inside Docker Compose on `10.0.0.111`.

### 1.1. Provision Test Samba Container (`test_samba`)
Add test SMB service to `deploy/docker-compose.yml` for isolated on-host validation:

```yaml
  test_samba:
    image: dperson/samba:latest
    container_name: gs_test_samba
    environment:
      USERID: "0"
      GROUPID: "0"
    command: >
      -u "smbuser;pass123"
      -s "guestscreen;/share;yes;no;no;smbuser;none;smbuser"
    volumes:
      - deploy_test_smb_share:/share
    networks:
      gs_network:
        aliases:
          - test-samba
    restart: unless-stopped

volumes:
  deploy_test_smb_share:
    name: deploy_test_smb_share
```

Deploy the updated stack:
```bash
docker compose -f /opt/gs-control-center/deploy/docker-compose.yml up -d test_samba
```

---

## 2. Validation Scenarios

### Scenario 1: SMB Connection & Health Probe
**Goal**: Verify SMB authentication and round-trip read/write probe.

1. Configure connection:
   ```bash
   curl -s -X PUT http://10.0.0.111:8088/api/v1/file-server/config \
     -H "Content-Type: application/json" \
     -d '{
       "protocol": "SMB",
       "host": "test-samba",
       "port": 445,
       "share_name": "guestscreen",
       "base_path": "marketing",
       "username": "smbuser",
       "password": "pass123",
       "sync_interval_seconds": 30,
       "deletion_policy": "ARCHIVE",
       "enabled": true
     }'
   ```
2. Test connection:
   ```bash
   curl -s -X POST http://10.0.0.111:8088/api/v1/file-server/test-connection
   ```
   *Expected Output*: `{"success": true, "can_read": true, "can_write": true, "latency_ms": <50}`.

---

### Scenario 2: Initial Full Reconciliation (50+ Files Drop)
**Goal**: Verify mass discovery, streaming hashing, MinIO ingestion, deduplication, and zero ghost sync.

1. Drop 50 images into the test share:
   ```bash
   docker exec gs_test_samba mkdir -p /share/marketing
   docker exec gs_test_samba python3 -c "
   import os
   for i in range(50):
       with open(f'/share/marketing/banner_{i:02d}.jpg', 'wb') as f:
           f.write(b'\xFF\xD8\xFF' + os.urandom(1024 * (i + 10)))
   "
   ```
2. Trigger on-demand reconciliation:
   ```bash
   curl -s -X POST http://10.0.0.111:8088/api/v1/media-sync/reconcile
   ```
3. Verify status:
   ```bash
   curl -s http://10.0.0.111:8088/api/v1/media-sync/status
   ```
   *Expected Outcome*: `synced_count: 50`, `error_count: 0`, `conflict_count: 0`. All 50 assets have matching SHA-256 in PostgreSQL and MinIO.

---

### Scenario 3: Reverse Sync (Central Control $\rightarrow$ File Server)
**Goal**: Verify files uploaded via Web UI are pushed to File Server with matching checksums.

1. Upload a file via API:
   ```bash
   curl -s -X POST http://10.0.0.111:8088/api/v1/media \
     -F "file=@/opt/gs-control-center/tests/fixtures/new_banner.png"
   ```
2. Inspect test Samba share:
   ```bash
   docker exec gs_test_samba ls -la /share/marketing/new_banner.png
   ```
3. Compare SHA-256:
   ```bash
   docker exec gs_test_samba sha256sum /share/marketing/new_banner.png
   ```
   *Expected Outcome*: Remote SHA-256 is bit-for-bit identical to the Central Control asset record; sync status is `SYNCED`.

---

### Scenario 4: Loop Prevention (Echo Suppression)
**Goal**: Verify that reverse-synced files do NOT trigger a reverse ingestion event on the next scan.

1. Allow incremental sync to run after Scenario 3.
2. Check `audit_logs`:
   ```sql
   SELECT action, details FROM audit_logs WHERE action LIKE 'SYNC_%' ORDER BY created_at DESC LIMIT 5;
   ```
   *Expected Outcome*: Exactly 1 `SYNC_FILE_PUSH` entry; **0** `SYNC_FILE_INGEST` entries for `new_banner.png`.

---

### Scenario 5: External In-Place Replace & OCC Version Bump
**Goal**: Overwriting a file on the File Server updates MinIO and bumps version; cashiers continue playing old snapshot.

1. Overwrite `new_banner.png` on the share:
   ```bash
   docker exec gs_test_samba sh -c "echo 'NEW_CONTENT' >> /share/marketing/new_banner.png"
   ```
2. Wait 30 seconds for incremental sync.
3. Inspect `media_assets`:
   *Expected Outcome*: `version` incremented from `1` to `2`; new `sha256` recorded; new binary stored in MinIO; `sync_status = SYNCED`.

---

### Scenario 6: File Server Deletion & Publication Safety
**Goal**: Deletion on File Server flags `MISSING_ON_SOURCE`, preserves MinIO and POS, and blocks new publications.

1. Delete file on share:
   ```bash
   docker exec gs_test_samba rm /share/marketing/new_banner.png
   ```
2. Wait 30 seconds for incremental sync.
3. Inspect asset:
   *Expected Outcome*: `sync_status = 'MISSING_ON_SOURCE'`. MinIO object intact.
4. Attempt to publish a template referencing this asset:
   *Expected Outcome*: API returns `HTTP 422 Unprocessable Entity` ("Cannot publish template: Media asset new_banner.png is MISSING_ON_SOURCE on File Server").

---

### Scenario 7: Concurrent Two-Way Conflict & Interactive Resolution
**Goal**: Simultaneous edits trigger `CONFLICT`, preserve both versions, and resolve via UI.

1. Disconnect sync worker or pause File Server.
2. In Central Control, perform replace on `banner_01.jpg`.
3. On File Server, modify `banner_01.jpg` with different bytes.
4. Resume sync.
5. Inspect conflicts:
   ```bash
   curl -s http://10.0.0.111:8088/api/v1/media-sync/conflicts
   ```
   *Expected Outcome*: Status is `CONFLICT`. Both versions preserved.
6. Resolve conflict:
   ```bash
   curl -s -X POST http://10.0.0.111:8088/api/v1/media-sync/conflicts/<conflict_id>/resolve \
     -H "Content-Type: application/json" \
     -d '{"action": "KEEP_CENTRAL_CONTROL"}'
   ```
   *Expected Outcome*: Central Control version overwrites File Server; asset status returns to `SYNCED`.

---

### Scenario 8: Cashier Publication Zero-Touch Validation (`10.0.0.241`)
**Goal**: Publish verified template to live POS terminal; verify pure MinIO streaming, zero File Server requests, zero POS corruption.

1. Dispatch publication batch for `FULL_SCREEN` area to cashier `10.0.0.241`.
2. Monitor cashier:
   - `LicensesCount`: 1 (Unchanged)
   - `ScreensCount`: 1 (Unchanged)
   - `SettingsCount`: 57 (Unchanged)
   - `OrphanHexLen`: 772 (Unchanged)
   - `GuestScreenPid`: 8824 (Continuous running)
   - Binary transferred strictly from MinIO via SSH to `C:\UCS\GuestScreen\Front\media\uploads\`.

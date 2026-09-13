# Quickstart & Operational Validation Guide: GS Control Center

**Feature**: GS Control Center (`001-gs-control-center`)  
**Host Target**: Dedicated Server `10.0.0.111` (Docker Compose)  
**Test POS Node**: Monoblock `10.0.0.241`  
**Content Model**: `Advertising Block` → `Area` → `Display Mode` → `Media Items (Playlist)`  
**Timezone**: `Asia/Tashkent`  

---

## 1. System Architecture Overview on Host `10.0.0.111`

The central management system is fully encapsulated inside Docker Compose. Zero host dependencies outside of Docker Engine and Docker Compose.

```text
[Host 10.0.0.111]
 ├── reverse_proxy (Nginx, Ports 80 / 443)
 ├── web_ui        (React Static SPA served via Nginx)
 ├── backend_api   (FastAPI / Python 3.12, Internal Port 8000)
 ├── worker_pool   (ARQ AsyncIO Workers for SSH push orchestration)
 ├── postgres_db   (PostgreSQL 16, Port 5432, Named Volume: pgdata)
 ├── redis_queue   (Redis 7 Alpine, Named Volume: redisdata)
 └── minio_s3      (MinIO Object Storage, Port 9000 / 9001, Volume: miniodata)
```

---

## 2. Server Deployment & Initialization on `10.0.0.111`

### 2.1 Configuration & Secrets Setup
On server `10.0.0.111`, secrets are injected via `.env` or Docker secrets (never committed to Git):
```bash
# Generated environment variables on 10.0.0.111
POSTGRES_DB=gs_control_center
POSTGRES_USER=gs_admin
POSTGRES_PASSWORD=<SECURE_POSTGRES_PASSWORD>

MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=<SECURE_MINIO_PASSWORD>

JWT_SECRET_KEY=<SECURE_JWT_SECRET>
CREDENTIAL_ENCRYPTION_KEY=<32_BYTE_HEX_KEY>

# Corporate SSH Key for 200+ POS monoblocks (Base64-encoded in env)
SSH_MASTER_PRIVATE_KEY_B64=<BASE64_ED25519_PRIVATE_KEY>
```

### 2.2 Starting the Stack
```bash
docker compose -f docker-compose.yml up -d
```

### 2.3 Health Verification
```bash
docker compose ps
curl -f http://127.0.0.1/api/v1/dashboard/overview
```

---

## 3. End-to-End Validation Runbook on Test Node `10.0.0.241`

The following test suites prove the entire pipeline functions across all business content types while strictly maintaining license and display immutability.

### Test Suite 1: Pre-Flight Terminal Inspection
- In Web UI, navigate to **Cash Registers** $\rightarrow$ Click **"Test Connection"** on `10.0.0.241`.
- **Expected Outcome**:
  - TCP Port 22 responds in $< 50$ ms.
  - SSH key authentication succeeds.
  - Verifies `C:\UCS\GuestScreen\gs.db` exists.
  - Verifies disk space $> 200$ MB free.

---

### Test Suite 2: `FULL_SCREEN` + `STATIC` Deployment
1. Navigate to **Media Library** $\rightarrow$ Upload a high-resolution 1024×768 banner (`banner_static.jpg`).
2. Navigate to **Advertising Blocks** $\rightarrow$ Click **Create Block**:
   - Name: `Standby Static Promo`
   - Area: `FULL_SCREEN`
   - Display Mode: `STATIC`
   - Select `banner_static.jpg` (Playlist contains exactly 1 item).
3. Dispatch publication to `10.0.0.241`.
4. **Verification**:
   - Media file arrives in `C:\UCS\GuestScreen\Front\media\uploads\<sha256>.jpg`.
   - SQLite table `scenes` updates GUID `2509359c-2d71-4344-9be4-7d90dd453083` with new filename.
   - `licenses` and `screens` tables have **zero bytes altered** (identical checksums).
   - Customer screen renders the static banner.

---

### Test Suite 3: `FULL_SCREEN` + `SLIDESHOW` (Reordering & Interval Test)
1. Upload 3 distinct promotional banners (`slide1.jpg`, `slide2.jpg`, `slide3.jpg`).
2. Create Advertising Block / Template:
   - Name: `Standby 3-Slide Gallery`
   - Area: `FULL_SCREEN`
   - Display Mode: `SLIDESHOW`
   - Add all 3 images to playlist.
   - Reorder items in UI: `[slide2, slide3, slide1]`.
   - Change display interval from default 7s to `5` seconds.
3. Preview slideshow in Web UI player modal (1024×768 simulation with autoplay and Next/Prev controls).
4. Dispatch publication to `10.0.0.241`.
5. **Verification**:
   - All 3 images arrive in `Front\media\uploads\<sha256>.<ext>`.
   - Fullscreen scene `2509359c-2d71-4344-9be4-7d90dd453083` updates `type: "gallery"`, sets ordered frames array and `interval: 5000`.
   - Terminal smoothly rotates slides every 5 seconds.
   - `68906ed2...` (MODE32) and `fad6349b...` (orphan) are **not touched**.

---

### Test Suite 4: `MODE32_PROMO` + `STATIC` Deployment
1. Upload a 512×768 promotional graphic (`promo_fries_512x768.png`).
2. Create Advertising Block / Template:
   - Name: `Order Screen Static Fries Promo`
   - Area: `MODE32_PROMO`
   - Display Mode: `STATIC`
   - Add `promo_fries_512x768.png`.
3. Dispatch publication to `10.0.0.241`.
4. **Verification**:
   - Promo scene `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3` updates with `type: "image"` and new image filename.
   - Orphan scene `fad6349b-3aaa-43e2-82c7-ba12abfc1463` has **zero writes**.
   - Left-side receipt check scene (`255dc54c-70ea-465d-8b2c-d9d8b0ad63a4`) remains **100% untouched**.
   - No r_keeper `lastCode` or dish conditions are altered.

---

### Test Suite 5: `MODE32_PROMO` + `SLIDESHOW` (Multi-Image Rotation)
1. Upload two 512×768 promotional graphics (`drink_promo.jpg`, `dessert_promo.jpg`).
2. Create Advertising Block / Template:
   - Name: `Order Screen Upsell Slideshow`
   - Area: `MODE32_PROMO`
   - Display Mode: `SLIDESHOW`
   - Add both images; set interval to `4` seconds.
3. Dispatch publication to `10.0.0.241`.
4. **Verification**:
   - Promo scene `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3` dynamically switches to `type: "gallery"`.
   - Right half of display rotates between drinks and desserts during order entry.

---

### Test Suite 6: Mixed Image/Video Slideshow (Validation Required)
1. Attempt creating a slideshow containing 1 image and 1 video.
2. System flags this as `VALIDATION REQUIRED / TBD`.
3. Run test against `10.0.0.241` to check if CefSharp's gallery scene accepts mixed frames. Document findings.

---

### Test Suite 7: Surgical Rollback Verification
1. Simulate a failed update (e.g. inject invalid JSON or simulate lock timeout).
2. **Verification**:
   - The adapter executes **Tier 1 Surgical Rollback**: writes back the preserved `scenes.Raw` value from memory.
   - Confirms that any r_keeper order checks created during the test are **not** wiped out.
   - Terminal status marks `FAILED`; diagnostic trace recorded in PostgreSQL audit logs.

---

### Test Suite 8: Idempotency Verification
1. Immediately re-dispatch the exact same publication to `10.0.0.241`.
2. **Verification**:
   - Worker computes Idempotency Key, queries cashier read-only in $< 500$ ms, confirms hash match, skips file re-upload, and marks `SUCCESS`.

---

### Test Suite 9: Media Safe Deletion & S3 RefCount Verification
1. Attempt deleting a media asset referenced in an active template (`DELETE /api/v1/media/{id}`).
   - **Verification**: Server rejects with `HTTP 409 Conflict`, listing dependent templates. File remains in MinIO and DB.
2. Remove media asset from template and retry deletion (`usage == 0`).
   - **Verification**: Record removed from PostgreSQL; physical file deleted from MinIO **only if** reference count across all media records and publication snapshots equals 0.

---

### Test Suite 10: Optimistic Concurrency Control (OCC) Verification
1. Open template in two separate browser tabs (both have `version = 1`).
2. Save changes in Tab 1 (`version` increments to `2`).
3. Attempt saving changes in Tab 2 with stale `version = 1`.
   - **Verification**: Server rejects with `HTTP 409 Conflict`: `"Объект был изменен другим пользователем. Обновите страницу перед сохранением"`. Stale edits are not overwritten.

---

### Test Suite 11: Decoupled Cashier Autonomy & Immutable Snapshot
1. Publish template `"Летняя акция"` to `10.0.0.241` (`content_snapshot_json` recorded).
2. Delete or edit template `"Летняя акция"` in the Web UI CMS.
   - **Verification**: Cashier `10.0.0.241` continues displaying the published media from its local `gs.db` uninterrupted. Zero remote tasks or purges sent to the cashier.
3. Trigger "Retry Failed Only" on a historical batch.
   - **Verification**: Worker uses the immutable `content_snapshot_json` from the batch record, completely isolated from subsequent CMS mutations.

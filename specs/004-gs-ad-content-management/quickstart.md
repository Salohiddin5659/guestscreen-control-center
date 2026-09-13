# Quickstart Validation Guide: Centralized Advertising Content Management for UCS GuestScreen

**Feature**: `004-gs-ad-content-management`  
**Target Dedicated Test Cashbox**: `10.0.0.241` (UCS GuestScreen 3.1.1.0)  
**Central Server Host**: `10.0.0.111`  
**Spec Reference**: [spec.md](./spec.md) | [data-model.md](./data-model.md) | [contracts/api.yaml](./contracts/api.yaml)

---

## 1. Prerequisites & Environment Setup

1. **Python 3.13 Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
   pip install fastapi uvicorn sqlalchemy asyncpg asyncssh cryptography pydantic-settings
   ```

2. **Master Encryption Key Setup**:
   Generate a 32-byte hexadecimal key:
   ```bash
   export APP_MASTER_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
   export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/guestscreen_ads"
   export MEDIA_STORAGE_DIR="/var/lib/guestscreen/media"
   ```

3. **Start Central API Server**:
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 2. End-to-End Validation Scenarios

### Scenario 1: Upload Media & Validate Metadata
Upload a Full Screen advertising banner (`1024x768.jpg`):
```bash
curl -X POST http://localhost:8000/api/v1/media \
  -F "file=@tests/fixtures/banner_1024x768.jpg"
```
**Expected Outcome**: HTTP 201 Created with JSON containing `id`, `sha256_hash`, `width: 1024`, `height: 768`.

---

### Scenario 2: Register Test Cashbox `10.0.0.241`
```bash
# 1. Create SSH Credential
CRED_ID=$(curl -s -X POST http://localhost:8000/api/v1/credentials \
  -H "Content-Type: application/json" \
  -d '{"name": "Cashier Test Key", "auth_type": "PASSWORD", "username": "Administrator", "secret": "Secret123"}' | jq -r .id)

# 2. Register Cashbox
CASHBOX_ID=$(curl -s -X POST http://localhost:8000/api/v1/cashboxes \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Cashbox 241\", \"ip_address\": \"10.0.0.241\", \"ssh_credential_id\": \"$CRED_ID\", \"group_id\": \"$GROUP_ID\"}" | jq -r .id)
```

---

### Scenario 3: Deploy FULL SCREEN Static Banner
```bash
# 1. Create Configuration
CONFIG_ID=$(curl -s -X POST http://localhost:8000/api/v1/configurations \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Autumn Sale Full\", \"mode\": \"FULL_SCREEN\", \"content_type\": \"STATIC\", \"media_asset_id\": \"$MEDIA_ID\"}" | jq -r .id)

# 2. Enqueue Deployment
DEP_ID=$(curl -s -X POST http://localhost:8000/api/v1/deployments \
  -H "Content-Type: application/json" \
  -d "{\"cashbox_id\": \"$CASHBOX_ID\", \"full_configuration_id\": \"$CONFIG_ID\"}" | jq -r .id)
```
**Verification**:
- Inspect deployment progress: `GET /api/v1/deployments/{DEP_ID}`
- Transitions: `PENDING` → `RUNNING` → `VERIFYING` → `SUCCESS`.
- Physical check on `10.0.0.241`: secondary display `\\.\DISPLAY2` displays the banner without window flicker or process restart.

---

### Scenario 4: Verify Idempotency (NO-OP)
Trigger deployment of the exact same configuration version to `10.0.0.241`:
```bash
curl -X POST http://localhost:8000/api/v1/deployments \
  -H "Content-Type: application/json" \
  -d "{\"cashbox_id\": \"$CASHBOX_ID\", \"full_configuration_id\": \"$CONFIG_ID\"}"
```
**Expected Outcome**: Returns status `NO_OP` in under 1 second. Zero bytes transferred over SFTP; no SQLite update executed.

---

### Scenario 5: Deploy 50/50 Dynamic Slideshow During Active Order
```bash
# 1. Create Playlist with 2 items and 7-second interval
PLAYLIST_ID=$(curl -s -X POST http://localhost:8000/api/v1/playlists \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Upsell Drinks\", \"display_type\": \"SPLIT_50_50\", \"default_interval_sec\": 7, \"items\": [{\"media_asset_id\": \"$M1\", \"sort_order\": 0}, {\"media_asset_id\": \"$M2\", \"sort_order\": 1}]}" | jq -r .id)

# 2. Create 50/50 Configuration
SPLIT_CONFIG_ID=$(curl -s -X POST http://localhost:8000/api/v1/configurations \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Upsell Split\", \"mode\": \"SPLIT_50_50\", \"content_type\": \"DYNAMIC\", \"playlist_id\": \"$PLAYLIST_ID\"}" | jq -r .id)

# 3. Deploy
curl -X POST http://localhost:8000/api/v1/deployments \
  -H "Content-Type: application/json" \
  -d "{\"cashbox_id\": \"$CASHBOX_ID\", \"split_configuration_id\": \"$SPLIT_CONFIG_ID\"}"
```
**Verification**: Right half rotates items every 7 seconds. Left half (receipt) is completely unaffected.
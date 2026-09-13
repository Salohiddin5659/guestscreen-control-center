# GS Control Center: REST API & Integration Reference

## 1. Base URL & Authentication
- **Base URL**: `http://10.0.0.111:8088/api/v1`
- **Interactive Documentation**: Swagger UI at `http://10.0.0.111:8088/docs` | ReDoc at `http://10.0.0.111:8088/redoc`
- **Authentication**: Bearer JWT token obtained via `POST /api/v1/auth/login`.

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates an administrator or operator and returns an access token.
```json
// Request
{
  "username": "admin",
  "password": "Admin@GS2026!"
}

// Response (200 OK)
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "f0e0851c-7bb8-4b11-ad77-e44b66a54df7",
    "username": "admin",
    "full_name": "GS Administrator",
    "role": "ADMINISTRATOR"
  }
}
```

### `GET /api/v1/auth/me`
Returns current user profile.

---

## 3. Media Assets Endpoints

### `GET /api/v1/media`
Lists media assets. Query parameter `media_type`: `IMAGE` | `VIDEO`.

### `POST /api/v1/media/upload`
Uploads a new media file (multipart/form-data with key `file`). Computes SHA-256 and validates dimensions (1024x768 for Full Screen, 512x768 for Mode 32).

### `DELETE /api/v1/media/{id}`
Soft-deletes a media asset. Fails with HTTP 409 if referenced by active advertising blocks.

---

## 4. Advertising Blocks Endpoints

### `GET /api/v1/ad-blocks`
Lists advertising blocks. Query parameters: `area` (`FULL_SCREEN` | `MODE32_PROMO`), `is_active` (`true` | `false`).

### `POST /api/v1/ad-blocks`
Creates a new block with its ordered playlist items.
```json
{
  "name": "Тестовый баннер",
  "description": "Описание промо",
  "area": "FULL_SCREEN",
  "display_mode": "STATIC",
  "items": [
    {
      "media_asset_id": "322e5bc8-9ce4-4574-a279-95c771a7c233",
      "order_index": 0,
      "duration_seconds": 10
    }
  ]
}
```

### `GET /api/v1/ad-blocks/{id}`
Fetches block details with ordered playlist.

### `PUT /api/v1/ad-blocks/{id}`
Updates block metadata and replaces playlist items atomically.

---

## 5. Publications & Orchestration Endpoints

### `POST /api/v1/publications`
Dispatches a publication batch to selected scope.
```json
{
  "advertising_block_id": "9ffa4a7c-bdde-4274-a78d-6d06aa6b904d",
  "scope_type": "CUSTOM_CASHIERS",
  "scope_target_ids": ["d12ed6b3-9908-4691-a199-b4fcc73926b2"]
}
```

### `GET /api/v1/publications`
Lists publication history with success/failure counters.

### `GET /api/v1/publications/{id}`
Returns granular cashier-level progress and attempt logs.

### `POST /api/v1/publications/{id}/retry-failed`
Re-enqueues only `FAILED` or `OFFLINE` cashier jobs within the batch.

---

## 6. Real-Time Events (Server-Sent Events)

### `GET /api/v1/events/publications/{batch_id}`
Real-time SSE stream providing instantaneous progress updates as jobs complete.
```
event: job_update
data: {"batch_id": "...", "cashier_id": "...", "status": "SUCCESS", "counters": {"total": 1, "success": 1, "failed": 0}}
```

---

## 7. Topology Endpoints

### `GET /api/v1/regions` | `POST /api/v1/regions`
Regional hierarchy management.

### `GET /api/v1/branches` | `POST /api/v1/branches`
Branch management with maintenance window configuration.

### `GET /api/v1/cashiers` | `POST /api/v1/cashiers`
Cashier terminal fleet management.

### `POST /api/v1/cashiers/{id}/test-connection`
Executes SSH pre-flight inspection and returns terminal health status.

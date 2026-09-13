# GS Control Center: Dedicated Host 10.0.0.111 Deployment & Disaster Recovery Guide

## 1. Host Requirements & Architecture
- **Host OS**: Ubuntu Linux 24.04 LTS (x86_64) on dedicated server `10.0.0.111`.
- **Runtime**: Docker 29.7.2 + Docker Compose v5.5.0.
- **Reverse Proxy Port**: Free port `8088:80` (avoids conflict with existing host services on ports 80, 443, 8080, 8081).
- **Directory Root**: `/opt/gs-control-center/`.

---

## 2. Production Services Stack

| Container | Image | Purpose | Port / Health |
| :--- | :--- | :--- | :--- |
| `gs_reverse_proxy` | `nginx:alpine` | Reverse proxy & static assets | `8088:80` (Healthy) |
| `gs_backend_api` | Custom Python 3.12 | FastAPI REST API & SSE Server | `8000` internal (Healthy) |
| `gs_worker_pool` | Custom Python 3.12 | ARQ AsyncIO SSH Orchestrator | Internal worker |
| `gs_postgres_db` | `postgres:16-alpine` | Central relational database | `5432` internal (Healthy) |
| `gs_redis_queue` | `redis:7-alpine` | Worker job queue & SSE bus | `6379` internal (Healthy) |
| `gs_minio_s3` | `minio/minio:latest` | S3 Media Asset object store | `9000` / `9001` (Healthy) |
| `gs_frontend_ui` | Custom Nginx + Vite | React 18 Admin Dashboard | `80` internal |

---

## 3. Deployment & Operational Commands

### Starting the Stack
```bash
cd /opt/gs-control-center/deploy
docker compose up -d
```

### Checking Status
```bash
docker compose ps
docker compose logs -f backend_api worker_pool
```

### Running Database Migrations
```bash
docker exec -w /app/src/backend gs_backend_api alembic upgrade head
```

### Running Automated Test Suite
```bash
docker exec -w /app/src/backend gs_backend_api pytest tests/ -v
```

---

## 4. Secrets & Environment Configuration
Secrets are stored exclusively in `/opt/gs-control-center/deploy/.env` (permissions `0600`, never committed to git):

```env
POSTGRES_DB=gs_control_center
POSTGRES_USER=gs_admin
POSTGRES_PASSWORD=<generated_secure_password>
DATABASE_URL=postgresql+asyncpg://gs_admin:<password>@postgres_db:5432/gs_control_center

REDIS_URL=redis://redis_queue:6379/0

MINIO_ENDPOINT=minio:9000
MINIO_PUBLIC_URL=http://10.0.0.111:9000
MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=<generated_secure_password>
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=<generated_secure_password>
MINIO_BUCKET_MEDIA=media

WEB_PORT=8088
CASHIER_FALLBACK_PASSWORD=123
```

---

## 5. Backup & Disaster Recovery Procedures

### 5.1 Central PostgreSQL Database Backup
```bash
docker exec -t gs_postgres_db pg_dump -U gs_admin gs_control_center | gzip > /opt/gs-control-center/backups/pg_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 5.2 PostgreSQL Database Restore
```bash
gunzip < /opt/gs-control-center/backups/pg_<timestamp>.sql.gz | docker exec -i gs_postgres_db psql -U gs_admin -d gs_control_center
```

### 5.3 Cashier Terminal Tier 2 Disaster Restore
If a monoblock encounters local storage corruption, restore the pre-publication snapshot:
```powershell
Copy-Item 'C:\UCS\GuestScreen\gs.db.bak_<timestamp>' 'C:\UCS\GuestScreen\gs.db' -Force
```

# GuestScreen Control Center

<div align="center">

![GuestScreen](https://img.shields.io/badge/GuestScreen-Control%20Center-00A9DF?style=for-the-badge&logo=monitor&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)

**Multi-tenant web management dashboard for GuestScreen 2nd-screen POS systems**

[🚀 Quick Install](#-quick-install) • [📖 Documentation](#-architecture) • [⚙️ Manual Setup](#️-manual-setup) • [🔗 Download](#-download--deploy)

</div>

---

## 🔗 Download & Deploy

| Resource | Link |
|---|---|
| **Source Code** | [github.com/Salohiddin5659/guestscreen-control-center](https://github.com/Salohiddin5659/guestscreen-control-center) |
| **Download ZIP** | [⬇️ Download main.zip](https://github.com/Salohiddin5659/guestscreen-control-center/archive/refs/heads/main.zip) |
| **Install Script** | [install.sh](https://raw.githubusercontent.com/Salohiddin5659/guestscreen-control-center/main/install.sh) |
| **Clone** | `git clone https://github.com/Salohiddin5659/guestscreen-control-center.git` |

---

## 🚀 Quick Install

**One-line install on a fresh Ubuntu/Debian server:**

```bash
curl -fsSL https://raw.githubusercontent.com/Salohiddin5659/guestscreen-control-center/main/install.sh | sudo bash
```

This will:
- Install Docker, Node.js, PostgreSQL
- Build and deploy the frontend
- Set up **two independent GuestScreen servers** (ports 8101 and 8102)
- Create systemd services for auto-restart
- Open firewall ports

**Custom ports:**
```bash
curl -fsSL https://raw.githubusercontent.com/Salohiddin5659/guestscreen-control-center/main/install.sh | sudo bash -s -- --port1 8101 --port2 8102
```

After install, open:
- **Server 1:** `http://YOUR_SERVER_IP:8101`
- **Server 2:** `http://YOUR_SERVER_IP:8102`

Default credentials: `admin` / `Admin@GS2026!` *(change immediately!)*

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Browser (Admin / Operator)              │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP
          ┌──────────────────┴──────────────────┐
          │                                     │
    ┌─────▼──────────┐                  ┌───────▼────────┐
    │ Node.js :8101  │                  │ Node.js :8102  │
    │ Oqtepa Lavash  │                  │   Milly        │
    │ (Tenant 1)     │                  │ (Tenant 2)     │
    └────────────────┘                  └────────────────┘
          │ /api/v1                           │ /api/v1
    ┌─────▼──────────┐                  ┌────▼───────────┐
    │ FastAPI :8000  │                  │ FastAPI :8001  │
    │ PostgreSQL 16  │                  │ PostgreSQL 16  │
    │ Redis          │                  │ Redis          │
    └────────────────┘                  └────────────────┘
          │ SSH                               │ SSH
    ┌─────▼─────────────────────────────────▼──────────┐
    │           POS Cashier Fleet (IP Range)            │
    │   Cashier 1      Cashier 2      Cashier N         │
    │  10.0.0.x       10.0.0.x       10.0.0.x          │
    └────────────────────────────────────────────────────┘
```

### Key Features

- **Multi-tenant** — Two independent servers from one codebase, brand detected by port at runtime
- **Liquid Glass UI** — Dark-mode dashboard with real-time device fleet monitoring
- **Role-based access**:
  - `ADMINISTRATOR` — Full access, all technical details
  - `SUPERVISOR` — Read/write, sees technical info
  - `OPERATOR` — Minimal view (branch name, version, IP, status only — no hashes)
  - `AUDITOR` — Read-only
- **Live fleet sync** — WebSocket-based real-time cashier status (online/offline/error)
- **SSH connectivity test** — Ping any cashier directly from the dashboard
- **Content deployment** — Publish ad blocks (FULL screen / 50-50 mode) to individual cashiers or groups
- **Branding per tenant** — Dynamic logo/name/favicon per server port

---

## 📁 Project Structure

```
guestscreen-control-center/
├── src/
│   ├── backend/          # FastAPI (Python 3.12)
│   │   ├── app/          # API routes, models, services
│   │   ├── migrations/   # Alembic DB migrations
│   │   └── requirements.txt
│   ├── frontend/         # React 18 + TypeScript + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── pages/    # DevicesView, RestaurantsView, Login, etc.
│   │   │   ├── components/
│   │   │   └── utils/brand.ts  # Multi-tenant brand detection
│   │   └── public/       # Brand assets (logos, favicons)
│   └── workers/          # ARQ background job workers
├── deploy/
│   ├── production_server/ # Node.js static + API proxy server
│   │   ├── server.js
│   │   └── docker-compose.yml
│   ├── docker/           # Dockerfiles
│   ├── nginx/            # Nginx configs
│   └── sql/schema.sql    # Initial DB schema
└── install.sh            # One-line auto-installer
```

---

## ⚙️ Manual Setup

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- Docker 24+
- Node.js 20+
- PostgreSQL 16+
- Python 3.12+

### Step 1: Clone

```bash
git clone https://github.com/Salohiddin5659/guestscreen-control-center.git
cd guestscreen-control-center
```

### Step 2: Build Frontend

```bash
cd src/frontend
npm install
npm run build
# dist/ will be generated
```

Or with Docker (recommended):
```bash
docker run --rm -v $(pwd)/src/frontend:/app -w /app node:20-alpine sh -c "npm ci && npm run build"
```

### Step 3: Setup Database

```bash
# Start PostgreSQL
docker run -d \
  --name guestscreen_db \
  -e POSTGRES_USER=guestscreen \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=guestscreen_db \
  -p 5433:5432 \
  postgres:16-alpine

# Apply schema
docker exec -i guestscreen_db psql -U guestscreen -d guestscreen_db < deploy/sql/schema.sql
```

### Step 4: Start Servers

```bash
# Server 1 (port 8101)
cp -r src/frontend/dist/* /opt/guestscreen-server/public/
cp -r deploy/production_server/* /opt/guestscreen-server/
cd /opt/guestscreen-server && PORT=8101 DATABASE_URL=postgresql://guestscreen:password@localhost:5433/guestscreen_db node server.js

# Server 2 (port 8102) - second tenant
cp -r src/frontend/dist/* /opt/guestscreen-server-8102/public/
PORT=8102 DATABASE_URL=postgresql://guestscreen:password@localhost:5434/guestscreen_db2 node /opt/guestscreen-server-8102/server.js
```

### Step 5: Backend (FastAPI)

```bash
cd src/backend
pip install -r requirements.txt
cp .env.example .env  # Edit .env with your database URL
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🎨 Multi-Tenant Branding

Brand is detected at runtime in [`src/frontend/src/utils/brand.ts`](src/frontend/src/utils/brand.ts):

```typescript
// Port 8102 → Milly brand
// All other ports → Oqtepa Lavash brand
export function getBrand(): Brand {
  const port = window.location.port;
  return port === '8102' ? MILLY : OQTEPA_LAVASH;
}
```

To add a new tenant:
1. Add brand config in `brand.ts`
2. Add logo assets to `src/frontend/public/`
3. Deploy a new server instance on a new port

---

## 🔐 Security Notes

- Change default admin password immediately after install
- Operators see **minimal info only** — no GuestScreen version hashes, no content block details
- SSH credentials for cashiers are stored **encrypted** in the database
- All mutations require `ADMINISTRATOR` or `SUPERVISOR` role

---

## 📋 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | HTTP port for Node.js server | `8101` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5433/db` |
| `SECRET_KEY` | JWT signing key | `random-32-hex-string` |

---

## 📄 License

MIT License — see [LICENSE.txt](LICENSE.txt)

---

<div align="center">
Made with ❤️ for GuestScreen fleet management
</div>

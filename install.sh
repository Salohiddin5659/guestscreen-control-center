#!/bin/bash
# =============================================================================
# GuestScreen Control Center — Auto-Install Script
# =============================================================================
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Salohiddin5659/guestscreen-control-center/main/install.sh | bash
#   OR
#   bash install.sh [--port1 8101] [--port2 8102] [--domain yourdomain.com]
#
# Requirements: Ubuntu 20.04+ / Debian 11+, Docker, Docker Compose v2
# =============================================================================

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${BLUE}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}>>> $*${RESET}"; }

# ─── Defaults ─────────────────────────────────────────────────────────────────
PORT1=8101          # Server 1 (Oqtepa Lavash / Tenant 1)
PORT2=8102          # Server 2 (Milly / Tenant 2)
INSTALL_DIR1="/opt/guestscreen-server"
INSTALL_DIR2="/opt/guestscreen-server-${PORT2}"
REPO_URL="https://github.com/Salohiddin5659/guestscreen-control-center"
BRANCH="main"
PG_PASSWORD="GuestScreen_PG_$(openssl rand -hex 8)"
SECRET_KEY="$(openssl rand -hex 32)"

# ─── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port1) PORT1="$2"; shift 2 ;;
    --port2) PORT2="$2"; shift 2 ;;
    --dir1)  INSTALL_DIR1="$2"; shift 2 ;;
    --dir2)  INSTALL_DIR2="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    *) warn "Unknown arg: $1"; shift ;;
  esac
done

# ─── Banner ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
cat << 'BANNER'
  ____                 _  ____
 / ___|_   _  ___  ___| |/ ___|  ___ _ __ ___  ___ _ __
| |  _| | | |/ _ \/ __| |\___ \ / __| '__/ _ \/ _ \ '_ \
| |_| | |_| |  __/\__ \ | ___) | (__| | |  __/  __/ | | |
 \____|\__,_|\___||___/_||____/ \___|_|  \___|\___|_| |_|

   Control Center — Multi-Tenant Installer
BANNER
echo -e "${RESET}"
info "Repo   : $REPO_URL"
info "Server1: port $PORT1  → $INSTALL_DIR1"
info "Server2: port $PORT2  → $INSTALL_DIR2"
echo ""

# ─── 1. Check root ────────────────────────────────────────────────────────────
step "Checking prerequisites"
[[ $EUID -ne 0 ]] && error "Run as root: sudo bash install.sh"

# ─── 2. Install dependencies ──────────────────────────────────────────────────
step "Installing system packages"
apt-get update -qq
apt-get install -y -qq git curl docker.io docker-compose-v2 openssl nodejs npm

# Enable & start Docker
systemctl enable --now docker
success "Docker: $(docker --version)"
success "Node  : $(node --version)"

# ─── 3. Clone repository ──────────────────────────────────────────────────────
step "Cloning repository"
TMPDIR=$(mktemp -d)
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$TMPDIR/repo"
success "Cloned to $TMPDIR/repo"

# ─── 4. Build frontend ────────────────────────────────────────────────────────
step "Building frontend (Node 20)"
docker run --rm \
  -v "$TMPDIR/repo/src/frontend":/app \
  -w /app \
  node:20-alpine \
  sh -c "npm ci --silent && npm run build"
success "Frontend built: $TMPDIR/repo/src/frontend/dist"

# ─── 5. Setup Server 1 ────────────────────────────────────────────────────────
setup_server() {
  local INST_DIR="$1"
  local PORT="$2"
  local PG_DB="guestscreen_db_${PORT}"
  local PG_PORT=$((5430 + PORT - 8100))  # 5431 for 8101, 5432 for 8102
  local CONTAINER_NAME="guestscreen_postgres_${PORT}"
  local APP_CONTAINER="guestscreen_app_${PORT}"

  step "Setting up GuestScreen server on port $PORT → $INST_DIR"

  # Create directories
  mkdir -p "$INST_DIR/public" "$INST_DIR/postgres_data"

  # Copy server files
  cp -r "$TMPDIR/repo/deploy/production_server/." "$INST_DIR/"
  cp -r "$TMPDIR/repo/src/frontend/public/." "$INST_DIR/public/"
  cp -r "$TMPDIR/repo/src/frontend/dist/." "$INST_DIR/public/"

  # Write .env
  cat > "$INST_DIR/.env" <<EOF
PORT=$PORT
DATABASE_URL=postgresql://guestscreen:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DB}
SECRET_KEY=${SECRET_KEY}
PG_DB=${PG_DB}
PG_USER=guestscreen
PG_PASSWORD=${PG_PASSWORD}
PG_PORT=${PG_PORT}
CONTAINER_NAME=${CONTAINER_NAME}
EOF

  # Start PostgreSQL container
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    warn "Container $CONTAINER_NAME already exists — skipping creation"
  else
    docker run -d \
      --name "$CONTAINER_NAME" \
      --restart unless-stopped \
      -e POSTGRES_USER=guestscreen \
      -e POSTGRES_PASSWORD="$PG_PASSWORD" \
      -e POSTGRES_DB="$PG_DB" \
      -p "${PG_PORT}:5432" \
      -v "${INST_DIR}/postgres_data:/var/lib/postgresql/data" \
      postgres:16-alpine
    success "PostgreSQL container started: $CONTAINER_NAME"
  fi

  # Wait for PG to be ready
  info "Waiting for PostgreSQL to be ready..."
  sleep 5
  for i in $(seq 1 30); do
    docker exec "$CONTAINER_NAME" pg_isready -U guestscreen -d "$PG_DB" &>/dev/null && break
    sleep 2
  done
  success "PostgreSQL ready"

  # Run schema
  if [[ -f "$TMPDIR/repo/deploy/sql/schema.sql" ]]; then
    docker exec -i "$CONTAINER_NAME" psql -U guestscreen -d "$PG_DB" \
      < "$TMPDIR/repo/deploy/sql/schema.sql" && success "Schema applied"
  fi

  # Install Node deps and start server
  (cd "$INST_DIR" && npm install --silent)

  # Create systemd service
  cat > "/etc/systemd/system/guestscreen-${PORT}.service" <<EOF
[Unit]
Description=GuestScreen Control Center (port ${PORT})
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=${INST_DIR}
EnvironmentFile=${INST_DIR}/.env
ExecStart=/usr/bin/node ${INST_DIR}/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable --now "guestscreen-${PORT}"
  success "Service guestscreen-${PORT} started"

  info "Creating default admin user..."
  sleep 3
  docker exec "$CONTAINER_NAME" psql -U guestscreen -d "$PG_DB" -c \
    "INSERT INTO users (username, password_hash, role, created_at) 
     VALUES ('admin', '\$2b\$12\$placeholder_change_on_first_login', 'ADMINISTRATOR', NOW())
     ON CONFLICT (username) DO NOTHING;" 2>/dev/null || true
}

setup_server "$INSTALL_DIR1" "$PORT1"
setup_server "$INSTALL_DIR2" "$PORT2"

# ─── 6. Firewall ──────────────────────────────────────────────────────────────
step "Opening firewall ports"
if command -v ufw &>/dev/null; then
  ufw allow "$PORT1/tcp" comment "GuestScreen Server 1" 2>/dev/null || true
  ufw allow "$PORT2/tcp" comment "GuestScreen Server 2" 2>/dev/null || true
  success "UFW rules added"
fi

# ─── 7. Summary ───────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}${BOLD}============================================================${RESET}"
echo -e "${GREEN}${BOLD}  GuestScreen Control Center — Installation Complete!${RESET}"
echo -e "${GREEN}${BOLD}============================================================${RESET}"
echo ""
echo -e "  ${BOLD}Server 1 (Tenant 1):${RESET}"
echo -e "    URL     : ${CYAN}http://${SERVER_IP}:${PORT1}${RESET}"
echo -e "    Dir     : ${INSTALL_DIR1}"
echo -e "    Service : guestscreen-${PORT1}"
echo ""
echo -e "  ${BOLD}Server 2 (Tenant 2):${RESET}"
echo -e "    URL     : ${CYAN}http://${SERVER_IP}:${PORT2}${RESET}"
echo -e "    Dir     : ${INSTALL_DIR2}"
echo -e "    Service : guestscreen-${PORT2}"
echo ""
echo -e "  ${BOLD}Database password:${RESET} ${YELLOW}${PG_PASSWORD}${RESET}"
echo -e "  ${YELLOW}Save this password! It's stored in ${INSTALL_DIR1}/.env${RESET}"
echo ""
echo -e "  Default login: ${BOLD}admin${RESET} / ${BOLD}Admin@GS2026!${RESET}"
echo -e "  ${RED}Change the password after first login!${RESET}"
echo ""
echo -e "  Manage services:"
echo -e "    systemctl status guestscreen-${PORT1}"
echo -e "    systemctl status guestscreen-${PORT2}"
echo -e "    journalctl -u guestscreen-${PORT1} -f"
echo ""

# Cleanup
rm -rf "$TMPDIR"
success "Cleanup done"

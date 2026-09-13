#!/usr/bin/env bash
# ==============================================================================
# GuestScreen Central Management Server - All-in-One Auto Installer
# OS: Ubuntu 20.04 / 22.04 / 24.04, Debian 11 / 12
# ==============================================================================

set -e

echo "=========================================================="
echo " 🚀 GuestScreen Central Server - Full Setup & Auto Deploy "
echo "=========================================================="

# 1. Update and install required packages
echo ">>> [1/5] Installing dependencies (Docker, Compose, Python3, SSHPass)..."
apt-get update -qq
apt-get install -y -qq docker.io docker-compose sshpass python3 python3-pip curl unzip git

systemctl enable --now docker

SERVER_DIR="/opt/guestscreen-server"
mkdir -p "$SERVER_DIR/data/media"
mkdir -p "$SERVER_DIR/public/downloads"

cd "$SERVER_DIR"

# 2. Create package.json
echo ">>> [2/5] Creating application files..."
cat << 'EOF' > "$SERVER_DIR/package.json"
{
  "name": "guestscreen-server",
  "version": "2.9.0",
  "description": "GuestScreen Central Management Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "ws": "^8.16.0"
  }
}
EOF

# 3. Create Dockerfile
cat << 'EOF' > "$SERVER_DIR/Dockerfile"
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8099
CMD ["node", "server.js"]
EOF

# 4. Create docker-compose.yml
cat << 'EOF' > "$SERVER_DIR/docker-compose.yml"
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: guestscreen_postgres16
    restart: always
    environment:
      POSTGRES_DB: guestscreen_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: gs_postgres_pass_2026
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - gs_net

  server:
    build: .
    container_name: guestscreen_central_server
    restart: always
    network_mode: host
    environment:
      PORT: 8099
      DATABASE_URL: postgres://postgres:gs_postgres_pass_2026@127.0.0.1:5433/guestscreen_db
    volumes:
      - .:/app
      - /opt/guestscreen-server/data/media:/opt/guestscreen-server/data/media
    depends_on:
      - postgres

networks:
  gs_net:
    driver: bridge

volumes:
  pgdata:
EOF

echo ">>> [3/5] Setting up Master Sync Engine..."
chmod +x "$SERVER_DIR/sync_and_apply_all.py" 2>/dev/null || true

# 5. Launch containers
echo ">>> [4/5] Starting Docker containers (PostgreSQL 16 + Node.js Web Server)..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

sleep 3

# 6. Check status
echo ">>> [5/5] Checking container health..."
docker ps --filter "name=guestscreen"

MY_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo " 🎉 GuestScreen Server успешно развернут и запущен!"
echo " 🌐 Панель управления доступна по адресу:"
echo "    👉 http://${MY_IP}:8099"
echo "=========================================================="
echo " Команды управления:"
echo "   - Перезапуск: docker restart guestscreen_central_server"
echo "   - Ручной пуш на все кассы: python3 /opt/guestscreen-server/sync_and_apply_all.py"
echo "   - Логи: docker logs -f guestscreen_central_server"
echo "=========================================================="

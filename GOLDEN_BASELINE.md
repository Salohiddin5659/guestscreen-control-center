# GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680

> **Статус**: ИММУТАБЕЛЬНЫЙ ЭТАЛОННЫЙ СНИМОК (GOLDEN BASELINE)  
> **Метка времени фиксации**: 2026-09-13T01:30:00Z  
> **Базовое состояние**: Step 5680 (состояние системы непосредственно перед задачей "INCORRECT DEVICE ONLINE STATUS")  
> **Расположение на сервере**: `/opt/backups/GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680/`  
> **Локальное расположение**: `d:\Anti\backups\GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680\`  

---

## 1. Архитектура среды выполнения (Runtime Architecture)

Система работает в проверенном режиме разделения ответственности (Dual Runtime):

```text
                               +------------------------------------------+
                               |     Клиентский браузер (10.0.0.110)      |
                               +------------------------------------------+
                                        |                        |
                   HTTP GET (SPA / Assets)                       | HTTP GET / POST (/api/v1)
                                        v                        v
+--------------------------------------------------+   +--------------------------------------------------+
|      Node.js Server (:8101)                      |   |      FastAPI Backend (:8000)                     |
|  - Контейнер: guestscreen_central_server         |   |  - Контейнер: guestscreen_fastapi_server         |
|  - Образ: guestscreen-server-guestscreen_server  |   |  - Образ: guestscreen-fastapi:latest             |
|  - Команда: node server.js                       |   |  - Команда: uvicorn app.main:app --port 8000     |
|  - Раздача статики: /app/public                  |   |  - OpenAPI 3.1.0 спецификация                    |
|  - SPA Fallback: index.html для всех роутов      |   |  - Модели: SQLAlchemy 2.x / SQLModel             |
|  - Маршруты: /, /login, /playlists, /devices     |   |  - Маршруты: /healthz, /api/v1/*                 |
+--------------------------------------------------+   +--------------------------------------------------+
                                        |                        |
                                        +------------+-----------+
                                                     |
                                                     v
                               +------------------------------------------+
                               |      PostgreSQL 16 (:5433)               |
                               |  - Контейнер: guestscreen_postgres16     |
                               |  - БД 1: gs_control_center (FastAPI)     |
                               |    Alembic: 007_pub_ad_block_nullable    |
                               |  - БД 2: guestscreen_db (Legacy / Sync)  |
                               +------------------------------------------+
```

### Детали активных служб:

1. **Node.js Frontend & SPA Server**:
   - **Порт**: `8101` (host network)
   - **Контейнер**: `guestscreen_central_server` (PID процесса: `913846`)
   - **Образ**: `guestscreen-server-guestscreen_server:latest` (`sha256:a932bfe60edc5fa3168bfe3864fd411f3ba572e85b5f4a962cd14b0b895bd020`)
   - **Функция**: Раздача собранного React 18 SPA (`/app/public`), статических ассетов (`/assets/*`), и обработка SPA Fallback (`app.get('*', ... res.sendFile('index.html'))`) для обеспечения прямой навигации по URL (`/login`, `/playlists`, `/devices`) и перезагрузки по F5.

2. **FastAPI Backend Service**:
   - **Порт**: `8000` (host network)
   - **Контейнер**: `guestscreen_fastapi_server` (PID процесса: `913884`)
   - **Образ**: `guestscreen-fastapi:latest` (`sha256:e12e41d45e6eb09a54f7cbd8f21d7a7476875711342edd85009d40073435d6f6`)
   - **Функция**: Чистый REST API бэкенд на базе Python 3.13 + FastAPI (`main.py`, 72 строки), OpenAPI документация (`/api/v1/openapi.json`), JWT аутентификация, топология касс и управление рекламными блоками.

3. **PostgreSQL 16 Cluster**:
   - **Порт хоста**: `5433` (сопоставлен с `5432` контейнера)
   - **Контейнер**: `guestscreen_postgres16`
   - **Образ**: `postgres:16-alpine` (`sha256:16bc17c64a573ef34162af9298258d1aec548232985b33ed7b1eac33ba35c229`)
   - **Активная ревизия Alembic**: `007_pub_ad_block_nullable` (таблица `alembic_version` в `gs_control_center`).

---

## 2. Неприкосновенность оборудования (Cashbox Isolation)

Боевые и тестовые кассовые моноблоки изолированы и находятся в неизменном состоянии:
- `192.168.129.201` — **НЕ** опрашивалась по сети, не модифицировалась.
- `192.168.129.202` — **НЕ** опрашивалась по сети, не модифицировалась.
- `10.0.0.241` — **НЕ** модифицировалась.
- Локальная база `gs.db` на кассах не затрагивалась.
- База данных `guestscreen_db` (содержащая оригинальные записи 4 касс) полностью сохранена.

---

## 3. Состав и контрольные суммы снимка (Golden Baseline Manifest)

Все файлы снимка сохранены на сервере в `/opt/backups/GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680/` и локально в `d:\Anti\backups\GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680\`:

| Файл | Назначение | Размер | SHA256 Checksum |
|---|---|:---:|---|
| `gs_control_center_full.sql` | Полный дамп БД FastAPI (`gs_control_center`) с данными | 127 KB | `4a8ea8897205a20f70a8a34a3acf1df8fc102382b1a3a0115d97b8db85d539fd` |
| `gs_control_center_schema.sql` | Дамп структуры схемы БД FastAPI (DDL) | 25 KB | `0b302b04d614ef89af364e242c4d1befab24cc74b55b588b969039ca6d024b8e` |
| `guestscreen_db_full.sql` | Полный дамп БД Legacy (`guestscreen_db`) с 4 кассами | 115 KB | `291bc4defdf807204fc2ea7b36f301b0d681b98a1b4ddfdfd02d3e0e69c8bb13` |
| `guestscreen_db_schema.sql` | Дамп структуры схемы Legacy БД | 9.6 KB | `cd9b390c0836b3ed26d3b00be9a7eff74612c338da805726a4a30f59d3e663e7` |
| `docker-compose.yml` | Точный рабочий манипулятор контейнеров Step 5680 | 2.0 KB | `03a657168c38a94c7a85abad163916894ea35852c7999fc51c516e9200c78c21` |
| `server.js` | Node.js сервер раздачи статики и SPA fallback | 52 KB | `815ec8dcc1e91cf3d7fce4ad57801bdf180ae075fb5cc807f5baff8d3253f0b9` |
| `api_v1.js` | Маршрутизатор Node Express API v1 | 24 KB | `d4bc521dcb70180e8e44467f7c3bc2b727bb3d1e53b95b8fd0cff2206163b782` |
| `frontend_public.tar.gz` | Архив собранных production-ассетов (`public/`) | 100 KB | `8ec6c859c71cc36d6f033987fb84803778fe60906f2be85ff8c85f254517e424` |
| `backend_source.tar.gz` | Архив исходного кода FastAPI бэкенда с сервера | 163 KB | `ad15e50977911ff34c961dfeac261196aadb20d05ae2f56a00c5b89b59ad8525` |
| `local_src_step5680.zip` | Полный архив локального дерева `src/` (frontend + backend) | 181 KB | `d021f0e003a36ee7fe7bf3af71ca88229af770d3e9686f67798cba3264b06a80` |
| `runtime_inspection.json` | Снимок инспекции Docker, портов, ревизии Alembic | 2.1 KB | `a9e7fd6e3c06b438e496f6b475e55fb2d55cf2bad8702ab8e9ca07aeba5b8878` |

---

## 4. Количество строк в базе данных на момент фиксации

В базе данных `gs_control_center` зафиксированы следующие точные количества записей:
- `cashiers`: **2** (`10.0.0.241`, `10.0.0.80`)
- `advertising_blocks`: **1** ("Промо-кампания 13.09.2026")
- `playlist_items`: **1**
- `branches`: **3**
- `regions`: **3**
- `users`: **1** (`admin`)
- `publication_jobs`: **2**
- `audit_logs`: **184**

---

## 5. Регламент полного восстановления (Disaster Recovery Runbook)

В случае необходимости отката к этому эталону выполнить следующие действия:

### Шаг 1: Восстановление файлов конфигурации и статики на сервере
```bash
BACKUP_DIR="/opt/backups/GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680"
cd /opt/guestscreen-server

# Восстановление docker-compose, server.js, api_v1.js
cp $BACKUP_DIR/docker-compose.yml .
cp $BACKUP_DIR/server.js .
cp $BACKUP_DIR/api_v1.js .

# Восстановление статики frontend
rm -rf public
tar -xzf $BACKUP_DIR/frontend_public.tar.gz

# Восстановление бэкенда FastAPI
rm -rf backend
tar -xzf $BACKUP_DIR/backend_source.tar.gz
```

### Шаг 2: Восстановление баз данных PostgreSQL
```bash
# Восстановление gs_control_center
docker exec -i guestscreen_postgres16 psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS gs_control_center;"
docker exec -i guestscreen_postgres16 psql -U postgres -d postgres -c "CREATE DATABASE gs_control_center;"
docker exec -i guestscreen_postgres16 psql -U postgres -d gs_control_center < $BACKUP_DIR/gs_control_center_full.sql

# Восстановление guestscreen_db
docker exec -i guestscreen_postgres16 psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS guestscreen_db;"
docker exec -i guestscreen_postgres16 psql -U postgres -d postgres -c "CREATE DATABASE guestscreen_db;"
docker exec -i guestscreen_postgres16 psql -U postgres -d guestscreen_db < $BACKUP_DIR/guestscreen_db_full.sql
```

### Шаг 3: Перезапуск контейнеров
```bash
cd /opt/guestscreen-server
docker compose down
docker compose up -d
```

### Шаг 4: Проверка работоспособности
```bash
# 1. Проверка frontend
curl -i http://127.0.0.1:8101/playlists
# Ожидается: HTTP 200 OK (text/html)

# 2. Проверка backend
curl -i http://127.0.0.1:8000/healthz
# Ожидается: HTTP 200 OK ({"status":"ok","version":"1.0.0"})

# 3. Проверка ревизии Alembic
docker exec guestscreen_postgres16 psql -U postgres -d gs_control_center -t -A -c "SELECT version_num FROM alembic_version;"
# Ожидается: 007_pub_ad_block_nullable
```

---

## 6. Итоговый статус

Базовое состояние **GS_CONTROL_CENTER_GOLDEN_BASELINE_STEP5680** верифицировано, опечатано контрольными суммами SHA256 и готово к использованию как безусловный эталон проекта.

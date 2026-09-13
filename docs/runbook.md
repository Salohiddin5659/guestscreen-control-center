# GS Control Center: Operator & Administrator Runbook

## 1. System Overview & Architecture
GS Control Center is a centralized on-premise digital signage and promotional banner management system for UCS Guest Screen running across a fleet of 200+ cashier monoblocks.

- **Central Control Server**: `10.0.0.111:8088` (Dockerized FastAPI, PostgreSQL 16, Redis 7, MinIO, React SPA).
- **Cashier Terminals**: Agentless Windows POS monoblocks running UCS Guest Screen (CefSharp Chromium).
- **Communication Protocol**: Push orchestration over OpenSSH and SFTP (zero client agents or background daemons).

---

## 2. Operator Workflows

### 2.1 Media Asset Management
1. Navigate to **Медиатека** (`/media`).
2. Click **Загрузить медиафайл**.
3. Select an image (`.jpg`, `.jpeg`, `.png`) or video (`.mp4`).
   - Resolution for **FULL_SCREEN**: `1024 × 768` (4:3 aspect ratio).
   - Resolution for **MODE32_PROMO**: `512 × 768` (half screen).
4. System automatically computes SHA-256 hash, verifies dimensions, generates a preview thumbnail, and uploads to MinIO.
5. Duplicates with identical SHA-256 are detected and reused automatically.

### 2.2 Creating Advertising Blocks
1. Navigate to **Рекламные блоки** (`/ad-blocks`) and click **Создать блок**.
2. Fill in:
   - **Название**: Human-readable name (e.g., "Осенняя акция 2026").
   - **Область (Area)**: `FULL_SCREEN` (Экран ожидания 1024×768) or `MODE32_PROMO` (Экран заказа 512×768).
   - **Режим отображения (Display Mode)**: `STATIC` (Один баннер) or `SLIDESHOW` (Галерея слайдов).
3. In the playlist editor:
   - For `STATIC`: Select exactly 1 media asset.
   - For `SLIDESHOW`: Select 2 or more media assets and configure display duration per slide (default: 7 seconds).
4. Click **Сохранить блок**.

### 2.3 Dispatching a Publication
1. In the Advertising Block view or **Публикации** (`/publications`), click **Опубликовать**.
2. Select target scope:
   - **Регион**: All active cashiers in the selected region(s).
   - **Филиал**: All active cashiers in the selected branch(es).
   - **Выбранные кассы**: Custom selection of individual cashiers.
3. Click **Запустить публикацию**.
4. Track real-time rollout progress via SSE stream:
   - **Успешно (SUCCESS)**: Media transferred, SQLite `scenes.Raw` surgically updated, and front reloaded seamlessly.
   - **Ожидает перезапуска (PUBLISHED_AWAITING_RESTART)**: Scene written, front reload deferred to maintenance window.
   - **В очереди / Выполняется (PENDING / RUNNING)**: In worker execution pool.
   - **Ошибка (FAILED / OFFLINE)**: Detailed error trace available in attempt logs.

### 2.4 Handling Failed Cashiers & Retries
1. If any cashier fails (e.g. offline terminal or network timeout), click on the batch detail.
2. Review the diagnostic execution log for each attempt.
3. To re-run only failed or offline nodes, click **Повторить неудачные**.

---

## 3. Administrator & Maintenance Procedures

### 3.1 Cashier Fleet Inspection
1. Navigate to **Топология** (`/topology`).
2. Click **Проверить связь** next to any cashier.
3. The server connects via SSH, verifies:
   - Free disk space on drive `C:` (>= 100 MB).
   - `C:\UCS\GuestScreen\gs.db` existence.
   - `C:\UCS\GuestScreen\Front\media\uploads\` directory existence.
   - `sqlite3.exe` CLI presence.
   - `GuestScreen.exe` version.

### 3.2 Immutability Guarantees
- **CRITICAL**: The system NEVER modifies or touches `licenses`, `screens`, or `settings` tables in `gs.db`.
- Automatic local timestamped snapshots (`C:\UCS\GuestScreen\gs.db.bak_<timestamp>`) are created before every single surgical write.
- If verification query detects content mismatch, a Tier 1 surgical rollback immediately restores previous `scenes.Raw` without disrupting ongoing r_keeper orders.

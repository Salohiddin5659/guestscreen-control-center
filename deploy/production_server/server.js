const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let apiV1Router = null;

function broadcastDeploymentEvent(eventData) {
  if (apiV1Router && typeof apiV1Router.handleDeploymentEvent === 'function') {
    try { apiV1Router.handleDeploymentEvent(eventData); } catch(e) {}
  }
  const payload = JSON.stringify({
    type: 'DEPLOYMENT_EVENT',
    ...eventData,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function resolveTargetCashiers(targetType, targetIps, targetBranch, targetRegion) {
  if (targetType === 'ips' && Array.isArray(targetIps)) {
    return cashiers.filter(c => targetIps.includes(c.ip));
  }
  if (targetType === 'branch' && targetBranch) {
    return cashiers.filter(c => c.branch === targetBranch);
  }
  if (targetType === 'region' && targetRegion) {
    return cashiers.filter(c => c.regionName === targetRegion);
  }
  if (targetType === 'all' || !targetType) {
    return [...cashiers];
  }
  return [];
}

function extractConfigMedia(mode, cfg) {
  let files = [];
  if (!cfg) return [];
  if (mode === 'SPLIT') {
    if (Array.isArray(cfg.gallerySlides) && cfg.gallerySlides.length > 0) {
      files = [...cfg.gallerySlides];
    } else if (cfg.orderPromoBanner) {
      files = [cfg.orderPromoBanner];
    } else if (Array.isArray(cfg.slides) && cfg.slides.length > 0) {
      files = [...cfg.slides];
    } else if (cfg.activeBanner) {
      files = [cfg.activeBanner];
    }
  } else {
    if (Array.isArray(cfg.idleSlides) && cfg.idleSlides.length > 0) {
      files = [...cfg.idleSlides];
    } else if (cfg.activeBanner) {
      files = [cfg.activeBanner];
    } else if (Array.isArray(cfg.slides) && cfg.slides.length > 0) {
      files = [...cfg.slides];
    }
  }
  return files.filter(Boolean);
}

function runDeploymentJob(deploymentId, targetIp, mode, configData) {
  const orchestratorScript = '/app/deployment_orchestrator.py';
  const cfgStr = JSON.stringify(configData);

  pool.query(`UPDATE deployments SET status = 'RUNNING', started_at = NOW(), updated_at = NOW() WHERE id = $1`, [deploymentId])
    .catch(e => console.error('Error starting deployment:', e));

  broadcastDeploymentEvent({ deploymentId, step: 0, name: 'STARTING', status: 'RUNNING', ip: targetIp, mode });

  const child = spawn('python3', [orchestratorScript, deploymentId, targetIp, mode, cfgStr, MEDIA_DIR]);
  let accumulatedLogs = [];

  child.stdout.on('data', (data) => {
    const text = data.toString();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      accumulatedLogs.push(trimmed);
      console.log(`[deploy ${deploymentId}] ${trimmed}`);

      if (trimmed.startsWith('STEP_EVENT:')) {
        try {
          const event = JSON.parse(trimmed.substring('STEP_EVENT:'.length));
          const stepNum = event.step;
          const stepName = event.name;
          const stepStatus = event.status;
          const details = event.details || {};

          let depStatus = 'RUNNING';
          if (stepStatus === 'FAILED') depStatus = 'FAILED';
          else if (stepStatus === 'NO_OP') depStatus = 'NO_OP';
          else if (stepNum >= 14 && stepNum <= 16 && stepStatus === 'RUNNING') depStatus = 'VERIFYING';
          else if (stepNum === 17 && (stepStatus === 'SUCCESS' || stepStatus === 'NO_OP')) depStatus = stepStatus;
          else if (stepName === 'ROLLING_BACK') depStatus = 'ROLLING_BACK';
          else if (stepName === 'ROLLED_BACK') depStatus = 'ROLLED_BACK';

          pool.query(
            `UPDATE deployments SET status = $1, current_step = $2, current_step_name = $3, updated_at = NOW() WHERE id = $4`,
            [depStatus, stepNum, stepName, deploymentId]
          ).catch(e => console.error('Error updating deployment status:', e));

          pool.query(
            `INSERT INTO deployment_steps (id, deployment_id, step_number, step_name, status, details, started_at, finished_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
             ON CONFLICT (deployment_id, step_number) DO UPDATE
             SET status = EXCLUDED.status, details = EXCLUDED.details, finished_at = NOW()`,
            [deploymentId, stepNum, stepName, stepStatus, JSON.stringify(details)]
          ).catch(e => console.error('Error upserting deployment step:', e));

          broadcastDeploymentEvent({
            deploymentId,
            step: stepNum,
            name: stepName,
            status: depStatus,
            stepStatus,
            details,
            ip: targetIp,
            mode
          });

          if (depStatus === 'SUCCESS' || depStatus === 'NO_OP') {
            const ver = configData.version || 1;
            pool.query(
              `UPDATE cashiers SET version = $1, status = 'online', last_sync = NOW() WHERE ip = $2`,
              [ver, targetIp]
            ).catch(() => {});
            const c = cashiers.find(x => x.ip === targetIp);
            if (c) {
              c.version = ver;
              c.status = 'online';
              c.lastSync = new Date().toISOString();
            }
            broadcastUpdate();
          }
        } catch (err) {
          console.error('Failed to parse step event:', err);
        }
      }
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
      console.error(`[deploy ${deploymentId}] stderr:`, text);
      accumulatedLogs.push(`ERROR: ${text}`);
    }
  });

  child.on('close', (code) => {
    console.log(`[deploy ${deploymentId}] process finished with code ${code}`);
    if (code !== 0) {
      const errMsg = accumulatedLogs.slice(-10).join('\n') || `Process exited with code ${code}`;
      pool.query(
        `UPDATE deployments SET status = 'FAILED', error_message = $1, finished_at = NOW(), updated_at = NOW() WHERE id = $2 AND status != 'ROLLED_BACK'`,
        [errMsg, deploymentId]
      ).catch(() => {});
      broadcastDeploymentEvent({
        deploymentId,
        step: 0,
        name: 'FAILED',
        status: 'FAILED',
        ip: targetIp,
        mode,
        error: errMsg
      });
    } else {
      pool.query(
        `UPDATE deployments SET finished_at = NOW(), updated_at = NOW() WHERE id = $1 AND finished_at IS NULL`,
        [deploymentId]
      ).catch(() => {});
    }
  });
}

function triggerSyncAndApply() {
  const onlineCashiers = cashiers.filter(c => c.status === 'online');
  onlineCashiers.forEach(c => {
    const depId = crypto.randomUUID();
    const depConfig = Object.assign({}, config, c.customConfig || {});
    pool.query(
      `INSERT INTO deployments (id, cashbox_id, target_version, status, current_step, current_step_name, mode, config_data, started_at)
       VALUES ($1, $2, $3, 'PENDING', 0, 'QUEUED', 'FULL', $4, NOW())`,
      [depId, c.ip, config.version || 1, JSON.stringify(depConfig)]
    ).catch(() => {});
    runDeploymentJob(depId, c.ip, 'FULL', depConfig);
  });
}

const PORT = process.env.PORT || 8099;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const DOWNLOADS_DIR = path.join(__dirname, 'public', 'downloads');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:gs_postgres_pass_2026@postgres:5432/guestscreen_db';

// Allowed Media Extensions
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm', '.ogg', '.mkv']);

// Ensure directories
[DATA_DIR, MEDIA_DIR, DOWNLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// JSON fallback file paths
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CASHIERS_FILE = path.join(DATA_DIR, 'cashiers.json');
const BRANCHES_FILE = path.join(DATA_DIR, 'branches.json');

// -------------------------------------------------------------
// POSTGRESQL 16 CONNECTION POOL
// -------------------------------------------------------------
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000
});

pool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err.message);
});

// In-Memory Fast Cache
let regions = [];
let branches = [];
let cashiers = [];
let config = {
  version: 65,
  lastUpdated: new Date().toISOString(),
  idleType: 'image',
  activeBanner: '001.jpg',
  idleSlides: ['001.jpg', '99K-Full.png'],
  idleInterval: 10,
  idleFitMode: 'stretch',
  orderPromoType: 'gallery',
  orderPromoBanner: 'p5.jpg',
  gallerySlides: ['p5.jpg', 'd7.jpg'],
  galleryInterval: 5,
  promoFri: 's4.jpg',
  promoDessert: 'd3.jpg',
  promoSous: '1sous.jpg',
  promoDrink: 'h1.jpg',
  promoBaraka: 'd1.jpg',
  videoAd: 'Skillet  Hero Official Video_480p.mp4',
  checkConfig: {
    showDishImg: true,
    showModi: true,
    dishFontSize: 20,
    priceFontSize: 20,
    countFontSize: 16,
    modiFontSize: 16,
    dishColor: '#000000',
    priceColor: '#000000',
    countColor: '#ff0010',
    showPriceOfWeightDishes: false,
    headerDishText: 'Nomi',
    headerQtyText: 'Soni',
    headerPriceText: 'Narxi',
    headerTotalText: "JAMI TO'LOV"
  }
};

// -------------------------------------------------------------
// AUTHENTICATION HELPERS & SESSIONS
// -------------------------------------------------------------
const activeSessions = new Map(); // token -> { username, role, expiresAt }

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function createSession(username, role) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days session
  activeSessions.set(token, { username, role, expiresAt });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const sess = activeSessions.get(token);
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return sess;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : req.headers['x-auth-token'];
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Необходима авторизация', requireLogin: true });
  }
  req.user = session;
  next();
}

// Initial Default Regions
const DEFAULT_REGIONS = [
  { id: 'region-tashkent', name: 'Ташкент', color: '#175676' },
  { id: 'region-samarkand', name: 'Самарканд', color: '#D62246' },
  { id: 'region-bukhara', name: 'Бухара', color: '#4BA3C3' },
  { id: 'region-andijan', name: 'Андижан', color: '#E76F51' },
  { id: 'region-namangan', name: 'Наманган', color: '#2A9D8F' },
  { id: 'region-fergana', name: 'Фергана', color: '#E9C46A' },
  { id: 'region-ocafe', name: 'O-Cafe', color: '#8E44AD' },
  { id: 'region-branches', name: 'Филиалы', color: '#2980B9' }
];

// -------------------------------------------------------------
// DATABASE INITIALIZATION & MIGRATIONS
// -------------------------------------------------------------
async function initDatabase() {
  console.log('Connecting to PostgreSQL 16 database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL 16 successfully!');

    // 1. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        salt VARCHAR(64) NOT NULL,
        role VARCHAR(32) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS regions (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(32) DEFAULT '#175676',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        region_name VARCHAR(255) DEFAULT 'Ташкент',
        address TEXT,
        color VARCHAR(32) DEFAULT '#175676',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cashiers (
        ip VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255),
        computer_name VARCHAR(255),
        branch VARCHAR(255),
        region_name VARCHAR(255) DEFAULT 'Ташкент',
        notes TEXT,
        status VARCHAR(32) DEFAULT 'offline',
        version INT DEFAULT 0,
        guest_screen_running BOOLEAN DEFAULT TRUE,
        last_heartbeat TIMESTAMPTZ,
        last_sync TIMESTAMPTZ,
        system_info JSONB DEFAULT '{}'::jsonb,
        monitors_info JSONB DEFAULT '{}'::jsonb,
        custom_config JSONB DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS global_config (
        id INT PRIMARY KEY DEFAULT 1,
        version INT DEFAULT 1,
        config_data JSONB NOT NULL,
        last_updated TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Seed Default Admin Users (admin/admin and administrator/123)
    const userRes = await client.query(`SELECT * FROM users`);
    if (userRes.rows.length === 0) {
      const saltAdmin = generateSalt();
      const hashAdmin = hashPassword('admin', saltAdmin);
      await client.query(`INSERT INTO users (username, password_hash, salt, role) VALUES ($1, $2, $3, $4)`, ['admin', hashAdmin, saltAdmin, 'admin']);

      const saltAdm2 = generateSalt();
      const hashAdm2 = hashPassword('123', saltAdm2);
      await client.query(`INSERT INTO users (username, password_hash, salt, role) VALUES ($1, $2, $3, $4)`, ['administrator', hashAdm2, saltAdm2, 'admin']);
      console.log('Created default admin accounts: admin/admin, administrator/123');
    }

    // 3. Seed Default Regions
    for (const r of DEFAULT_REGIONS) {
      await client.query(`
        INSERT INTO regions (id, name, color)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [r.id, r.name, r.color]);
    }
    const regRes = await client.query(`SELECT * FROM regions ORDER BY name ASC`);
    regions = regRes.rows.map(r => ({ id: r.id, name: r.name, color: r.color }));

    // 4. Seed Default Branches
    const branchRes = await client.query(`SELECT * FROM branches ORDER BY name ASC`);
    if (branchRes.rows.length === 0) {
      const defaultBranches = [
        { id: 'branch-zal', name: 'Главный зал', region_name: 'Ташкент', address: 'ул. Амира Темура, 10' },
        { id: 'branch-algoritm', name: 'Алгоритм', region_name: 'Ташкент', address: 'м-в Алгоритм, 31' },
        { id: 'branch-chilonzor', name: 'Чиланзар', region_name: 'Ташкент', address: 'квартал 7' },
        { id: 'branch-yunusobod', name: 'Юнусабад', region_name: 'Ташкент', address: 'квартал 14' }
      ];
      for (const b of defaultBranches) {
        await client.query(`
          INSERT INTO branches (id, name, region_name, address)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `, [b.id, b.name, b.region_name, b.address]);
      }
      branches = defaultBranches;
    } else {
      branches = branchRes.rows.map(b => ({ id: b.id, name: b.name, region_name: b.region_name, address: b.address }));
    }

    // 5. Load Global Config
    const confRes = await client.query(`SELECT * FROM global_config WHERE id = 1`);
    if (confRes.rows.length === 0) {
      await client.query(`
        INSERT INTO global_config (id, version, config_data)
        VALUES (1, $1, $2)
      `, [config.version, JSON.stringify(config)]);
    } else {
      const dbConf = confRes.rows[0];
      config = Object.assign({}, config, typeof dbConf.config_data === 'string' ? JSON.parse(dbConf.config_data) : dbConf.config_data);
      config.version = dbConf.version;
    }

    // 6. Load Cashiers
    const cashRes = await client.query(`SELECT * FROM cashiers ORDER BY ip ASC`);
    cashiers = cashRes.rows.map(r => ({
      ip: r.ip,
      name: r.name,
      computerName: r.computer_name,
      branch: r.branch,
      regionName: r.region_name || 'Ташкент',
      notes: r.notes,
      status: r.status,
      version: r.version,
      guestScreenRunning: r.guest_screen_running,
      lastHeartbeat: r.last_heartbeat ? r.last_heartbeat.toISOString() : null,
      lastSync: r.last_sync ? r.last_sync.toISOString() : null,
      systemInfo: r.system_info || {},
      monitorsInfo: r.monitors_info || { count: 2, hasSecondScreen: true },
      customConfig: r.custom_config || null
    }));

    console.log(`Database ready: ${regions.length} regions, ${branches.length} branches, ${cashiers.length} cashiers, config v${config.version}`);
  } catch (err) {
    console.error('Database Initialization Error:', err);
  } finally {
    if (client) client.release();
  }
}

// Helper: Get Image Dimensions and Metadata
function getImageMetadata(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let width = 0;
  let height = 0;

  try {
    const buffer = fs.readFileSync(filePath);
    if (ext === '.png' && buffer.length >= 24) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    } else if ((ext === '.jpg' || ext === '.jpeg') && buffer.length >= 4) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] === 0xFF && (buffer[offset + 1] === 0xC0 || buffer[offset + 1] === 0xC2)) {
          height = buffer.readUInt16BE(offset + 5);
          width = buffer.readUInt16BE(offset + 7);
          break;
        }
        offset++;
      }
    }
  } catch (e) {}

  let ratio = '1:1';
  let ratioFormatted = '';
  let isFullscreenMatch = false;
  let isOrderPromoMatch = false;

  if (width > 0 && height > 0) {
    const r = width / height;
    if (Math.abs(r - 1.333) < 0.05) { ratio = '4:3'; isFullscreenMatch = true; }
    else if (Math.abs(r - 1.777) < 0.05) ratio = '16:9';
    else if (Math.abs(r - 1.6) < 0.05) ratio = '16:10';
    else if (Math.abs(r - 0.666) < 0.05) { ratio = '2:3'; isOrderPromoMatch = true; }
    else if (Math.abs(r - 0.5625) < 0.05) { ratio = '9:16'; isOrderPromoMatch = true; }
    else if (Math.abs(r - 1) < 0.05) ratio = '1:1';
    else ratio = `${width}:${height}`;

    ratioFormatted = `${width}×${height} (${ratio})`;
  }

  return { width, height, ratio, ratioFormatted, isFullscreenMatch, isOrderPromoMatch };
}

// -------------------------------------------------------------
// EXPRESS MIDDLEWARE
// -------------------------------------------------------------
app.use(cors());

// -------------------------------------------------------------
// REVERSE PROXY TO FASTAPI (:8000)
// Single Source of Truth: All /api/v1/* and /healthz requests
// are transparently forwarded to FastAPI Uvicorn engine.
// Mounted BEFORE express.json() to prevent stream consumption.
// -------------------------------------------------------------
const FASTAPI_HOST = process.env.FASTAPI_HOST || '127.0.0.1';
const FASTAPI_PORT = parseInt(process.env.FASTAPI_PORT || '8000', 10);
const proxyToFastAPI = (req, res) => {
  const targetPath = req.originalUrl || req.url;
  const options = {
    hostname: FASTAPI_HOST,
    port: FASTAPI_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${FASTAPI_HOST}:${FASTAPI_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[FastAPI Proxy Error] ${req.method} ${targetPath}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        detail: 'FastAPI Gateway Error: service unavailable',
        error: err.message
      });
    }
  });

  req.pipe(proxyReq, { end: true });
};

app.use('/api/v1', proxyToFastAPI);
app.get('/healthz', proxyToFastAPI);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(MEDIA_DIR));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// -------------------------------------------------------------
// API V1 ROUTER (React 18+ Production Frontend Support)
// -------------------------------------------------------------
try {
  const createApiV1Router = require('./api_v1');
  apiV1Router = createApiV1Router({
    pool,
    MEDIA_DIR,
    runDeploymentJob,
    broadcastDeploymentEvent,
    cashiers,
    branches,
    regions,
    config
  });
  // app.use('/api/v1', apiV1Router); // Disabled in favor of FastAPI proxy
  // app.get('/healthz', ...); // Handled by FastAPI proxy
  console.log('✅ API v1 Router mounted successfully on /api/v1');
} catch (e) {
  console.error('Failed to mount API v1 Router:', e);
}

// -------------------------------------------------------------
// AUTHENTICATION API ROUTES
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Укажите логин и пароль' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const user = rows[0];
    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.password_hash) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const token = createSession(user.username, user.role);
    res.json({
      success: true,
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/check', (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : req.query.token;
  const sess = getSession(token);
  if (!sess) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: { username: sess.username, role: sess.role } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : req.body.token;
  if (token) activeSessions.delete(token);
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 3) {
    return res.status(400).json({ error: 'Новый пароль должен содержать минимум 3 символа' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [req.user.username]);
    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    const user = rows[0];
    if (oldPassword) {
      const testHash = hashPassword(oldPassword, user.salt);
      if (testHash !== user.password_hash) {
        return res.status(400).json({ error: 'Текущий пароль неверен' });
      }
    }
    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);
    await pool.query('UPDATE users SET password_hash = $1, salt = $2, updated_at = NOW() WHERE id = $3', [newHash, newSalt, user.id]);
    res.json({ success: true, message: 'Пароль успешно обновлен' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------------------------------------------------------------
// USER MANAGEMENT API (ADMIN PANEL)
// -------------------------------------------------------------
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, username, role, created_at, updated_at FROM users ORDER BY id ASC`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', requireAuth, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }
  const cleanUser = username.trim();
  if (cleanUser.length < 2) {
    return res.status(400).json({ error: 'Логин должен содержать минимум 2 символа' });
  }
  if (password.length < 3) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 3 символа' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [cleanUser]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `Пользователь с логином "${cleanUser}" уже существует` });
    }
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const userRole = role || 'admin';
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, salt, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role, created_at`,
      [cleanUser, hash, salt, userRole]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:id', requireAuth, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { username, password, role } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    const user = rows[0];

    let newUsername = user.username;
    if (username && username.trim()) {
      const cleanUser = username.trim();
      const checkDuplicate = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2', [cleanUser, userId]);
      if (checkDuplicate.rows.length > 0) {
        return res.status(400).json({ error: `Логин "${cleanUser}" уже занят другим пользователем` });
      }
      newUsername = cleanUser;
    }

    let newRole = role || user.role;
    let newHash = user.password_hash;
    let newSalt = user.salt;

    if (password && password.trim().length >= 3) {
      newSalt = generateSalt();
      newHash = hashPassword(password.trim(), newSalt);
    }

    await pool.query(
      `UPDATE users SET username = $1, password_hash = $2, salt = $3, role = $4, updated_at = NOW() WHERE id = $5`,
      [newUsername, newHash, newSalt, newRole, userId]
    );

    res.json({ success: true, user: { id: userId, username: newUsername, role: newRole } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/users/:id', requireAuth, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const totalCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(totalCount.rows[0].count, 10) <= 1) {
      return res.status(400).json({ error: 'Нельзя удалить единственного пользователя в системе' });
    }

    const { rows } = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });

    if (req.user && req.user.username.toLowerCase() === rows[0].username.toLowerCase()) {
      return res.status(400).json({ error: 'Нельзя удалить свою собственную учетную запись во время активного сеанса' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true, message: `Пользователь ${rows[0].username} удален` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Quick PowerShell installer endpoints (public)
app.get(['/install.ps1', '/install', '/setup.ps1', '/setup', '/install.sp1', '/setup.sp1', '/agent.ps1'], (req, res) => {
  let scriptPath = path.join(DOWNLOADS_DIR, 'setup_monoblock.ps1');
  if (!fs.existsSync(scriptPath)) {
    scriptPath = path.join(__dirname, 'public', 'setup.ps1');
  }

  if (fs.existsSync(scriptPath)) {
    try {
      const content = fs.readFileSync(scriptPath, 'utf8');
      const buffer = Buffer.from(content, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': buffer.length,
        'Connection': 'close',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(buffer);
    } catch (e) {
      console.error('Error serving setup script:', e);
    }
  }
  res.status(404).send('# Setup script not found on server');
});

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Get Config
app.get('/api/config', async (req, res) => {
  const queryIp = req.query.ip;
  if (queryIp) {
    const cashier = cashiers.find(c => c.ip === queryIp);
    if (cashier && cashier.customConfig) {
      return res.json(Object.assign({}, config, cashier.customConfig));
    }
  }
  res.json(config);
});

// 2. Update Config (Protected)
app.post('/api/config', requireAuth, async (req, res) => {
  const { targetType, targetIps, targetBranch, targetRegion, ...updates } = req.body;

  const newVersion = (config.version || 0) + 1;
  config.version = newVersion;
  config.lastUpdated = new Date().toISOString();

  try {
    if (!targetType || targetType === 'all' || (targetIps && targetIps.length === cashiers.length)) {
      // Global config update
      if (updates.idleType !== undefined) config.idleType = updates.idleType;
      if (updates.activeBanner !== undefined) config.activeBanner = updates.activeBanner;
      if (updates.idleSlides !== undefined) config.idleSlides = updates.idleSlides;
      if (updates.idleInterval !== undefined) config.idleInterval = parseInt(updates.idleInterval, 10);
      if (updates.idleFitMode !== undefined) config.idleFitMode = updates.idleFitMode;

      if (updates.orderPromoType !== undefined) config.orderPromoType = updates.orderPromoType;
      if (updates.orderPromoBanner !== undefined) config.orderPromoBanner = updates.orderPromoBanner;
      if (updates.gallerySlides !== undefined) config.gallerySlides = updates.gallerySlides;
      if (updates.galleryInterval !== undefined) config.galleryInterval = parseInt(updates.galleryInterval, 10);
      if (updates.promoFri !== undefined) config.promoFri = updates.promoFri;
      if (updates.promoDessert !== undefined) config.promoDessert = updates.promoDessert;
      if (updates.promoSous !== undefined) config.promoSous = updates.promoSous;
      if (updates.promoDrink !== undefined) config.promoDrink = updates.promoDrink;
      if (updates.promoBaraka !== undefined) config.promoBaraka = updates.promoBaraka;
      if (updates.videoAd !== undefined) config.videoAd = updates.videoAd;

      if (updates.checkConfig !== undefined) {
        config.checkConfig = Object.assign({}, config.checkConfig || {}, updates.checkConfig);
      }

      await pool.query(
        `UPDATE global_config SET version = $1, config_data = $2, last_updated = NOW() WHERE id = 1`,
        [newVersion, JSON.stringify(config)]
      );

      await pool.query(`UPDATE cashiers SET custom_config = NULL, version = 0, updated_at = NOW()`);
      cashiers.forEach(c => {
        delete c.customConfig;
        c.version = 0;
      });
    } else if (targetType === 'region' && targetRegion) {
      const regionCashiers = cashiers.filter(c => c.regionName === targetRegion);
      for (const c of regionCashiers) {
        const newCustom = Object.assign({}, config, c.customConfig || {}, updates, { version: newVersion });
        await pool.query(
          `UPDATE cashiers SET custom_config = $1, version = 0, updated_at = NOW() WHERE ip = $2`,
          [JSON.stringify(newCustom), c.ip]
        );
        c.customConfig = newCustom;
        c.version = 0;
      }
    } else if (targetType === 'branch' && targetBranch) {
      const branchCashiers = cashiers.filter(c => c.branch === targetBranch);
      for (const c of branchCashiers) {
        const newCustom = Object.assign({}, config, c.customConfig || {}, updates, { version: newVersion });
        await pool.query(
          `UPDATE cashiers SET custom_config = $1, version = 0, updated_at = NOW() WHERE ip = $2`,
          [JSON.stringify(newCustom), c.ip]
        );
        c.customConfig = newCustom;
        c.version = 0;
      }
    } else if (targetType === 'ips' && Array.isArray(targetIps)) {
      for (const ip of targetIps) {
        const c = cashiers.find(item => item.ip === ip);
        const newCustom = Object.assign({}, config, (c && c.customConfig) || {}, updates, { version: newVersion });
        await pool.query(
          `UPDATE cashiers SET custom_config = $1, version = 0, updated_at = NOW() WHERE ip = $2`,
          [JSON.stringify(newCustom), ip]
        );
        if (c) {
          c.customConfig = newCustom;
          c.version = 0;
        }
      }
    }

    broadcastUpdate();
    triggerSyncAndApply();
    res.json({ success: true, version: newVersion, config });
  } catch (e) {
    console.error('Error updating config:', e);
    res.status(500).json({ error: e.message });
  }
});

// 3. Media Files

// 2b. Pre-deployment Targeting Preview
app.post('/api/deployments/preview', requireAuth, (req, res) => {
  const { mode = 'FULL', targetType, targetIps, targetBranch, targetRegion, config: reqConfig = {} } = req.body;
  const targets = resolveTargetCashiers(targetType, targetIps, targetBranch, targetRegion);
  const nextVersion = (reqConfig.version || config.version || 0) + 1;
  const mediaFiles = extractConfigMedia(mode, reqConfig);
  
  const missingCentralMedia = mediaFiles.filter(fn => !fs.existsSync(path.join(MEDIA_DIR, fn)));

  const cashiersList = targets.map(c => {
    let status = 'Ready';
    if (c.status === 'offline') {
      status = 'Offline';
    } else if (missingCentralMedia.length > 0) {
      status = 'Warning';
    }
    return {
      ip: c.ip,
      name: c.name || c.computerName || c.ip,
      branch: c.branch || 'Общий зал',
      region: c.regionName || 'Ташкент',
      currentVersion: c.version || 0,
      desiredVersion: nextVersion,
      status,
      missingMedia: missingCentralMedia
    };
  });

  const readyCount = cashiersList.filter(c => c.status === 'Ready').length;
  const offlineCount = cashiersList.filter(c => c.status === 'Offline').length;
  const warningCount = cashiersList.filter(c => c.status === 'Warning').length;

  res.json({
    success: true,
    mode,
    totalSelected: targets.length,
    readyCount,
    offlineCount,
    warningCount,
    desiredVersion: nextVersion,
    mediaFiles,
    missingMedia: missingCentralMedia,
    cashiers: cashiersList
  });
});

// 2c. Asynchronous Deployment Job Initiation (202 Accepted)
app.post('/api/deployments', requireAuth, async (req, res) => {
  try {
    const { mode = 'FULL', targetType = 'ips', targetIps, targetBranch, targetRegion, config: reqConfig = {} } = req.body;
    const targets = resolveTargetCashiers(targetType, targetIps, targetBranch, targetRegion);

    if (targets.length === 0) {
      return res.status(400).json({ error: 'No cashboxes selected for deployment' });
    }

    const nextVersion = (reqConfig.version || config.version || 0) + 1;
    config.version = nextVersion;
    config.lastUpdated = new Date().toISOString();

    const deploymentIds = [];

    for (const cashier of targets) {
      const depId = crypto.randomUUID();
      deploymentIds.push(depId);

      const depConfig = Object.assign({}, config, cashier.customConfig || {}, reqConfig, { version: nextVersion });

      if (targetType === 'ips' || targets.length < cashiers.length) {
        await pool.query(
          `UPDATE cashiers SET custom_config = $1, version = 0, updated_at = NOW() WHERE ip = $2`,
          [JSON.stringify(depConfig), cashier.ip]
        );
        cashier.customConfig = depConfig;
      } else {
        await pool.query(
          `UPDATE global_config SET version = $1, config_data = $2, last_updated = NOW() WHERE id = 1`,
          [nextVersion, JSON.stringify(config)]
        );
      }

      await pool.query(
        `INSERT INTO deployments (id, cashbox_id, target_version, status, current_step, current_step_name, mode, config_data, started_at)
         VALUES ($1, $2, $3, 'PENDING', 0, 'QUEUED', $4, $5, NOW())`,
        [depId, cashier.ip, nextVersion, mode, JSON.stringify(depConfig)]
      );

      runDeploymentJob(depId, cashier.ip, mode, depConfig);
    }

    broadcastUpdate();

    res.status(202).json({
      success: true,
      deployment_id: deploymentIds[0],
      deployment_ids: deploymentIds,
      status: 'PENDING',
      target_ip: targets[0].ip,
      mode,
      count: targets.length,
      message: 'Deployment queued successfully'
    });
  } catch (err) {
    console.error('Error initiating deployment:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2d. Active Deployments Query
app.get('/api/deployments/active', async (req, res) => {
  try {
    const depRes = await pool.query(
      `SELECT * FROM deployments WHERE status IN ('PENDING', 'RUNNING', 'VERIFYING', 'ROLLING_BACK') ORDER BY created_at DESC LIMIT 10`
    );
    res.json({
      success: true,
      active: depRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2e. Deployment Details & Step History
app.get('/api/deployments/:id', async (req, res) => {
  try {
    const depRes = await pool.query(`SELECT * FROM deployments WHERE id = $1`, [req.params.id]);
    if (depRes.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    const stepsRes = await pool.query(
      `SELECT * FROM deployment_steps WHERE deployment_id = $1 ORDER BY step_number ASC`,
      [req.params.id]
    );
    res.json({
      success: true,
      deployment: depRes.rows[0],
      steps: stepsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media', (req, res) => {
  try {
    const allFiles = fs.readdirSync(MEDIA_DIR);
    const validFiles = allFiles.filter(file => {
      const lower = file.toLowerCase();
      if (lower === 'thumbs.db' || lower === 'desktop.ini' || lower.startsWith('.') || lower.endsWith('.zip') || lower.endsWith('.db') || lower.endsWith('.tmp')) {
        return false;
      }
      const ext = path.extname(file).toLowerCase();
      return ALLOWED_IMAGE_EXTS.has(ext) || ALLOWED_VIDEO_EXTS.has(ext);
    });

    const mediaList = validFiles.map(file => {
      const filePath = path.join(MEDIA_DIR, file);
      const stat = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const isImage = ALLOWED_IMAGE_EXTS.has(ext);
      const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
      const meta = isImage ? getImageMetadata(filePath) : { width: 0, height: 0, ratio: '16:9', ratioFormatted: 'Видео' };

      return {
        name: file,
        size: stat.size,
        mtime: stat.mtime,
        url: `/media/${encodeURIComponent(file)}`,
        type: isImage ? 'image' : 'video',
        isImage,
        isVideo,
        dimensions: { width: meta.width, height: meta.height },
        aspectRatio: meta.ratio,
        ratioFormatted: meta.ratioFormatted,
        isFullscreenMatch: meta.isFullscreenMatch,
        isOrderPromoMatch: meta.isOrderPromoMatch
      };
    });

    res.json(mediaList);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Media Upload (Protected)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MEDIA_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, '_');
    cb(null, `${safeName}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/api/media/upload', requireAuth, upload.array('files', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Файлы не загружены' });
  }
  broadcastUpdate();
  triggerSyncAndApply();
  res.json({ success: true, uploaded: req.files.map(f => f.filename) });
});

// Delete Media (Protected)
app.delete('/api/media/:filename', requireAuth, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(MEDIA_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    broadcastUpdate();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Файл не найден' });
  }
});

// 4. Clients / Cashiers Fleet
app.get('/api/clients', (req, res) => {
  res.json({
    serverVersion: config.version,
    cashiers,
    branches,
    regions
  });
});

app.get('/api/cashiers', (req, res) => {
  res.json(cashiers);
});

// Add/Update Cashier (Protected UPSERT)
app.post('/api/cashiers', requireAuth, async (req, res) => {
  const { ip, name, computerName, branch, regionName, notes } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'IP адрес обязателен' });
  }

  const cleanIp = ip.trim();
  const existing = cashiers.find(c => c.ip === cleanIp);

  const cashierData = {
    ip: cleanIp,
    name: name || (existing ? existing.name : `Касса (${cleanIp})`),
    computerName: computerName || (existing ? existing.computerName : cleanIp),
    branch: branch || (existing ? existing.branch : 'Главный зал'),
    regionName: regionName || (existing ? existing.regionName : 'Ташкент'),
    notes: notes !== undefined ? notes : (existing ? existing.notes : ''),
    status: existing ? existing.status : 'offline',
    version: existing ? existing.version : 0,
    guestScreenRunning: existing ? existing.guestScreenRunning : true,
    lastHeartbeat: existing ? existing.lastHeartbeat : null,
    lastSync: existing ? existing.lastSync : null,
    systemInfo: existing ? existing.systemInfo : {},
    monitorsInfo: existing ? existing.monitorsInfo : { count: 2, hasSecondScreen: true },
    customConfig: existing ? existing.customConfig : null
  };

  try {
    await pool.query(`
      INSERT INTO cashiers (
        ip, name, computer_name, branch, region_name, notes, status, version,
        guest_screen_running, system_info, monitors_info, custom_config, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (ip) DO UPDATE SET
        name = EXCLUDED.name,
        computer_name = EXCLUDED.computer_name,
        branch = EXCLUDED.branch,
        region_name = EXCLUDED.region_name,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `, [
      cashierData.ip, cashierData.name, cashierData.computerName, cashierData.branch,
      cashierData.regionName, cashierData.notes, cashierData.status, cashierData.version,
      cashierData.guestScreenRunning, JSON.stringify(cashierData.systemInfo),
      JSON.stringify(cashierData.monitorsInfo), cashierData.customConfig ? JSON.stringify(cashierData.customConfig) : null
    ]);

    const idx = cashiers.findIndex(c => c.ip === cleanIp);
    if (idx !== -1) {
      cashiers[idx] = cashierData;
    } else {
      cashiers.push(cashierData);
    }

    broadcastUpdate();
    triggerSyncAndApply();
    res.json({ success: true, cashier: cashierData });
  } catch (e) {
    console.error('Error in POST /api/cashiers:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Delete Cashier (Protected)
app.delete('/api/cashiers/:ip', requireAuth, async (req, res) => {
  const ip = req.params.ip;
  try {
    await pool.query(`DELETE FROM cashiers WHERE ip = $1`, [ip]);
    cashiers = cashiers.filter(c => c.ip !== ip);
    broadcastUpdate();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Regions API
app.get('/api/regions', (req, res) => {
  res.json(regions);
});

app.post('/api/regions', requireAuth, async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Название региона обязательно' });

  const id = `region-${Date.now()}`;
  try {
    await pool.query(`
      INSERT INTO regions (id, name, color)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO NOTHING
    `, [id, name, color || '#175676']);

    const regRes = await pool.query(`SELECT * FROM regions ORDER BY name ASC`);
    regions = regRes.rows.map(r => ({ id: r.id, name: r.name, color: r.color }));

    broadcastUpdate();
    res.json({ success: true, regions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 6. Branches API
app.get('/api/branches', (req, res) => {
  res.json(branches);
});

app.post('/api/branches', requireAuth, async (req, res) => {
  const { name, region_name, address, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Название филиала обязательно' });

  const id = `branch-${Date.now()}`;
  try {
    await pool.query(`
      INSERT INTO branches (id, name, region_name, address, color)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, name, region_name || 'Ташкент', address || '', color || '#175676']);

    const branchRes = await pool.query(`SELECT * FROM branches ORDER BY name ASC`);
    branches = branchRes.rows.map(b => ({ id: b.id, name: b.name, region_name: b.region_name, address: b.address, color: b.color }));

    broadcastUpdate();
    res.json({ success: true, branches });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Heartbeat from Cashiers (Public for Agent)
const handleHeartbeat = async (req, res) => {
  const { ip, version, guestScreenRunning, systemInfo, monitorsInfo, computerName, name, branch, regionName } = req.body;
  const clientIp = ip || req.ip.replace('::ffff:', '');

  let cashier = cashiers.find(c => c.ip === clientIp);
  const isNew = !cashier;

  if (!cashier) {
    cashier = {
      ip: clientIp,
      name: name || `Касса (${clientIp})`,
      computerName: computerName || clientIp,
      branch: branch || 'Главный зал',
      regionName: regionName || 'Ташкент',
      notes: '',
      status: 'online',
      version: version || 0,
      guestScreenRunning: guestScreenRunning !== undefined ? guestScreenRunning : true,
      lastHeartbeat: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      systemInfo: systemInfo || {},
      monitorsInfo: monitorsInfo || { count: 2, hasSecondScreen: true }
    };
    cashiers.push(cashier);
  } else {
    cashier.status = 'online';
    cashier.lastHeartbeat = new Date().toISOString();
    if (version !== undefined) cashier.version = version;
    if (guestScreenRunning !== undefined) cashier.guestScreenRunning = guestScreenRunning;
    if (systemInfo) cashier.systemInfo = systemInfo;
    if (monitorsInfo) cashier.monitorsInfo = monitorsInfo;
    if (computerName && !cashier.computerName) cashier.computerName = computerName;
    if (name && cashier.name.startsWith('Касса (')) cashier.name = name;
  }

  pool.query(`
    INSERT INTO cashiers (
      ip, name, computer_name, branch, region_name, notes, status, version,
      guest_screen_running, last_heartbeat, last_sync, system_info, monitors_info, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11, NOW())
    ON CONFLICT (ip) DO UPDATE SET
      status = 'online',
      guest_screen_running = EXCLUDED.guest_screen_running,
      version = EXCLUDED.version,
      last_heartbeat = NOW(),
      last_sync = COALESCE(EXCLUDED.last_sync, cashiers.last_sync),
      system_info = EXCLUDED.system_info,
      monitors_info = EXCLUDED.monitors_info,
      updated_at = NOW()
  `, [
    cashier.ip, cashier.name, cashier.computerName, cashier.branch, cashier.regionName,
    cashier.notes, cashier.status, cashier.version, cashier.guestScreenRunning,
    JSON.stringify(cashier.systemInfo || {}), JSON.stringify(cashier.monitorsInfo || {})
  ]).catch(err => console.error('Error in PG Heartbeat Upsert:', err.message));

  broadcastUpdate();

  const effectiveConfig = cashier.customConfig ? cashier.customConfig : config;
  res.json({
    success: true,
    serverVersion: effectiveConfig.version || config.version,
    config: effectiveConfig
  });
};
app.post('/api/heartbeat', handleHeartbeat);
app.post('/api/guestscreen/heartbeat', handleHeartbeat);

// Force Push (Protected)
app.post('/api/push', requireAuth, async (req, res) => {
  const newVer = (config.version || 0) + 1;
  config.version = newVer;

  try {
    await pool.query(
      `UPDATE global_config SET version = $1, config_data = $2, last_updated = NOW() WHERE id = 1`,
      [newVer, JSON.stringify(config)]
    );
    await pool.query(`UPDATE cashiers SET version = 0, updated_at = NOW()`);
    cashiers.forEach(c => {
      if (c.customConfig) c.customConfig.version = newVer;
      c.version = 0;
    });

    broadcastUpdate();
    triggerSyncAndApply();
    res.json({ success: true, version: config.version });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// WebSockets
function broadcastUpdate() {
  const payload = JSON.stringify({
    type: 'UPDATE',
    config,
    cashiers,
    branches,
    regions,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({
    type: 'INIT',
    config,
    cashiers,
    branches,
    regions,
    serverVersion: config.version
  }));
});

// Heartbeat Status Checker & DB Sync
setInterval(async () => {
  try {
    const cashRes = await pool.query(`SELECT * FROM cashiers ORDER BY ip ASC`);
    const now = Date.now();
    let changed = false;

    cashRes.rows.forEach(r => {
      let c = cashiers.find(x => x.ip === r.ip);
      const lastHbDate = r.last_heartbeat ? new Date(r.last_heartbeat) : null;
      const diff = lastHbDate ? (now - lastHbDate.getTime()) / 1000 : 999999;
      const computedStatus = diff < 90 ? 'online' : 'offline';

      if (!c) {
        c = {
          ip: r.ip,
          name: r.name,
          computerName: r.computer_name,
          branch: r.branch,
          regionName: r.region_name || 'Ташкент',
          notes: r.notes || '',
          status: computedStatus,
          version: r.version || 0,
          guestScreenRunning: r.guest_screen_running,
          lastHeartbeat: lastHbDate ? lastHbDate.toISOString() : null,
          lastSync: r.last_sync ? r.last_sync.toISOString() : null,
          systemInfo: r.system_info || {},
          monitorsInfo: r.monitors_info || { count: 2, hasSecondScreen: true },
          customConfig: r.custom_config || null
        };
        cashiers.push(c);
        changed = true;
      } else {
        const hbIso = lastHbDate ? lastHbDate.toISOString() : null;
        if (c.status !== computedStatus || c.lastHeartbeat !== hbIso || c.name !== r.name || c.branch !== r.branch) {
          c.status = computedStatus;
          c.lastHeartbeat = hbIso;
          c.name = r.name;
          c.branch = r.branch;
          c.regionName = r.region_name || 'Ташкент';
          c.guestScreenRunning = r.guest_screen_running;
          c.version = r.version;
          changed = true;
        }
      }
    });

    if (changed) {
      broadcastUpdate();
      pool.query(`
        UPDATE cashiers
        SET status = 'offline', updated_at = NOW()
        WHERE (last_heartbeat < NOW() - INTERVAL '90 seconds' OR last_heartbeat IS NULL) AND status != 'offline'
      `).catch(() => {});
    }
  } catch (err) {
    console.error('Error in status checker / DB sync:', err.message);
  }
}, 5000);

// SPA Fallback: serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path === '/media' || req.path === '/media/') {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  if (req.path.startsWith('/api') || req.path.startsWith('/media/') || req.path.startsWith('/downloads')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Start Server and Connect DB
initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` GuestScreen Central Server running on port ${PORT}`);
    console.log(` Database: PostgreSQL 16 (${DATABASE_URL})`);
    console.log(` Media Directory: ${MEDIA_DIR}`);
    console.log(` Auth Enabled: admin/admin, administrator/123`);
    console.log(`=======================================================`);
  });
}).catch(err => {
  console.error('Fatal Server Startup Error:', err);
});

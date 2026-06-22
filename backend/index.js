const express = require('express');
const path    = require('path');
const multer  = require('multer');
const jwt     = require('jsonwebtoken');
const db      = require('./db');
const app     = express();
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');

app.use(cors());
app.use(express.json());
const PORT       = process.env.PORT       || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_production";


// ---------------------------------------------------------------------------
// Middleware: verify admin JWT
// ---------------------------------------------------------------------------
function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin token required." });
  }
  try {
    const payload = jwt.verify(header.split(" ")[1], JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Admin access only." });
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ---------------------------------------------------------------------------
// Multer setup for photo uploads
// ---------------------------------------------------------------------------
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------------
// Threshold-based hazard detection (fallback when AI is offline)
// ---------------------------------------------------------------------------
function detectHazardFromThresholds(node, body) {
  const { water, smoke, distance, vib, temperature } = body;

  if (node === 'flood_node') {
    if (water > 30 || distance < 15) return { hazard: 'flood', severity: 'high' };
  }

  if (node === 'fire_node' || node.startsWith('fire_node_')) {
    const hotTemp   = temperature > 40;
    const highSmoke = smoke > 100;
    if (temperature > 60 || smoke > 300)       return { hazard: 'fire', severity: 'critical' };
    if ((hotTemp && highSmoke) || smoke > 100) return { hazard: 'fire', severity: 'high' };
    if (hotTemp)                               return { hazard: 'fire', severity: 'high' };
  }

  if (node === 'earthquake_node') {
    if (vib >= 3.0) return { hazard: 'earthquake', severity: 'critical' };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Create alert only if no active alert exists for that node+hazard
// ---------------------------------------------------------------------------
async function createAlertIfNotDuplicate(node, hazard, severity) {
  const [existing] = await db.query(
    `SELECT id FROM alerts WHERE node_id = ? AND hazard_type = ? AND status = 'active' LIMIT 1`,
    [node, hazard]
  );
  if (existing.length > 0) {
    console.log(`Duplicate active alert skipped for ${node} / ${hazard}`);
    return;
  }
  await db.query(
    `INSERT INTO alerts (node_id, hazard_type, severity, status) VALUES (?, ?, ?, 'active')`,
    [node, hazard, severity]
  );
  console.log(`Alert created: ${node} / ${hazard} / ${severity}`);
}

// ---------------------------------------------------------------------------
// IoT device detection
// ---------------------------------------------------------------------------
function isIoTDevice(req) {
  const deviceHeader = (req.headers['x-device'] || '').toLowerCase();
  const userAgent    = (req.headers['user-agent'] || '').toLowerCase();
  return deviceHeader === 'sim800l' || userAgent.includes('sim800l') || req.path === '/api/readings';
}

app.use(express.json());
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/residents", require("./routes/residents"));

// ---------------------------------------------------------------------------
// HTTPS redirect middleware
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const proto = req.headers['x-forwarded-proto'];
  const iot   = isIoTDevice(req);
  console.log(JSON.stringify({
    ts: new Date().toISOString(), method: req.method, path: req.path,
    proto: proto || '(none)', ua: req.headers['user-agent'] || '(none)',
    device: req.headers['x-device'] || '(none)', iot,
  }));
  if (iot)                         return next();
  if (!proto || proto === 'https') return next();
  return res.redirect(301, `https://${req.headers.host}${req.url}`);
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Hazard system server is running!' });
});

// ---------------------------------------------------------------------------
// Receive sensor data from ESP32
// ---------------------------------------------------------------------------
app.post('/api/readings', async (req, res) => {
  res.setHeader('X-Allow-HTTP', 'true');
  const { node, water, smoke, distance, vib, temperature } = req.body;

  // 1. Save reading
  let result;
  try {
    [result] = await db.query(
      `INSERT INTO sensor_readings (node_id, water, smoke, distance, vibration, temperature) VALUES (?, ?, ?, ?, ?, ?)`,
      [node, water, smoke, distance, vib, temperature]
    );
  } catch (err) {
    console.error('DB insert error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
  console.log('Reading saved, ID:', result.insertId);

  // 2. Respond to ESP32 immediately
  res.json({ status: 'ok', id: result.insertId });

 // 3. Build AI classifier request
let classifyUrl  = '';
let classifyBody = {};

if (node === 'flood_node') {
  classifyUrl  = 'https://hazard-ai-production.up.railway.app/classify/flood';
  classifyBody = { water, distance };
} else if (node === 'fire_node' || node.startsWith('fire_node_')) {
  classifyUrl  = 'https://hazard-ai-production.up.railway.app/classify/fire';
  classifyBody = { smoke, temperature };
} else if (node === 'earthquake_node') {
  classifyUrl  = 'https://hazard-ai-production.up.railway.app/classify/earthquake';
  classifyBody = { vibration: vib };
}

if (!classifyUrl) return;

// 4. Try AI classifier; fall back to thresholds if unavailable
try {
  const aiRes    = await fetch(classifyUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(classifyBody),
    signal:  AbortSignal.timeout(5000),
  });
  const aiResult = await aiRes.json();
  console.log('AI classification:', aiResult.hazard);
  if (aiResult.hazard && aiResult.hazard !== 'normal') {
    const severity = aiResult.hazard === 'earthquake' ? 'critical' : 'high';
    await createAlertIfNotDuplicate(node, aiResult.hazard, severity);
  } else {
    const detected = detectHazardFromThresholds(node, req.body);
    if (detected) await createAlertIfNotDuplicate(node, detected.hazard, detected.severity);
  }
} catch (err) {
  console.warn(`AI unavailable (${err.message}), using threshold fallback`);
  const detected = detectHazardFromThresholds(node, req.body);
   if (detected) {
    try { await createAlertIfNotDuplicate(node, detected.hazard, detected.severity); }
    catch (dbErr) { console.error('Fallback alert error:', dbErr.message); }
  }
}
});

// ---------------------------------------------------------------------------
// Sensor history for charts (last 60 readings)
// ---------------------------------------------------------------------------
app.get('/api/readings/history', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 60`
    );
    res.json(results.reverse());
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
app.post('/api/alerts', adminAuth, async (req, res) => {
  const { node, hazard_type, severity } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO alerts (node_id, hazard_type, severity, status) VALUES (?, ?, ?, 'active')`,
      [node, hazard_type, severity]
    );
    res.json({ status: 'ok', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch('/api/alerts/:id', adminAuth, async (req, res) => {
  const { status } = req.body;
  const { id }     = req.params;
  try {
    await db.query('UPDATE alerts SET status = ? WHERE id = ?', [status, id]);
    res.json({ status: 'ok', message: `Alert ${id} updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  try {
    const [[readings], [alerts]] = await Promise.all([
      db.query(`SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1`),
      db.query(`SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC`),
    ]);
    res.json({
      latest_reading: readings[0] || null,
      active_alerts:  alerts,
      alert_count:    alerts.length,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Resident reports
// ---------------------------------------------------------------------------
app.post('/api/reports', upload.single('photo'), async (req, res) => {
  const { hazard_type, location, description, source } = req.body;
  if (!hazard_type || !location) {
    return res.status(400).json({ status: 'error', message: 'hazard_type and location are required' });
  }
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const [result] = await db.query(
      `INSERT INTO reports (hazard_type, location, description, photo_url, source) VALUES (?, ?, ?, ?, ?)`,
      [hazard_type, location, description || null, photo_url, source || 'resident_report']
    );
    res.status(201).json({ status: 'ok', id: result.insertId, photo_url });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch('/api/reports/:id', async (req, res) => {
  const { status } = req.body;
  const { id }     = req.params;
  try {
    await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);
    res.json({ status: 'ok', message: `Report ${id} updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Node profiles
// ---------------------------------------------------------------------------
app.get('/api/node-profiles', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_profiles ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/node-profiles', adminAuth, async (req, res) => {
  const { node_id, owner_name, address, node_type } = req.body;
  if (!node_id || !owner_name || !address) {
    return res.status(400).json({ error: 'node_id, owner_name, and address are required.' });
  }
  try {
    await db.query(
      `INSERT INTO node_profiles (node_id, owner_name, address, node_type) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name), address = VALUES(address), node_type = VALUES(node_type)`,
      [node_id, owner_name, address, node_type || 'fire']
    );
    res.status(201).json({ message: 'Node profile saved.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/api/node-profiles/:node_id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM node_profiles WHERE node_id = ?', [req.params.node_id]);
    res.json({ message: 'Node profile deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
app.get('/api/analytics/summary', adminAuth, async (req, res) => {
  try {
    const [monthly] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, hazard_type, COUNT(*) AS count
      FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month, hazard_type ORDER BY month ASC`);
    const [totals] = await db.query(`
      SELECT hazard_type, COUNT(*) AS count FROM alerts
      GROUP BY hazard_type ORDER BY count DESC`);
    const [nodeActivity] = await db.query(`
      SELECT node_id, COUNT(*) AS count FROM alerts
      GROUP BY node_id ORDER BY count DESC LIMIT 1`);
    const [statusBreakdown] = await db.query(`
      SELECT status, COUNT(*) AS count FROM alerts GROUP BY status`);
    const [peakHours] = await db.query(`
      SELECT HOUR(created_at) AS hour, COUNT(*) AS count FROM alerts
      GROUP BY hour ORDER BY count DESC LIMIT 5`);
    const [dailyTrend] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count FROM alerts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY date ORDER BY date ASC`);
    res.json({ monthly, totals, nodeActivity: nodeActivity[0] || null, statusBreakdown, peakHours, dailyTrend });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/analytics/prediction', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT hazard_type, DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
      FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      GROUP BY hazard_type, month ORDER BY hazard_type, month ASC`);
    const [currentMonth] = await db.query(`
      SELECT hazard_type, COUNT(*) AS count FROM alerts
      WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
      GROUP BY hazard_type`);
    res.json({ rows, currentMonth });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
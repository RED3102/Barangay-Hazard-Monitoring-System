const express = require('express');
const db = require('./db');
const app = express();
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');

app.use(cors());
const PORT = process.env.PORT || 3000;
app.use(express.json());

// ---------------------------------------------------------------------------
// Threshold-based hazard detection (fallback when AI classifier is offline)
// ---------------------------------------------------------------------------
function detectHazardFromThresholds(node, body) {
  const { water, smoke, distance, vib, temperature } = body;

  if (node === 'flood_node') {
    if (water > 500 || distance < 15) return { hazard: 'flood', severity: 'high' };
  }

  if (node === 'fire_node') {
    const hotTemp = temperature > 40;   // above max normal outdoor heat index
    const highSmoke = smoke > 100;

    if (temperature > 60 || smoke > 300)        return { hazard: 'fire', severity: 'critical' };
    if ((hotTemp && highSmoke) || smoke > 100)  return { hazard: 'fire', severity: 'high' };
    if (hotTemp)                                return { hazard: 'fire', severity: 'high' };
  }

  if (node === 'earthquake_node') {
    if (vib >= 3.0) return { hazard: 'earthquake', severity: 'critical' };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Create alert only if no pending alert exists for that node+hazard already
// (prevents duplicate alerts flooding the dashboard on every reading)
// ---------------------------------------------------------------------------
async function createAlertIfNotDuplicate(node, hazard, severity) {
  const checkSql = `
    SELECT id FROM alerts
    WHERE node_id = ? AND hazard_type = ? AND status = 'pending'
    LIMIT 1
  `;
  const [existing] = await db.query(checkSql, [node, hazard]);
  if (existing.length > 0) {
    console.log(`Duplicate pending alert skipped for ${node} / ${hazard}`);
    return;
  }

  const insertSql = `
    INSERT INTO alerts (node_id, hazard_type, severity, status)
    VALUES (?, ?, ?, 'pending')
  `;
  await db.query(insertSql, [node, hazard, severity]);
  console.log(`Alert created: ${node} / ${hazard} / ${severity}`);
}

// ---------------------------------------------------------------------------
// IoT device detection
// ---------------------------------------------------------------------------
function isIoTDevice(req) {
  const deviceHeader = (req.headers['x-device'] || '').toLowerCase();
  const userAgent    = (req.headers['user-agent'] || '').toLowerCase();
  const isIoTPath    = req.path === '/api/readings';

  return (
    deviceHeader === 'sim800l' ||
    userAgent.includes('sim800l') ||
    isIoTPath
  );
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
    ts:     new Date().toISOString(),
    method: req.method,
    path:   req.path,
    proto:  proto || '(none)',
    ua:     req.headers['user-agent'] || '(none)',
    device: req.headers['x-device']  || '(none)',
    iot,
  }));

  if (iot)                          return next();
  if (!proto || proto === 'https')  return next();
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
  const sql = `INSERT INTO sensor_readings 
    (node_id, water, smoke, distance, vibration, temperature) 
    VALUES (?, ?, ?, ?, ?, ?)`;

  let result;
  try {
    [result] = await db.query(sql, [node, water, smoke, distance, vib, temperature]);
  } catch (err) {
    console.error('DB insert error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }

  console.log('Reading saved, ID:', result.insertId);

  // 2. Respond to ESP32 immediately so it isn't kept waiting
  res.json({ status: 'ok', id: result.insertId });

  // 3. Build AI classifier request
  let classifyUrl  = '';
  let classifyBody = {};

  if (node === 'flood_node') {
    classifyUrl = 'https://hazard-ai-production.up.railway.app/classify/flood';
    classifyBody = { water, distance };
  } else if (node === 'fire_node') {
    classifyUrl = 'https://hazard-ai-production.up.railway.app/classify/fire';
    classifyBody = { smoke, temperature };
  } else if (node === 'earthquake_node') {
    classifyUrl = 'https://hazard-ai-production.up.railway.app/classify/earthquake';
    classifyBody = { vibration: vib };
  }

  if (!classifyUrl) return;

  // 4. Try AI classifier first; fall back to thresholds if it's unreachable
  try {
    const aiRes    = await fetch(classifyUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(classifyBody),
      // Abort if AI server doesn't respond within 5 s
      signal:  AbortSignal.timeout(5000),
    });

    const aiResult = await aiRes.json();
    console.log('AI classification:', aiResult.hazard);

    if (aiResult.hazard && aiResult.hazard !== 'normal') {
      const severity = aiResult.severity ||
        (aiResult.hazard === 'earthquake' ? 'critical' : 'high');
      await createAlertIfNotDuplicate(node, aiResult.hazard, severity);
    }

  } catch (err) {
    // AI server is down or timed out — use threshold fallback
    console.warn(`AI classifier unavailable (${err.message}), using threshold fallback`);

    const detected = detectHazardFromThresholds(node, req.body);
    if (detected) {
      try {
        await createAlertIfNotDuplicate(node, detected.hazard, detected.severity);
      } catch (dbErr) {
        console.error('Fallback alert insert error:', dbErr.message);
      }
    }
  }
});

// Get sensor history for charts (last 20 readings)
app.get('/api/readings/history', async (req, res) => {
  const sql = `SELECT * FROM sensor_readings 
    ORDER BY created_at DESC LIMIT 20`;
  try {
    const [results] = await db.query(sql);
    res.json(results.reverse());
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Create a new alert manually
app.post('/api/alerts', async (req, res) => {
  const { node, hazard_type, severity } = req.body;
  const sql = `INSERT INTO alerts 
    (node_id, hazard_type, severity, status) 
    VALUES (?, ?, ?, 'pending')`;
  try {
    const [result] = await db.query(sql, [node, hazard_type, severity]);
    console.log('Alert created, ID:', result.insertId);
    res.json({ status: 'ok', id: result.insertId });
  } catch (err) {
    console.error('Alert insert error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get all alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update alert status (approve or dismiss)
app.patch('/api/alerts/:id', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    await db.query('UPDATE alerts SET status = ? WHERE id = ?', [status, id]);
    res.json({ status: 'ok', message: `Alert ${id} updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Dashboard — latest reading + active alerts
app.get('/api/dashboard', async (req, res) => {
  const latestReading = `SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1`;
  const activeAlerts  = `SELECT * FROM alerts WHERE status = 'pending' ORDER BY created_at DESC`;
  try {
    const [[readings], [alerts]] = await Promise.all([
      db.query(latestReading),
      db.query(activeAlerts),
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
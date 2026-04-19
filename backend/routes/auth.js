// routes/auth.js
// npm install bcryptjs jsonwebtoken  (run this once if not yet installed)

const express   = require("express");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const router    = express.Router();

// ── Adapt this import to match your existing db module ──────────────────────
const db = require("../db");          // adjust path as needed
// Assumes db.execute(sql, params) returns [rows] — mysql2/promise style
// If you use a different driver, swap db.execute() for your equivalent
// ────────────────────────────────────────────────────────────────────────────

const JWT_SECRET       = process.env.JWT_SECRET       || "change_this_in_production";
const ADMIN_USERNAME   = process.env.ADMIN_USERNAME   || "admin";
const ADMIN_PASSWORD   = process.env.ADMIN_PASSWORD   || "barangay_admin_2026";

// ── POST /api/auth/login  (resident) ────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM residents WHERE phone = ?",
      [phone.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    const resident = rows[0];

    const passwordMatch = await bcrypt.compare(password, resident.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    if (resident.status === "pending") {
      return res.status(403).json({
        error:  "Your account is pending approval by the barangay.",
        status: "pending",
      });
    }

    if (resident.status === "rejected") {
      return res.status(403).json({
        error:  "Your registration was not approved. Contact the barangay office.",
        status: "rejected",
      });
    }

    // Approved — issue JWT
    const token = jwt.sign(
      { id: resident.id, role: "resident", name: resident.full_name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id:       resident.id,
        name:     resident.full_name,
        phone:    resident.phone,
        address:  resident.address,
        role:     "resident",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// ── POST /api/auth/admin/login ───────────────────────────────────────────────
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin credentials." });
  }

  const token = jwt.sign(
    { role: "admin", name: "Barangay Official" },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({
    token,
    user: { name: "Barangay Official", role: "admin" },
  });
});

module.exports = router;
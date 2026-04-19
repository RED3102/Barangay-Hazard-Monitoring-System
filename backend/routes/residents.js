// routes/residents.js

const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const router  = express.Router();

const db         = require("../db");   // adjust path as needed
const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_production";

// ── Middleware: verify admin JWT ─────────────────────────────────────────────
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

// ── POST /api/residents/register  (public — resident self-registers) ─────────
router.post("/register", async (req, res) => {
  const { full_name, phone, address, password } = req.body;

  if (!full_name || !phone || !address || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Check duplicate phone
    const [existing] = await db.query(
      "SELECT id FROM residents WHERE phone = ?",
      [phone.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "A resident with that phone number already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO residents (full_name, phone, address, password_hash, status) VALUES (?, ?, ?, ?, 'pending')",
      [full_name.trim(), phone.trim(), address.trim(), password_hash]
    );

    res.status(201).json({ message: "Registration submitted. Awaiting barangay approval." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// ── GET /api/residents  (admin — list all residents) ─────────────────────────
router.get("/", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, phone, address, status, created_at FROM residents ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch residents error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── PATCH /api/residents/:id/approve  (admin) ────────────────────────────────
router.patch("/:id/approve", adminAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE residents SET status = 'approved' WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Resident approved." });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── PATCH /api/residents/:id/reject  (admin) ─────────────────────────────────
router.patch("/:id/reject", adminAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE residents SET status = 'rejected' WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Resident rejected." });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── POST /api/residents/admin-create  (admin creates account directly) ───────
router.post("/admin-create", adminAuth, async (req, res) => {
  const { full_name, phone, address, password } = req.body;

  if (!full_name || !phone || !address || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM residents WHERE phone = ?",
      [phone.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Phone number already registered." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO residents (full_name, phone, address, password_hash, status) VALUES (?, ?, ?, ?, 'approved')",
      [full_name.trim(), phone.trim(), address.trim(), password_hash]
    );

    res.status(201).json({ message: "Resident account created and approved." });
  } catch (err) {
    console.error("Admin create error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
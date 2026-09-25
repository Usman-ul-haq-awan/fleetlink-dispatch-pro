import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, genId, nowISO, CARRIER_COLUMNS, rowToCarrier, rowToUser } from "./db.js";

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret";
const APP_ID = "local-fleetlink-app";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return next();
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch {
    // Invalid token — continue as unauthenticated
  }
  next();
}
app.use(authMiddleware);

// --- Helpers ---
function parseSort(sort) {
  if (!sort) return "created_date DESC";
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return `${field} ${desc ? "DESC" : "ASC"}`;
}

function buildWhere(query) {
  if (!query || typeof query !== "object") return { clause: "", params: [] };
  const clauses = [];
  const params = [];
  for (const [key, value] of Object.entries(query)) {
    if (key === "id" && value && typeof value === "object" && value.$in) {
      const ph = value.$in.map(() => "?").join(",");
      clauses.push(`id IN (${ph})`);
      params.push(...value.$in);
    } else if (value !== undefined && value !== null && typeof value !== "object") {
      clauses.push(`${key} = ?`);
      params.push(String(value));
    }
  }
  return { clause: clauses.length ? clauses.join(" AND ") : "", params };
}

const GENERIC_COLS = ["id", "created_date", "updated_date", "owner", "entity_name", "data"];

function genericSort(sort) {
  if (!sort) return "created_date DESC";
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  if (GENERIC_COLS.includes(field)) return `${field} ${desc ? "DESC" : "ASC"}`;
  return `json_extract(data, '$.${field}') ${desc ? "DESC" : "ASC"}`;
}

function buildGenericWhere(query) {
  if (!query || typeof query !== "object") return { clause: "", params: [] };
  const clauses = [];
  const params = [];
  for (const [key, value] of Object.entries(query)) {
    if (key === "id" && value && typeof value === "object" && value.$in) {
      const ph = value.$in.map(() => "?").join(",");
      clauses.push(`id IN (${ph})`);
      params.push(...value.$in);
    } else if (value !== undefined && value !== null && typeof value !== "object") {
      clauses.push(`json_extract(data, '$.${key}') = ?`);
      params.push(String(value));
    }
  }
  return { clause: clauses.length ? clauses.join(" AND ") : "", params };
}

// --- Health check ---
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- Public settings (called on app boot) ---
app.get("/api/apps/public/prod/public-settings/by-id/:appId", (req, res) => {
  res.json({ id: req.params.appId, public_settings: {} });
});

// --- Auth ---
app.post(`/api/apps/:appId/auth/login`, (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ access_token: token, user: rowToUser(user) });
});

app.post(`/api/apps/:appId/auth/register`, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ message: "User already exists" });
  const hash = bcrypt.hashSync(password, 10);
  const id = genId();
  db.prepare("INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)").run(id, email, hash, "", "user");
  res.json({ success: true });
});

app.post(`/api/apps/:appId/auth/verify-otp`, (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(404).json({ message: "User not found" });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ access_token: token, user: rowToUser(user) });
});

app.post(`/api/apps/:appId/auth/reset-password-request`, (req, res) => {
  res.json({ success: true });
});

app.post(`/api/apps/:appId/auth/reset-password`, (req, res) => {
  res.json({ success: true });
});

app.get(`/api/apps/auth/logout`, (req, res) => {
  res.redirect("/login");
});

// --- User entity ---
app.get(`/api/apps/:appId/entities/User/me`, (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(rowToUser(user));
});

app.put(`/api/apps/:appId/entities/User/me`, (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  const { full_name, role } = req.body;
  db.prepare("UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), updated_date = ? WHERE id = ?")
    .run(full_name, role, nowISO(), req.user.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json(rowToUser(user));
});

// --- Generic entity list/filter ---
app.get(`/api/apps/:appId/entities/:entityName`, (req, res) => {
  const { entityName } = req.params;
  const { sort, limit, skip, q } = req.query;
  const order = parseSort(sort);
  const lim = limit ? parseInt(limit) : 100;
  const off = skip ? parseInt(skip) : 0;

  if (entityName === "Carrier") {
    const { clause, params } = buildWhere(q ? JSON.parse(q) : null);
    const sql = `SELECT * FROM carriers ${clause ? "WHERE " + clause : ""} ORDER BY ${order} LIMIT ? OFFSET ?`;
    const rows = db.prepare(sql).all(...params, lim, off);
    return res.json(rows.map(rowToCarrier));
  }
  if (entityName === "User") {
    const rows = db.prepare(`SELECT * FROM users ORDER BY ${order} LIMIT ? OFFSET ?`).all(lim, off);
    return res.json(rows.map(rowToUser));
  }
  // Generic entities — sort/filter by JSON fields inside the data column
  const { clause, params } = buildGenericWhere(q ? JSON.parse(q) : null);
  const gOrder = genericSort(sort);
  let sql = `SELECT * FROM generic_entities WHERE entity_name = ?`;
  const allParams = [entityName, ...params];
  if (clause) { sql += ` AND (${clause})`; }
  sql += ` ORDER BY ${gOrder} LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...allParams, lim, off);
  return res.json(rows.map((r) => ({ id: r.id, ...JSON.parse(r.data), created_date: r.created_date, updated_date: r.updated_date, owner: r.owner })));
});

// --- Get by ID ---
app.get(`/api/apps/:appId/entities/:entityName/:id`, (req, res) => {
  const { entityName, id } = req.params;
  if (entityName === "Carrier") {
    const row = db.prepare("SELECT * FROM carriers WHERE id = ?").get(id);
    return row ? res.json(rowToCarrier(row)) : res.status(404).json({ message: "Not found" });
  }
  if (entityName === "User") {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return row ? res.json(rowToUser(row)) : res.status(404).json({ message: "Not found" });
  }
  const row = db.prepare("SELECT * FROM generic_entities WHERE entity_name = ? AND id = ?").get(entityName, id);
  return row ? res.json({ id: row.id, ...JSON.parse(row.data), created_date: row.created_date, updated_date: row.updated_date }) : res.status(404).json({ message: "Not found" });
});

// --- Create ---
app.post(`/api/apps/:appId/entities/:entityName`, (req, res) => {
  const { entityName } = req.params;
  const data = req.body;
  const id = data.id || genId();
  const ts = nowISO();
  const owner = req.user?.id || "";

  if (entityName === "Carrier") {
    const cols = CARRIER_COLUMNS.filter((c) => c !== "id" && data[c] !== undefined);
    const vals = cols.map((c) => {
      if (c === "staff_lead_status") return JSON.stringify(data[c] || []);
      if (c === "do_not_contact" || c === "email_sequence_complete") return data[c] ? 1 : 0;
      return data[c] ?? null;
    });
    const placeholders = cols.map(() => "?").join(",");
    db.prepare(`INSERT INTO carriers (id, ${cols.join(",")}, created_date, updated_date, owner) VALUES (?, ${placeholders}, ?, ?, ?)`)
      .run(id, ...vals, ts, ts, owner);
    const row = db.prepare("SELECT * FROM carriers WHERE id = ?").get(id);
    return res.json(rowToCarrier(row));
  }
  if (entityName === "User") {
    const hash = data.password ? bcrypt.hashSync(data.password, 10) : "";
    db.prepare("INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)")
      .run(id, data.email || "", hash, data.full_name || "", data.role || "user");
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return res.json(rowToUser(row));
  }
  // Generic
  db.prepare("INSERT INTO generic_entities (id, entity_name, data, created_date, updated_date, owner) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, entityName, JSON.stringify(data), ts, ts, owner);
  res.json({ id, ...data, created_date: ts, updated_date: ts, owner });
});

// --- Update ---
app.put(`/api/apps/:appId/entities/:entityName/:id`, (req, res) => {
  const { entityName, id } = req.params;
  const data = req.body;
  const ts = nowISO();

  if (entityName === "Carrier") {
    const cols = CARRIER_COLUMNS.filter((c) => c !== "id" && c !== "created_date" && data[c] !== undefined);
    if (cols.length === 0) return res.json({ id });
    const sets = cols.map((c) => {
      if (c === "staff_lead_status") return "staff_lead_status = ?";
      if (c === "do_not_contact" || c === "email_sequence_complete") return `${c} = ?`;
      return `${c} = ?`;
    }).join(", ");
    const vals = cols.map((c) => {
      if (c === "staff_lead_status") return JSON.stringify(data[c] || []);
      if (c === "do_not_contact" || c === "email_sequence_complete") return data[c] ? 1 : 0;
      return data[c];
    });
    db.prepare(`UPDATE carriers SET ${sets}, updated_date = ? WHERE id = ?`).run(...vals, ts, id);
    const row = db.prepare("SELECT * FROM carriers WHERE id = ?").get(id);
    return res.json(rowToCarrier(row));
  }
  if (entityName === "User") {
    const { full_name, role, email } = data;
    db.prepare("UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), email = COALESCE(?, email), updated_date = ? WHERE id = ?")
      .run(full_name, role, email, ts, id);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return res.json(rowToUser(row));
  }
  // Generic
  const row = db.prepare("SELECT * FROM generic_entities WHERE entity_name = ? AND id = ?").get(entityName, id);
  const existing = row ? JSON.parse(row.data) : {};
  const merged = { ...existing, ...data };
  db.prepare("UPDATE generic_entities SET data = ?, updated_date = ? WHERE entity_name = ? AND id = ?")
    .run(JSON.stringify(merged), ts, entityName, id);
  res.json({ id, ...merged, updated_date: ts });
});

// --- Delete by ID ---
app.delete(`/api/apps/:appId/entities/:entityName/:id`, (req, res) => {
  const { entityName, id } = req.params;
  if (entityName === "Carrier") {
    db.prepare("DELETE FROM carriers WHERE id = ?").run(id);
  } else if (entityName === "User") {
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  } else {
    db.prepare("DELETE FROM generic_entities WHERE entity_name = ? AND id = ?").run(entityName, id);
  }
  res.json({ success: true });
});

// --- Delete many ---
app.delete(`/api/apps/:appId/entities/:entityName`, (req, res) => {
  const { entityName } = req.params;
  const query = req.body;
  if (entityName === "Carrier") {
    const { clause, params } = buildWhere(query);
    if (clause) db.prepare(`DELETE FROM carriers WHERE ${clause}`).run(...params);
    else db.prepare("DELETE FROM carriers").run();
  } else if (entityName === "User") {
    const { clause, params } = buildWhere(query);
    if (clause) db.prepare(`DELETE FROM users WHERE ${clause}`).run(...params);
  } else {
    const { clause, params } = buildGenericWhere(query);
    if (clause) db.prepare(`DELETE FROM generic_entities WHERE entity_name = ? AND ${clause}`).run(entityName, ...params);
  }
  res.json({ success: true });
});

// --- Bulk create ---
app.post(`/api/apps/:appId/entities/:entityName/bulk`, (req, res) => {
  const { entityName } = req.params;
  const items = Array.isArray(req.body) ? req.body : [req.body];
  const results = [];
  for (const item of items) {
    const id = item.id || genId();
    const ts = nowISO();
    if (entityName === "Carrier") {
      const cols = CARRIER_COLUMNS.filter((c) => c !== "id" && item[c] !== undefined);
      const vals = cols.map((c) => c === "staff_lead_status" ? JSON.stringify(item[c] || []) : item[c]);
      db.prepare(`INSERT OR REPLACE INTO carriers (id, ${cols.join(",")}, created_date, updated_date) VALUES (?, ${cols.map(() => "?").join(",")}, ?, ?)`)
        .run(id, ...vals, ts, ts);
    } else {
      db.prepare("INSERT OR REPLACE INTO generic_entities (id, entity_name, data, created_date, updated_date) VALUES (?, ?, ?, ?, ?)")
        .run(id, entityName, JSON.stringify(item), ts, ts);
    }
    results.push(id);
  }
  res.json({ created: results.length, ids: results });
});

// --- Update many ---
app.patch(`/api/apps/:appId/entities/:entityName/update-many`, (req, res) => {
  const { entityName } = req.params;
  const { query, data } = req.body;
  const { clause, params } = buildWhere(query);
  if (entityName === "Carrier" && clause) {
    const cols = Object.keys(data).filter((c) => CARRIER_COLUMNS.includes(c));
    if (cols.length) {
      const sets = cols.map((c) => `${c} = ?`).join(", ");
      const vals = cols.map((c) => c === "staff_lead_status" ? JSON.stringify(data[c] || []) : data[c]);
      db.prepare(`UPDATE carriers SET ${sets}, updated_date = ? WHERE ${clause}`).run(...vals, nowISO(), ...params);
    }
  }
  res.json({ success: true });
});

// --- Functions (invoke) ---
app.post(`/api/apps/:appId/functions/:functionName`, (req, res) => {
  const { functionName } = req.params;
  const body = req.body;

  // staffAuthGate — return admin status for admin users
  if (functionName === "staffAuthGate") {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    return res.json({
      role: req.user.role,
      has_staff_record: true,
      approved: true,
      entity_type: "staff",
      has_phone: true,
      has_id: true,
    });
  }

  // All other functions — return a generic success stub
  res.json({ success: true, data: {}, message: `Function ${functionName} not implemented in local backend` });
});

// --- Fallback ---
app.use((req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.path}` });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] FleetLink backend running on port ${PORT}`);
});

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const DB_PATH = process.env.DB_PATH || "/app/data/fleetlink.db";

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

export function genId() {
  return crypto.randomBytes(12).toString("hex");
}

export function nowISO() {
  return new Date().toISOString();
}

// --- Schema ---

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_date TEXT DEFAULT (datetime('iso')),
    updated_date TEXT DEFAULT (datetime('iso'))
  );

  CREATE TABLE IF NOT EXISTS carriers (
    id TEXT PRIMARY KEY,
    carrier_id TEXT DEFAULT '',
    legal_name TEXT DEFAULT '',
    dba_name TEXT DEFAULT '',
    usdot_number TEXT DEFAULT '',
    mc_number TEXT DEFAULT '',
    mx_number TEXT DEFAULT '',
    operating_status TEXT DEFAULT '',
    carrier_type TEXT DEFAULT '',
    entity_type TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    zip TEXT DEFAULT '',
    country TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    fax TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    owner_name TEXT DEFAULT '',
    contact_name TEXT DEFAULT '',
    contact_title TEXT DEFAULT '',
    power_units INTEGER DEFAULT 0,
    drivers INTEGER DEFAULT 0,
    cargo_types TEXT DEFAULT '',
    carrier_segment TEXT DEFAULT '',
    equipment_types TEXT DEFAULT '',
    equipment_quantity TEXT DEFAULT '',
    lead_status TEXT DEFAULT 'Imported',
    lead_score INTEGER DEFAULT 0,
    lead_score_reasons TEXT DEFAULT '',
    safety_qualification TEXT DEFAULT 'Not Assessed',
    safety_reasons TEXT DEFAULT '',
    safety_positive_indicators TEXT DEFAULT '',
    safety_risk_flags TEXT DEFAULT '',
    safety_rating TEXT DEFAULT '',
    data_completeness TEXT DEFAULT '',
    research_status TEXT DEFAULT '',
    safer_url TEXT DEFAULT '',
    sms_url TEXT DEFAULT '',
    last_researched_at TEXT DEFAULT '',
    do_not_contact INTEGER DEFAULT 0,
    dnc_reason TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    email_funnel TEXT DEFAULT '',
    email_funnel_reason TEXT DEFAULT '',
    email_sequence_step INTEGER DEFAULT 0,
    email_next_send_at TEXT DEFAULT '',
    email_sequence_complete INTEGER DEFAULT 0,
    email_first_sent_at TEXT DEFAULT '',
    assigned_to_user_id TEXT DEFAULT '',
    assigned_date TEXT DEFAULT '',
    staff_comment TEXT DEFAULT '',
    staff_comment_date TEXT DEFAULT '',
    staff_lead_status TEXT DEFAULT '[]',
    lead_qual_status TEXT DEFAULT '',
    follow_up_required TEXT DEFAULT '',
    callback_attempted TEXT DEFAULT '',
    priority TEXT DEFAULT '',
    asset TEXT DEFAULT '',
    interest_level TEXT DEFAULT '',
    dispatch_needed TEXT DEFAULT '',
    truck_available TEXT DEFAULT '',
    lead_equipment_type TEXT DEFAULT '',
    number_of_trucks TEXT DEFAULT '',
    decision_maker_contacted TEXT DEFAULT '',
    decision_maker TEXT DEFAULT '',
    tycoon_service_fit TEXT DEFAULT '',
    qualification_result TEXT DEFAULT '',
    created_date TEXT DEFAULT (datetime('iso')),
    updated_date TEXT DEFAULT (datetime('iso')),
    owner TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS generic_entities (
    id TEXT PRIMARY KEY,
    entity_name TEXT NOT NULL,
    data TEXT DEFAULT '{}',
    created_date TEXT DEFAULT (datetime('iso')),
    updated_date TEXT DEFAULT (datetime('iso')),
    owner TEXT DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_carriers_lead_status ON carriers(lead_status);
  CREATE INDEX IF NOT EXISTS idx_carriers_safety ON carriers(safety_qualification);
  CREATE INDEX IF NOT EXISTS idx_carriers_state ON carriers(state);
  CREATE INDEX IF NOT EXISTS idx_carriers_assigned ON carriers(assigned_to_user_id);
  CREATE INDEX IF NOT EXISTS idx_generic_entity ON generic_entities(entity_name);
`);

// --- Default admin user ---
const adminEmail = "admin@fleetlink.com";
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)"
  ).run(genId(), adminEmail, hash, "Admin", "admin");
  console.log("[db] Created default admin user: admin@fleetlink.com / admin123");
}

// --- Carrier column list (for dynamic SQL) ---
export const CARRIER_COLUMNS = db
  .prepare("PRAGMA table_info(carriers)")
  .all()
  .map((c) => c.name);

// Convert a DB carrier row to the API format (parse JSON fields, convert int booleans)
export function rowToCarrier(row) {
  if (!row) return null;
  const out = { ...row };
  out.do_not_contact = !!row.do_not_contact;
  out.email_sequence_complete = !!row.email_sequence_complete;
  try { out.staff_lead_status = JSON.parse(row.staff_lead_status || "[]"); } catch { out.staff_lead_status = []; }
  return out;
}

// Convert a DB user row to the API format
export function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

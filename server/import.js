import { db, genId, nowISO } from "./db.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = join(__dirname, "data", "carriers.xlsx");

// Download the XLSX if not present locally
let fileBuffer;
try {
  fileBuffer = readFileSync(XLSX_PATH);
  console.log("[import] Found local carriers.xlsx");
} catch {
  console.error("[import] carriers.xlsx not found at", XLSX_PATH);
  process.exit(1);
}

const XLSX = await import("xlsx");
const workbook = XLSX.read(fileBuffer, { type: "buffer" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log(`[import] Parsed ${rows.length} rows from XLSX`);

// Check if data already imported
const existing = db.prepare("SELECT COUNT(*) as c FROM carriers").get();
if (existing.c > 0) {
  console.log(`[import] Database already has ${existing.c} carriers — skipping import`);
  process.exit(0);
}

// XLSX column → Carrier entity field
const fieldMap = {
  "Staff Lead Status": "staff_lead_status",
  "Staff Comment": "staff_comment",
  "Allocated On": "assigned_date",
  "Legal Name": "legal_name",
  "DBA Name": "dba_name",
  "USDOT": "usdot_number",
  "MC": "mc_number",
  "MX": "mx_number",
  "Operating Status": "operating_status",
  "State": "state",
  "City": "city",
  "Phone": "phone",
  "Email": "email",
  "Owner": "owner_name",
  "Power Units": "power_units",
  "Drivers": "drivers",
  "Equipment": "equipment_types",
  "Cargo Types": "cargo_types",
  "Safety Qualification": "safety_qualification",
  "Safety Rating": "safety_rating",
  "Lead Score": "lead_score",
  "Lead Status": "lead_status",
  "Last Researched": "last_researched_at",
};

const insert = db.prepare(`
  INSERT INTO carriers (
    id, carrier_id, legal_name, dba_name, usdot_number, mc_number, mx_number,
    operating_status, state, city, phone, email, owner_name, power_units, drivers,
    equipment_types, cargo_types, safety_qualification, safety_rating,
    lead_score, lead_status, last_researched_at, assigned_date, staff_comment,
    staff_lead_status, created_date, updated_date
  ) VALUES (
    @id, @carrier_id, @legal_name, @dba_name, @usdot_number, @mc_number, @mx_number,
    @operating_status, @state, @city, @phone, @email, @owner_name, @power_units, @drivers,
    @equipment_types, @cargo_types, @safety_qualification, @safety_rating,
    @lead_score, @lead_status, @last_researched_at, @assigned_date, @staff_comment,
    @staff_lead_status, @created_date, @updated_date
  )
`);

const tx = db.transaction(() => {
  let count = 0;
  for (const row of rows) {
    // Initialize all named params with defaults so the prepared statement gets every one
    const rec = {
      id: genId(), carrier_id: "", legal_name: "", dba_name: "", usdot_number: "",
      mc_number: "", mx_number: "", operating_status: "", state: "", city: "",
      phone: "", email: "", owner_name: "", power_units: 0, drivers: 0,
      equipment_types: "", cargo_types: "", safety_qualification: "Not Assessed",
      safety_rating: "", lead_score: 0, lead_status: "Imported",
      last_researched_at: "", assigned_date: "", staff_comment: "",
      staff_lead_status: "[]", created_date: nowISO(), updated_date: nowISO(),
    };
    for (const [xlsxKey, fieldName] of Object.entries(fieldMap)) {
      let val = row[xlsxKey];
      if (val === undefined || val === "") continue;

      if (fieldName === "staff_lead_status") {
        // Comma-separated string → JSON array
        const arr = String(val).split(",").map((s) => s.trim()).filter(Boolean);
        rec.staff_lead_status = JSON.stringify(arr);
        continue;
      }
      if (fieldName === "power_units" || fieldName === "drivers" || fieldName === "lead_score") {
        rec[fieldName] = Number(val) || 0;
        continue;
      }
      if (fieldName === "last_researched_at" || fieldName === "assigned_date") {
        // Keep ISO date strings as-is
        rec[fieldName] = String(val);
        continue;
      }
      rec[fieldName] = String(val).trim();
    }
    // carrier_id = usdot or mc
    rec.carrier_id = rec.usdot_number || rec.mc_number || rec.id;
    insert.run(rec);
    count++;
  }
  return count;
});

const inserted = tx();
console.log(`[import] Imported ${inserted} carriers`);

import moment from "moment";

// Extracts a callback date from free-text staff comments.
// Supports common formats the team writes in notes:
//   "12 sep", "12th sept", "12 september 2026", "sep 12",
//   "12/9", "12/9/26", "09-15-2026", "call back on 15th oct"
// Returns a Date or null.
const MONTH_TOKENS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

function pad(n) {
  return String(n).padStart(2, "0");
}

function normalizeMonth(s) {
  // "sept" / "september" -> "sep"
  const m = s.slice(0, 3);
  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].includes(m) ? m : null;
}

function withYear(year) {
  if (year < 100) year += 2000;
  return year;
}

export function extractCallbackDate(comment) {
  if (!comment || typeof comment !== "string") return null;
  const text = comment.toLowerCase().trim();

  // Pattern 1: numeric d/m or d/m/y (e.g. 12/9, 12/9/26, 09-15-2026)
  let m = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = m[3] ? withYear(parseInt(m[3], 10)) : new Date().getFullYear();
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = moment(`${year}-${pad(month)}-${pad(day)}`, "YYYY-MM-DD", true);
      if (d.isValid()) return d.toDate();
    }
  }

  // Pattern 2: "12 sep", "12th sept", "12 september 2026"
  m = text.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_TOKENS})[a-z]*(?:\\s+(\\d{2,4}))?`));
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = normalizeMonth(m[2]);
    const year = m[3] ? withYear(parseInt(m[3], 10)) : new Date().getFullYear();
    if (mon && day >= 1 && day <= 31) {
      const d = moment(`${day} ${mon} ${year}`, "D MMM YYYY");
      if (d.isValid()) return d.toDate();
    }
  }

  // Pattern 3: "sep 12", "september 12th 2026"
  m = text.match(new RegExp(`(${MONTH_TOKENS})[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{2,4}))?`));
  if (m) {
    const mon = normalizeMonth(m[1]);
    const day = parseInt(m[2], 10);
    const year = m[3] ? withYear(parseInt(m[3], 10)) : new Date().getFullYear();
    if (mon && day >= 1 && day <= 31) {
      const d = moment(`${day} ${mon} ${year}`, "D MMM YYYY");
      if (d.isValid()) return d.toDate();
    }
  }

  return null;
}

export function formatCallbackDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Whether a callback date is still pending (not yet approached).
export function isPendingCallback(carrier) {
  const cb = extractCallbackDate(carrier?.staff_comment);
  if (!cb) return false;
  const statuses = Array.isArray(carrier?.staff_lead_status)
    ? carrier.staff_lead_status
    : carrier?.staff_lead_status
    ? [carrier.staff_lead_status]
    : [];
  return !statuses.includes("Approached");
}
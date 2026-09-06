// Best-effort extraction of a callback date from free-text staff comments.
// Returns a Date if a recognizable date is found, otherwise null.
const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

export function extractCallbackDate(text) {
  if (!text) return null;
  const now = new Date();

  // Relative keywords
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) return new Date(now);
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/\bnext week\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }

  // ISO date YYYY-MM-DD
  const iso = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!isNaN(d)) return d;
  }

  // "Month DD, YYYY" or "Month DD"
  const monthFirst = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s*(\d{2,4}))?\b/i
  );
  if (monthFirst) {
    const m = MONTHS[monthFirst[1].toLowerCase()];
    const day = Number(monthFirst[2]);
    let year = monthFirst[3] ? Number(monthFirst[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, m, day);
    if (!isNaN(d)) return d;
  }

  // "DD Month YYYY" or "DD Month"
  const dayFirst = text.match(
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:,?\s*(\d{2,4}))?\b/i
  );
  if (dayFirst) {
    const m = MONTHS[dayFirst[2].toLowerCase()];
    const day = Number(dayFirst[1]);
    let year = dayFirst[3] ? Number(dayFirst[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, m, day);
    if (!isNaN(d)) return d;
  }

  // Numeric DD/MM or DD/MM/YY (PK locale assumes day-first)
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) {
    let a = Number(numeric[1]);
    let b = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    let day, month;
    if (a > 12) {
      day = a;
      month = b - 1;
    } else {
      day = a;
      month = b - 1;
    }
    const d = new Date(year, month, day);
    if (!isNaN(d)) return d;
  }

  return null;
}

export function formatCallbackDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(d) {
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date < today;
}
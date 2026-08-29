// Broker vetting score engine for Tycoon Logistics.
// Rubric (100 points):
//   Active FMCSA authority ......... 20
//   Bond/trust verified ............ 15
//   Company identity verified ...... 10
//   Payment history ................ 20
//   Carrier reviews/reputation ..... 15
//   Time in business ............... 5
//   Load/rate appears legitimate ... 10
//   Fraud/double-broker warning .... 5
// Rating tiers:
//   85-100  Approved
//   70-84   Approved with Caution
//   50-69   High Risk
//   <50     Do Not Use

export function scoreBroker(b) {
  const num = (v) => (typeof v === "number" ? v : parseFloat(v) || 0);
  const breakdown = [];

  // 1. Active FMCSA authority (20)
  let auth = 0;
  if (b.authority_status === "Active" && b.authority_verified) auth = 20;
  else if (b.authority_status === "Active") auth = 12;
  else if (b.authority_verified) auth = 8;
  breakdown.push({ category: "Active FMCSA authority", points: auth, max: 20 });

  // 2. Bond/trust verified (15)
  let bond = 0;
  if (b.bond_verified && b.bond_active && num(b.bond_amount) >= 75000) bond = 15;
  else if (b.bond_verified && b.bond_active) bond = 12;
  else if (b.bond_verified) bond = 8;
  breakdown.push({ category: "Bond/trust verified", points: bond, max: 15 });

  // 3. Company identity verified (10)
  let idFields = [b.broker_name, b.mc_number, b.phone, b.address, b.contact_person, b.email];
  let idCount = idFields.filter((f) => f && String(f).trim()).length;
  let identity = 0;
  if (b.name_matches_authority && idCount >= 5) identity = 10;
  else if (b.name_matches_authority) identity = 7;
  else identity = Math.round((idCount / 6) * 7);
  breakdown.push({ category: "Company identity verified", points: identity, max: 10 });

  // 4. Payment history (20)
  let pay = 20;
  const days = num(b.payment_days_avg);
  if (days > 0) {
    if (days <= 30) pay = 20;
    else if (days <= 45) pay = 15;
    else if (days <= 60) pay = 8;
    else pay = 3;
  } else {
    pay = 10; // unknown
  }
  const nonPay = num(b.non_payment_reports);
  pay -= Math.min(nonPay * 5, 15);
  const slow = num(b.slow_payment_complaints);
  pay -= Math.min(slow * 2, 8);
  pay = Math.max(0, pay);
  breakdown.push({ category: "Payment history", points: pay, max: 20 });

  // 5. Carrier reviews/reputation (15)
  let rev = 0;
  if (b.currently_working_with_carriers) rev += 6;
  const complaints = num(b.cargo_disputes);
  rev += Math.max(0, 9 - complaints * 3);
  rev = Math.min(15, Math.max(0, rev));
  breakdown.push({ category: "Carrier reviews/reputation", points: rev, max: 15 });

  // 6. Time in business (5)
  const yrs = num(b.years_active);
  let tib = 0;
  if (yrs >= 5) tib = 5;
  else if (yrs >= 2) tib = 3;
  else if (yrs >= 1) tib = 2;
  breakdown.push({ category: "Time in business", points: tib, max: 5 });

  // 7. Load/rate appears legitimate (10)
  let load = 0;
  if (b.rate_confirmation_received) load += 5;
  if (!b.load_rate_warning) load += 5;
  load = Math.min(10, load);
  breakdown.push({ category: "Load/rate appears legitimate", points: load, max: 10 });

  // 8. Fraud/double-broker warning check (5)
  let fraud = 5;
  fraud -= Math.min(num(b.fraud_complaints) * 3, 5);
  fraud -= Math.min(num(b.double_brokering_complaints) * 2, 5);
  fraud = Math.max(0, fraud);
  breakdown.push({ category: "Fraud/double-broker warning", points: fraud, max: 5 });

  const score = breakdown.reduce((s, c) => s + c.points, 0);
  let rating;
  if (score >= 85) rating = "Approved";
  else if (score >= 70) rating = "Approved with Caution";
  else if (score >= 50) rating = "High Risk";
  else rating = "Do Not Use";

  return { score, rating, breakdown };
}

export const RATING_COLORS = {
  "Approved": "bg-green-100 text-green-700 border-green-200",
  "Approved with Caution": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "High Risk": "bg-orange-100 text-orange-700 border-orange-200",
  "Do Not Use": "bg-red-100 text-red-700 border-red-200",
  "Not Scored": "bg-slate-100 text-slate-500 border-slate-200",
};

export const RATING_DOT = {
  "Approved": "bg-green-500",
  "Approved with Caution": "bg-yellow-500",
  "High Risk": "bg-orange-500",
  "Do Not Use": "bg-red-500",
  "Not Scored": "bg-slate-400",
};
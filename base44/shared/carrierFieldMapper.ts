// Maps worker response data to carrier fields.
// Shared between researchCarrierBrowser (full write) and auditAuthorizedStatus
// (backfill-only) so both use the same field mapping logic.

export function mapWorkerDataToCarrierFields(data: any): any {
  const c = data?.carrier || {};
  const safer = data?.safer || {};
  const sms = data?.sms || {};
  const contacts = data?.contacts || {};
  const sr = data?.safety_rating || {};

  return {
    legal_name: c.legal_name || undefined,
    dba_name: c.dba || undefined,
    usdot_number: c.usdot || undefined,
    mc_number: c.mc || undefined,
    mx_number: c.mx || undefined,
    operating_status: safer.operating_status || data?.operation_status?.operating_status || undefined,
    entity_type: safer.entity_type || undefined,
    address: c.address || undefined,
    city: c.city || undefined,
    state: c.state || undefined,
    zip: c.zip || undefined,
    country: c.country || undefined,
    phone: contacts.phone || c.phone || undefined,
    fax: contacts.fax || undefined,
    email: contacts.email || undefined,
    owner_name: contacts.owner_name || undefined,
    contact_name: contacts.contact_name || undefined,
    contact_title: contacts.contact_title || undefined,
    power_units: safer.power_units != null ? safer.power_units : undefined,
    drivers: sms.drivers != null ? sms.drivers : (safer.drivers != null ? safer.drivers : undefined),
    cargo_types: safer.cargo || undefined,
    carrier_segment: sms.carrier_segment || safer.carrier_operation || undefined,
    safety_rating: sr.rating || undefined,
    safer_url: safer.source_url || undefined,
    sms_url: sms.source_url || undefined,
  };
}

// Returns only the fields that are currently empty/missing on the carrier,
// so the audit can backfill without overwriting existing data.
export function buildBackfillUpdate(carrier: any, mapped: any): any {
  const update: any = {};
  for (const [key, value] of Object.entries(mapped)) {
    if (value === undefined || value === null || value === "") continue;
    const current = (carrier as any)[key];
    if (current === undefined || current === null || current === "" || current === 0) {
      update[key] = value;
    }
  }
  return update;
}

// Scores how "complete" a carrier record is — used to decide which duplicate
// to keep (the one with more filled fields wins).
export function completenessScore(carrier: any): number {
  const fields = [
    "legal_name", "usdot_number", "mc_number", "operating_status", "address",
    "city", "state", "zip", "phone", "email", "owner_name", "contact_name",
    "power_units", "drivers", "cargo_types", "carrier_segment", "safety_rating",
  ];
  return fields.reduce((score, f) => {
    const v = (carrier as any)[f];
    if (v !== undefined && v !== null && v !== "" && v !== 0) return score + 1;
    return score;
  }, 0);
}
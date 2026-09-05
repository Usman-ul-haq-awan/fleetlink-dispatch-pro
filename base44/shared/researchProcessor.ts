// Shared research logic used by both the user-invoked researchCarrierBrowser
// function and the workflow-triggered runResearchBatch function. Extracted here
// so the processing logic is never duplicated.

import { qualifySafety } from "./safetyEngine.ts";
import { scoreLead } from "./leadScoreEngine.ts";
import { deleteCarrierAndRelated, isExplicitlyUnauthorized } from "./carrierCleanup.ts";

const ALL_STEP_KEYS = ["company_snapshot", "sms_overview", "sms_profile", "carrier_history", "registration", "insurance", "inspection_crash", "safety_rating", "operation_status"];

export function normalizeSteps(steps: string[] | undefined): string[] {
  if (Array.isArray(steps) && steps.length > 0) {
    return Array.from(new Set([...["company_snapshot"], ...steps.filter((s: string) => ALL_STEP_KEYS.includes(s))]));
  }
  return ALL_STEP_KEYS;
}

// Calls the external Playwright browser worker to extract SAFER/SMS data.
// Throws on network error or non-OK worker response — the caller handles.
export async function callBrowserWorker(workerUrl: string, apiKey: string | undefined, usdot: string | undefined, mc: string | undefined, steps: string[]) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-worker-api-key"] = apiKey;
  const res = await fetch(`${workerUrl.replace(/\/$/, "")}/research`, {
    method: "POST",
    headers,
    body: JSON.stringify({ usdot, mc, steps }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Worker returned ${res.status}: ${errText}`);
  }
  return await res.json();
}

// Processes the browser worker response and saves all data to the database
// (carrier update, evidence, crashes, inspections, safety, lead score).
// `base44` is whatever client the caller passes (user-scoped or service-role).
export async function processResearchResult(base44: any, opts: {
  carrierId: string;
  carrier: any;
  data: any;
  selectedSteps: string[];
  now: string;
  requestedUsdot?: string;
  requestedMc?: string;
  workflowName?: string;
}) {
  const { carrierId, carrier, data, selectedSteps, now, requestedUsdot, requestedMc } = opts;
  const workflowName = opts.workflowName || "researchCarrierBrowser";

  // Identity mismatch — do not save data to the wrong carrier
  if (data.identity_verified === false) {
    await base44.entities.ResearchError.create({
      carrier_id: carrierId,
      step: "Identity Validation",
      error_type: "IDENTITY_MISMATCH",
      error_message: "The USDOT on the SAFER page did not match the requested carrier.",
      status: "Manual Review",
      timestamp: now,
    });
    await base44.entities.Carrier.update(carrierId, { research_status: "Failed", lead_status: "Failed" });
    return { success: false, carrier_id: carrierId, error: "IDENTITY_MISMATCH", steps: data.steps || [] };
  }

  // Operating Authority Status gate — remove carriers that are explicitly NOT AUTHORIZED
  if (selectedSteps.includes("operation_status") && data.operation_status) {
    const liveStatus = data.operation_status.operating_status || data.safer?.operating_status || "";
    if (isExplicitlyUnauthorized(liveStatus)) {
      await deleteCarrierAndRelated(base44, carrierId);
      await base44.entities.ActivityLog.create({
        action: "Carrier removed — not authorized (research gate)",
        workflow: workflowName,
        details: `Operating Authority Status: ${liveStatus}`,
        status: "Warning",
        timestamp: now,
      });
      return { success: false, carrier_id: carrierId, not_authorized: true, operating_status: liveStatus, steps: data.steps || [] };
    }
  }

  const c = data.carrier || {};
  const safer = data.safer || {};
  const sms = data.sms || {};
  const contacts = data.contacts || {};
  const sr = data.safety_rating || {};

  // Normalize legacy single-string staff_lead_status to array so schema validation passes
  const normalizedStaffLeadStatus = Array.isArray(carrier.staff_lead_status)
    ? carrier.staff_lead_status
    : (carrier.staff_lead_status ? [carrier.staff_lead_status] : []);

  const carrierUpdate: any = {
    legal_name: c.legal_name || carrier.legal_name,
    dba_name: c.dba || carrier.dba_name,
    usdot_number: c.usdot || requestedUsdot || carrier.usdot_number,
    mc_number: c.mc || requestedMc || carrier.mc_number,
    mx_number: c.mx || carrier.mx_number,
    operating_status: safer.operating_status || carrier.operating_status,
    entity_type: safer.entity_type || carrier.entity_type,
    address: c.address || carrier.address,
    city: c.city || carrier.city,
    state: c.state || carrier.state,
    zip: c.zip || carrier.zip,
    country: c.country || "US",
    phone: contacts.phone || c.phone || carrier.phone,
    fax: contacts.fax || carrier.fax,
    email: contacts.email || carrier.email,
    owner_name: contacts.owner_name || carrier.owner_name,
    contact_name: contacts.contact_name || carrier.contact_name,
    contact_title: contacts.contact_title || carrier.contact_title,
    power_units: safer.power_units != null ? safer.power_units : carrier.power_units,
    drivers: sms.drivers != null ? sms.drivers : (safer.drivers != null ? safer.drivers : carrier.drivers),
    cargo_types: safer.cargo || carrier.cargo_types,
    carrier_segment: sms.carrier_segment || safer.carrier_operation || carrier.carrier_segment,
    safety_rating: sr.rating || carrier.safety_rating,
    safer_url: safer.source_url || carrier.safer_url,
    sms_url: sms.source_url || carrier.sms_url,
    last_researched_at: now,
    research_status: "Browser Complete",
    lead_status: "SAFER Complete",
    staff_lead_status: normalizedStaffLeadStatus,
  };

  // Auto-mark brokers as Approached + Dead Lead — brokers are not dispatch
  // service leads, so they're pre-classified to keep them out of outreach
  // queues. Applies to every carrier researched going forward (discovery +
  // manual research), brokers only.
  const isBroker = /BROKER/i.test(carrierUpdate.entity_type || "")
    || /BROKER/i.test(carrier.carrier_type || "");
  if (isBroker) {
    carrierUpdate.staff_lead_status = ["Approached", "Dead Lead"];
  }

  await base44.entities.Carrier.update(carrierId, carrierUpdate);

  const stepsCompleted: string[] = [];
  const stepsFailed: string[] = [];
  (data.steps || []).forEach((s: any) => {
    if (s.status === "ok") stepsCompleted.push(s.name);
    else if (s.status === "failed") stepsFailed.push(s.name);
  });

  // Evidence records (field-level source tracking)
  const evidenceFields = [
    { name: "legal_name", value: c.legal_name, src: safer.source_url },
    { name: "usdot_number", value: c.usdot, src: safer.source_url },
    { name: "mc_number", value: c.mc, src: safer.source_url },
    { name: "operating_status", value: safer.operating_status, src: safer.source_url },
    { name: "address", value: c.address, src: safer.source_url },
    { name: "phone", value: contacts.phone || c.phone, src: safer.source_url },
    { name: "power_units", value: safer.power_units != null ? String(safer.power_units) : "", src: safer.source_url },
    { name: "drivers", value: (sms.drivers != null ? sms.drivers : safer.drivers) != null ? String(sms.drivers != null ? sms.drivers : safer.drivers) : "", src: sms.source_url || safer.source_url },
    { name: "cargo_types", value: safer.cargo, src: safer.source_url },
    { name: "safety_rating", value: sr.rating, src: sr.source_url || safer.source_url },
    { name: "owner_name", value: contacts.owner_name, src: safer.source_url },
    { name: "email", value: contacts.email, src: safer.source_url },
    { name: "fax", value: contacts.fax, src: safer.source_url },
  ];
  const evRecs = evidenceFields
    .filter(f => f.value && f.value !== "Not Found" && f.value !== "None" && f.value !== "Unknown")
    .map(f => ({
      carrier_id: carrierId,
      field_name: f.name,
      field_value: String(f.value),
      source_name: "SAFER Company Snapshot (Browser)",
      source_url: f.src,
      source_page: "Company Snapshot",
      retrieval_date: now,
      confidence: "High",
      notes: "",
    }));
  if (evRecs.length > 0) await base44.entities.Evidence.bulkCreate(evRecs);

  // Crash + Inspection records from SMS
  if (sms.status === "ok") {
    await base44.entities.CrashRecord.create({
      carrier_id: carrierId,
      total_crashes: sms.total_crashes ?? 0,
      fatal_crashes: sms.fatal_crashes ?? 0,
      injury_crashes: sms.injury_crashes ?? 0,
      towaway_crashes: sms.towaway_crashes ?? 0,
      data_period: sms.data_period || "",
      source_url: sms.source_url,
      retrieval_date: now,
    });
    await base44.entities.InspectionRecord.create({
      carrier_id: carrierId,
      total_inspections: sms.inspections ?? 0,
      source_url: sms.source_url,
      retrieval_date: now,
    });

    const basicRecs = (sms.basics || []).map((b: any) => ({
      carrier_id: carrierId,
      basic_category: b.basic_category,
      measure_value: b.measure_value,
      on_road_percentile: b.on_road_percentile,
      investigation_percentile: b.investigation_percentile,
      violation_count: b.violation_count,
      deficiency_indicator: b.deficiency_indicator,
      source_url: sms.source_url,
      retrieval_date: now,
    }));
    if (basicRecs.length > 0) await base44.entities.SafetyBasic.bulkCreate(basicRecs);
  }

  // Registration details
  if (data.registration && data.registration.status === "ok" && data.registration.details) {
    const regRecs = data.registration.details.map((d: any) => ({
      carrier_id: carrierId,
      field_label: d.label,
      field_value: d.value,
      source: "SMS Registration Details (Browser)",
      source_url: data.registration.source_url,
      retrieval_date: now,
    }));
    if (regRecs.length > 0) await base44.entities.RegistrationDetail.bulkCreate(regRecs);
  }

  // Carrier history
  if (data.carrier_history && data.carrier_history.status === "ok" && data.carrier_history.details) {
    const histRecs = data.carrier_history.details.map((d: any) => ({
      carrier_id: carrierId,
      historical_info: `${d.label}: ${d.value}`,
      source_url: data.carrier_history.source_url,
      retrieval_date: now,
    }));
    if (histRecs.length > 0) await base44.entities.CarrierHistory.bulkCreate(histRecs);
  }

  // Insurance records
  if (data.insurance && data.insurance.status === "ok" && data.insurance.details) {
    const insRecs = data.insurance.details.map((d: any) => ({
      carrier_id: carrierId,
      insurance_type: d.label,
      insurance_company: d.value,
      source_url: data.insurance.source_url,
      retrieval_date: now,
    }));
    if (insRecs.length > 0) await base44.entities.InsuranceRecord.bulkCreate(insRecs);
  }

  // Safety qualification
  const crashRecords = await base44.entities.CrashRecord.filter({ carrier_id: carrierId });
  const inspectionRecords = await base44.entities.InspectionRecord.filter({ carrier_id: carrierId });
  const crashData = crashRecords[0] || {};
  const inspectionData = inspectionRecords[0] || {};

  const safetyResult = qualifySafety({
    safetyRating: carrierUpdate.safety_rating || "",
    operatingStatus: carrierUpdate.operating_status || "",
    outOfServiceDate: "",
    totalCrashes: crashData.total_crashes ?? null,
    fatalCrashes: crashData.fatal_crashes ?? null,
    injuryCrashes: crashData.injury_crashes ?? null,
    towawayCrashes: crashData.towaway_crashes ?? null,
    totalInspections: inspectionData.total_inspections ?? null,
    outOfServiceCount: inspectionData.out_of_service_count ?? null,
    outOfServicePercent: inspectionData.out_of_service_percent || "",
    basicsAlertCount: 0,
    dataCompleteness: "70",
  });

  const totalFields = 20;
  const filledFields = Object.values(carrierUpdate).filter(v => v && v !== "" && v != null).length;
  const completenessPct = Math.round((filledFields / totalFields) * 100);

  await base44.entities.Carrier.update(carrierId, {
    safety_qualification: safetyResult.qualification,
    safety_reasons: safetyResult.reasons.join("; "),
    safety_positive_indicators: safetyResult.positiveIndicators.join("; "),
    safety_risk_flags: safetyResult.riskFlags.join("; "),
    data_completeness: `${completenessPct}%`,
    lead_status: "Safety Complete",
    research_status: "Safety Complete",
  });

  // Lead scoring
  const leadScoreResult = scoreLead({
    operatingStatus: carrierUpdate.operating_status || "",
    equipmentMatch: false,
    hasEmail: !!(carrierUpdate.email || carrier.email),
    hasFax: !!carrierUpdate.fax,
    hasPhone: !!carrierUpdate.phone,
    powerUnits: carrierUpdate.power_units ?? null,
    drivers: carrierUpdate.drivers ?? null,
    safetyQualification: safetyResult.qualification,
    dataCompletenessPct: completenessPct,
    hasWebsite: !!(carrierUpdate.website || carrier.website),
    previousContactOutcome: "",
  });

  const finalStatus =
    safetyResult.qualification === "Qualified" && leadScoreResult.score >= 40
      ? "Ready for Outreach"
      : safetyResult.qualification === "High Risk"
        ? "Do Not Contact"
        : "Needs Review";

  await base44.entities.Carrier.update(carrierId, {
    lead_score: leadScoreResult.score,
    lead_score_reasons: leadScoreResult.reasons.join("; "),
    lead_status: finalStatus,
    research_status: "Complete",
    last_researched_at: now,
  });

  await base44.entities.ActivityLog.create({
    carrier_id: carrierId,
    action: "Browser research completed",
    workflow: workflowName,
    details: `Steps ok: ${stepsCompleted.length}, failed: ${stepsFailed.length}. Safety: ${safetyResult.qualification}. Score: ${leadScoreResult.score}.`,
    status: "Success",
    timestamp: now,
  });

  const updatedCarrier = await base44.entities.Carrier.get(carrierId);

  return {
    success: true,
    carrier_id: carrierId,
    carrier: updatedCarrier,
    steps: data.steps || [],
    steps_completed: stepsCompleted,
    steps_failed: stepsFailed,
    errors: data.errors || [],
    links_discovered: data.links_discovered || {},
    safety: safetyResult,
    lead_score: leadScoreResult,
  };
}
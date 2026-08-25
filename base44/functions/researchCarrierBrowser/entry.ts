// Orchestrator: calls the external Playwright browser worker to extract SAFER/SMS
// data, then saves the structured result into the Base44 database with evidence
// records, runs the safety qualification + lead scoring engines, and returns
// per-section status to the UI.
//
// The browser worker is deployed separately (see browser-worker/README.md).
// Its URL + auth token are stored in the WORKER_URL / WORKER_API_KEY secrets.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { qualifySafety } from "../../shared/safetyEngine.ts";
import { scoreLead } from "../../shared/leadScoreEngine.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { carrier_id, usdot, mc } = body;

    // Find or create the carrier
    let carrier;
    if (carrier_id) {
      carrier = await base44.entities.Carrier.get(carrier_id);
    } else if (usdot) {
      const existing = await base44.entities.Carrier.filter({ usdot_number: String(usdot) });
      carrier = existing.length > 0
        ? existing[0]
        : await base44.entities.Carrier.create({
            carrier_id: crypto.randomUUID(),
            usdot_number: String(usdot),
            lead_status: "Imported",
            safety_qualification: "Not Assessed",
          });
    } else if (mc) {
      const cleanMc = String(mc).replace(/^MC-?/i, "");
      const existing = await base44.entities.Carrier.filter({ mc_number: cleanMc });
      carrier = existing.length > 0
        ? existing[0]
        : await base44.entities.Carrier.create({
            carrier_id: crypto.randomUUID(),
            mc_number: cleanMc,
            lead_status: "Imported",
            safety_qualification: "Not Assessed",
          });
    } else {
      return Response.json({ error: "carrier_id, usdot, or mc is required" }, { status: 400 });
    }

    const carrierId = carrier.id;
    const now = new Date().toISOString();

    // The browser worker must be deployed and its URL configured.
    const workerUrl = secrets.get("WORKER_URL");
    if (!workerUrl) {
      return Response.json({
        success: false,
        carrier_id: carrierId,
        requires_worker: true,
        error: "Browser worker not configured. Deploy the Playwright worker (browser-worker/) and set the WORKER_URL + WORKER_API_KEY secrets in app settings. See browser-worker/README.md.",
      }, { status: 503 });
    }

    await base44.entities.Carrier.update(carrierId, { research_status: "Researching", lead_status: "Researching" });
    await base44.entities.ActivityLog.create({
      carrier_id: carrierId,
      action: "Browser research started",
      workflow: "researchCarrierBrowser",
      status: "Info",
      timestamp: now,
    });

    // Call the external browser worker
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = secrets.get("WORKER_API_KEY");
    if (apiKey) headers["x-worker-api-key"] = apiKey;

    let workerRes: Response;
    try {
      workerRes = await fetch(`${workerUrl.replace(/\/$/, "")}/research`, {
        method: "POST",
        headers,
        body: JSON.stringify({ usdot: usdot || carrier.usdot_number, mc: mc || carrier.mc_number }),
      });
    } catch (err: any) {
      await base44.entities.ResearchError.create({
        carrier_id: carrierId,
        step: "Browser Worker",
        error_type: "NETWORK_ERROR",
        error_message: `Cannot reach browser worker at ${workerUrl}: ${err.message}`,
        retry_count: 0,
        recommended_action: "Verify the worker is deployed and WORKER_URL is correct.",
        status: "Manual Review",
        timestamp: now,
      });
      await base44.entities.Carrier.update(carrierId, { research_status: "Failed", lead_status: "Failed" });
      return Response.json({ success: false, carrier_id: carrierId, error: `Cannot reach worker: ${err.message}` }, { status: 502 });
    }

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      await base44.entities.ResearchError.create({
        carrier_id: carrierId,
        step: "Browser Worker",
        error_type: "Worker Error",
        error_message: `Worker returned ${workerRes.status}: ${errText}`,
        retry_count: 0,
        recommended_action: "Check the worker logs.",
        status: "Manual Review",
        timestamp: now,
      });
      await base44.entities.Carrier.update(carrierId, { research_status: "Failed", lead_status: "Failed" });
      return Response.json({ success: false, carrier_id: carrierId, error: `Worker error: ${workerRes.status}` }, { status: 502 });
    }

    const data: any = await workerRes.json();

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
      return Response.json({ success: false, carrier_id: carrierId, error: "IDENTITY_MISMATCH", steps: data.steps || [] });
    }

    const c = data.carrier || {};
    const safer = data.safer || {};
    const sms = data.sms || {};
    const contacts = data.contacts || {};
    const sr = data.safety_rating || {};

    const carrierUpdate: any = {
      legal_name: c.legal_name || carrier.legal_name,
      dba_name: c.dba || carrier.dba_name,
      usdot_number: c.usdot || usdot || carrier.usdot_number,
      mc_number: c.mc || carrier.mc_number,
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
    };

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

      // SafetyBasic records from the BASIC table
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

    // Registration details (preserve original field labels)
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
      workflow: "researchCarrierBrowser",
      details: `Steps ok: ${stepsCompleted.length}, failed: ${stepsFailed.length}. Safety: ${safetyResult.qualification}. Score: ${leadScoreResult.score}.`,
      status: "Success",
      timestamp: now,
    });

    const updatedCarrier = await base44.entities.Carrier.get(carrierId);

    return Response.json({
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
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
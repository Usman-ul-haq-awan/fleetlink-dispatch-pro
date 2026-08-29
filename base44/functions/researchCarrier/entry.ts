import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { parseSaferSnapshot, parseSmsPage, stripHtml, extractLinks } from "../../shared/saferParser.ts";
import { qualifySafety } from "../../shared/safetyEngine.ts";
import { scoreLead } from "../../shared/leadScoreEngine.ts";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchPage(url: string): Promise<{ html: string; ok: boolean; status: number; finalUrl: string }> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });
    const html = await response.text();
    return { html, ok: response.ok, status: response.status, finalUrl: response.url || url };
  } catch (error) {
    return { html: "", ok: false, status: 0, finalUrl: url };
  }
}

function buildSaferUrl(usdot?: string, mc?: string): string {
  const param = usdot ? "USDOT" : "MC_MX";
  const value = usdot || (mc || "").replace(/^MC-?/i, "");
  return `https://safer.fmcsa.dot.gov/query.asp?query_type=queryCarrierSnapshot&query_param=${param}&query_string=${encodeURIComponent(value)}`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { carrier_id, usdot, mc, step } = body;

    // Find or create carrier
    let carrier;
    if (carrier_id) {
      carrier = await base44.entities.Carrier.get(carrier_id);
    } else if (usdot) {
      const existing = await base44.entities.Carrier.filter({ usdot_number: usdot });
      if (existing.length > 0) {
        carrier = existing[0];
      } else {
        carrier = await base44.entities.Carrier.create({
          carrier_id: crypto.randomUUID(),
          usdot_number: usdot,
          lead_status: "Imported",
          safety_qualification: "Not Assessed",
        });
      }
    } else if (mc) {
      const cleanMc = mc.replace(/^MC-?/i, "");
      const existing = await base44.entities.Carrier.filter({ mc_number: cleanMc });
      if (existing.length > 0) {
        carrier = existing[0];
      } else {
        carrier = await base44.entities.Carrier.create({
          carrier_id: crypto.randomUUID(),
          mc_number: cleanMc,
          lead_status: "Imported",
          safety_qualification: "Not Assessed",
        });
      }
    } else {
      return Response.json({ error: "carrier_id, usdot, or mc is required" }, { status: 400 });
    }

    const carrierId = carrier.id;
    const stepsCompleted: string[] = [];
    const stepsFailed: string[] = [];
    const errors: string[] = [];
    const now = new Date().toISOString();

    // Normalize legacy single-string staff_lead_status to array so schema validation passes
    const normalizedStaffLeadStatus = Array.isArray(carrier.staff_lead_status)
      ? carrier.staff_lead_status
      : (carrier.staff_lead_status ? [carrier.staff_lead_status] : []);

    // Update research status
    await base44.entities.Carrier.update(carrierId, {
      research_status: "Researching",
      lead_status: "Researching",
      staff_lead_status: normalizedStaffLeadStatus,
    });
    await base44.entities.ActivityLog.create({
      carrier_id: carrierId,
      action: "SAFER lookup started",
      workflow: "researchCarrier",
      status: "Info",
      timestamp: now,
    });

    // STEP 1: Fetch SAFER Company Snapshot
    const saferUrl = buildSaferUrl(usdot || carrier.usdot_number, mc || carrier.mc_number);
    const saferResult = await fetchPage(saferUrl);

    if (!saferResult.ok || saferResult.html.length < 500) {
      stepsFailed.push("safer");
      errors.push(`SAFER page fetch failed (status ${saferResult.status})`);
      await base44.entities.ResearchError.create({
        carrier_id: carrierId,
        step: "SAFER Snapshot",
        error_type: "Fetch Error",
        error_message: `SAFER page fetch failed with status ${saferResult.status}. URL: ${saferUrl}`,
        source_url: saferUrl,
        retry_count: 0,
        recommended_action: "Check if USDOT/MC number is valid. Retry may succeed if FMCSA server was temporarily unavailable.",
        status: "Manual Review",
        timestamp: now,
      });
      await base44.entities.Carrier.update(carrierId, { research_status: "Failed", lead_status: "Failed" });
      await base44.entities.ActivityLog.create({
        carrier_id: carrierId,
        action: "SAFER lookup failed",
        workflow: "researchCarrier",
        details: `Status ${saferResult.status}`,
        status: "Error",
        timestamp: now,
      });
      return Response.json({ success: false, carrier_id: carrierId, errors, steps_completed: stepsCompleted, steps_failed: stepsFailed });
    }

    // Parse SAFER data
    const saferData = parseSaferSnapshot(saferResult.html, saferResult.finalUrl);

    // Check if we got real carrier data
    if (!saferData.legalName && !saferData.usdotNumber) {
      stepsFailed.push("safer");
      errors.push("SAFER page did not contain carrier data (carrier may not exist)");
      await base44.entities.ResearchError.create({
        carrier_id: carrierId,
        step: "SAFER Snapshot",
        error_type: "No Data",
        error_message: "SAFER page did not contain carrier identification data. The carrier may not exist or the page structure may have changed.",
        source_url: saferUrl,
        retry_count: 0,
        recommended_action: "Verify the USDOT/MC number is correct.",
        status: "Manual Review",
        timestamp: now,
      });
      return Response.json({ success: false, carrier_id: carrierId, errors, steps_completed: stepsCompleted, steps_failed: stepsFailed });
    }

    // Update carrier with SAFER data - always use new research values (overwrites old data)
    const carrierUpdate: any = {
      legal_name: saferData.legalName || carrier.legal_name,
      dba_name: saferData.dbaName,
      usdot_number: saferData.usdotNumber || usdot || carrier.usdot_number,
      mc_number: saferData.mcNumber,
      mx_number: saferData.mxNumber,
      operating_status: saferData.operatingStatus,
      carrier_type: saferData.carrierType,
      entity_type: saferData.entityType,
      address: saferData.address,
      city: saferData.city,
      state: saferData.state,
      zip: saferData.zip,
      country: "US",
      phone: saferData.phone,
      fax: saferData.fax,
      power_units: saferData.powerUnits,
      drivers: saferData.drivers,
      cargo_types: saferData.cargoTypes,
      carrier_segment: saferData.carrierOperation,
      safety_rating: saferData.safetyRating,
      safer_url: saferResult.finalUrl,
      last_researched_at: now,
      research_status: "SAFER Complete",
      lead_status: "SAFER Complete",
    };

    await base44.entities.Carrier.update(carrierId, carrierUpdate);
    stepsCompleted.push("safer");

    // Create evidence records for each extracted field
    const evidenceFields = [
      { name: "legal_name", value: saferData.legalName, confidence: "High" },
      { name: "usdot_number", value: saferData.usdotNumber, confidence: "High" },
      { name: "mc_number", value: saferData.mcNumber, confidence: "High" },
      { name: "dba_name", value: saferData.dbaName, confidence: "High" },
      { name: "operating_status", value: saferData.operatingStatus, confidence: "High" },
      { name: "address", value: saferData.address, confidence: "High" },
      { name: "phone", value: saferData.phone, confidence: "High" },
      { name: "fax", value: saferData.fax, confidence: "High" },
      { name: "power_units", value: saferData.powerUnits?.toString(), confidence: "High" },
      { name: "drivers", value: saferData.drivers?.toString(), confidence: "High" },
      { name: "cargo_types", value: saferData.cargoTypes, confidence: "High" },
      { name: "safety_rating", value: saferData.safetyRating, confidence: "High" },
    ];

    const evidenceRecords = evidenceFields
      .filter(f => f.value && f.value !== "Not Found" && f.value !== "Unknown")
      .map(f => ({
        carrier_id: carrierId,
        field_name: f.name,
        field_value: f.value!,
        source_name: "SAFER Company Snapshot",
        source_url: saferResult.finalUrl,
        source_page: "Company Snapshot",
        retrieval_date: now,
        confidence: f.confidence,
        notes: "",
      }));

    if (evidenceRecords.length > 0) {
      await base44.entities.Evidence.bulkCreate(evidenceRecords);
    }

    await base44.entities.ActivityLog.create({
      carrier_id: carrierId,
      action: "SAFER lookup completed",
      workflow: "researchCarrier",
      details: `Extracted ${evidenceRecords.length} fields from SAFER Company Snapshot`,
      source_url: saferResult.finalUrl,
      status: "Success",
      timestamp: now,
    });

    // STEP 2: Fetch SMS Results page (if link available)
    if (saferData.smsLink && step !== "safer") {
      const smsUrl = saferData.smsLink.startsWith("http") ? saferData.smsLink : `https://safer.fmcsa.dot.gov/${saferData.smsLink}`;
      await base44.entities.ActivityLog.create({
        carrier_id: carrierId,
        action: "SMS retrieval started",
        workflow: "researchCarrier",
        source_url: smsUrl,
        status: "Info",
        timestamp: now,
      });

      const smsResult = await fetchPage(smsUrl);

      if (smsResult.ok && smsResult.html.length > 500) {
        const smsData = parseSmsPage(smsResult.html, smsResult.finalUrl);

        if (smsData.available) {
          // Create crash record
          await base44.entities.CrashRecord.create({
            carrier_id: carrierId,
            total_crashes: smsData.totalCrashes ?? 0,
            fatal_crashes: smsData.fatalCrashes ?? 0,
            injury_crashes: smsData.injuryCrashes ?? 0,
            towaway_crashes: smsData.towawayCrashes ?? 0,
            data_period: smsData.smsDataPeriod,
            source_url: smsResult.finalUrl,
            retrieval_date: now,
          });

          // Create inspection record
          await base44.entities.InspectionRecord.create({
            carrier_id: carrierId,
            total_inspections: smsData.totalInspections ?? 0,
            inspections_with_violations: smsData.inspectionsWithViolations ?? 0,
            inspections_without_violations: smsData.inspectionsWithoutViolations ?? 0,
            out_of_service_count: smsData.outOfServiceCount ?? 0,
            out_of_service_percent: smsData.outOfServicePercent,
            source_url: smsResult.finalUrl,
            retrieval_date: now,
          });

          // Create evidence for SMS data
          const smsEvidence = [
            { name: "total_inspections", value: smsData.totalInspections?.toString(), confidence: "High" },
            { name: "total_crashes", value: smsData.totalCrashes?.toString(), confidence: "High" },
            { name: "fatal_crashes", value: smsData.fatalCrashes?.toString(), confidence: "High" },
            { name: "injury_crashes", value: smsData.injuryCrashes?.toString(), confidence: "High" },
            { name: "towaway_crashes", value: smsData.towawayCrashes?.toString(), confidence: "High" },
          ].filter(f => f.value && f.value !== "0");

          if (smsEvidence.length > 0) {
            await base44.entities.Evidence.bulkCreate(
              smsEvidence.map(f => ({
                carrier_id: carrierId,
                field_name: f.name,
                field_value: f.value!,
                source_name: "SMS/CSA Results",
                source_url: smsResult.finalUrl,
                source_page: "SMS Overview",
                retrieval_date: now,
                confidence: f.confidence,
                notes: "",
              }))
            );
          }

          stepsCompleted.push("sms");
          await base44.entities.Carrier.update(carrierId, { sms_url: smsResult.finalUrl, lead_status: "SMS Complete", research_status: "SMS Complete" });
          await base44.entities.ActivityLog.create({
            carrier_id: carrierId,
            action: "SMS retrieved",
            workflow: "researchCarrier",
            details: "SMS/CSA data extracted",
            source_url: smsResult.finalUrl,
            status: "Success",
            timestamp: now,
          });
        } else {
          stepsFailed.push("sms");
          errors.push("SMS page did not contain parseable data (may require browser rendering)");
          await base44.entities.ActivityLog.create({
            carrier_id: carrierId,
            action: "SMS retrieval - no data",
            workflow: "researchCarrier",
            details: "SMS page may require JavaScript rendering. Data marked as Not Available.",
            source_url: smsResult.finalUrl,
            status: "Warning",
            timestamp: now,
          });
        }
      } else {
        stepsFailed.push("sms");
        errors.push(`SMS page fetch failed (status ${smsResult.status})`);
      }
    }

    // STEP 3: Fetch Licensing & Insurance page (if link available)
    if (saferData.insuranceLink && step !== "safer" && step !== "sms") {
      const insUrl = saferData.insuranceLink.startsWith("http") ? saferData.insuranceLink : `https://safer.fmcsa.dot.gov/${saferData.insuranceLink}`;
      const insResult = await fetchPage(insUrl);

      if (insResult.ok && insResult.html.length > 500) {
        // Parse insurance page - extract table fields
        const insFields = extractLinks(insResult.html);
        const insText = stripHtml(insResult.html);

        // Check if page has insurance data
        if (insText.toLowerCase().includes("insurance") || insText.toLowerCase().includes("policy")) {
          await base44.entities.InsuranceRecord.create({
            carrier_id: carrierId,
            insurance_type: "General",
            source_url: insResult.finalUrl,
            retrieval_date: now,
            authority_status: carrierUpdate.operating_status || "",
          });

          stepsCompleted.push("insurance");
          await base44.entities.Carrier.update(carrierId, { lead_status: "Insurance Complete", research_status: "Insurance Complete" });
          await base44.entities.ActivityLog.create({
            carrier_id: carrierId,
            action: "Insurance retrieved",
            workflow: "researchCarrier",
            source_url: insResult.finalUrl,
            status: "Success",
            timestamp: now,
          });
        } else {
          stepsFailed.push("insurance");
          errors.push("Insurance page did not contain parseable data (may require browser rendering)");
        }
      } else {
        stepsFailed.push("insurance");
        errors.push(`Insurance page fetch failed (status ${insResult.status})`);
      }
    }

    // STEP 4: Safety Qualification
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

    // Calculate data completeness
    const totalFields = 20;
    const filledFields = Object.values(carrierUpdate).filter(v => v && v !== "" && v !== null && v !== undefined).length;
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

    stepsCompleted.push("safety");

    await base44.entities.ActivityLog.create({
      carrier_id: carrierId,
      action: "Safety qualification generated",
      workflow: "researchCarrier",
      details: `Qualification: ${safetyResult.qualification}. Risk flags: ${safetyResult.riskFlags.length}. Positive indicators: ${safetyResult.positiveIndicators.length}.`,
      status: "Success",
      timestamp: now,
    });

    // STEP 5: Lead Scoring
    const leadScoreResult = scoreLead({
      operatingStatus: carrierUpdate.operating_status || "",
      equipmentMatch: false,
      hasEmail: !!(carrierUpdate.email || carrier.email),
      hasFax: !!(carrierUpdate.fax),
      hasPhone: !!(carrierUpdate.phone),
      powerUnits: carrierUpdate.power_units ?? null,
      drivers: carrierUpdate.drivers ?? null,
      safetyQualification: safetyResult.qualification,
      dataCompletenessPct: completenessPct,
      hasWebsite: !!(carrierUpdate.website || carrier.website),
      previousContactOutcome: "",
    });

    const finalStatus = safetyResult.qualification === "Qualified" && leadScoreResult.score >= 40
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

    stepsCompleted.push("lead_score");

    await base44.entities.ActivityLog.create({
      carrier_id: carrierId,
      action: "Lead score generated",
      workflow: "researchCarrier",
      details: `Score: ${leadScoreResult.score}. Status: ${finalStatus}.`,
      status: "Success",
      timestamp: now,
    });

    const updatedCarrier = await base44.entities.Carrier.get(carrierId);

    return Response.json({
      success: true,
      carrier_id: carrierId,
      steps_completed: stepsCompleted,
      steps_failed: stepsFailed,
      errors,
      carrier: updatedCarrier,
      safety: safetyResult,
      lead_score: leadScoreResult,
      safer_url: saferResult.finalUrl,
      sms_url: saferData.smsLink || "",
      insurance_url: saferData.insuranceLink || "",
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
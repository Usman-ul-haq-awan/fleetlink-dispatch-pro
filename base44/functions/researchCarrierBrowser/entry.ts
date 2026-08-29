// Orchestrator: calls the external Playwright browser worker to extract SAFER/SMS
// data, then saves the structured result into the Base44 database via the shared
// researchProcessor module. User-invoked from the Carrier Research page.
//
// The browser worker is deployed separately (see browser-worker/README.md).
// Its URL + auth token are stored in the WORKER_URL / WORKER_API_KEY secrets.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { normalizeSteps, callBrowserWorker, processResearchResult } from "../../shared/researchProcessor.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { carrier_id, usdot, mc, steps } = body;
    const selectedSteps = normalizeSteps(steps);

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

    const workerUrl = secrets.get("WORKER_URL");
    if (!workerUrl) {
      return Response.json({
        success: false,
        carrier_id: carrierId,
        requires_worker: true,
        error: "Browser worker not configured. Deploy the Playwright worker (browser-worker/) and set the WORKER_URL + WORKER_API_KEY secrets in app settings. See browser-worker/README.md.",
      }, { status: 503 });
    }

    // Normalize legacy single-string staff_lead_status to array so schema validation passes
    const normalizedStaffLeadStatus = Array.isArray(carrier.staff_lead_status)
      ? carrier.staff_lead_status
      : (carrier.staff_lead_status ? [carrier.staff_lead_status] : []);

    await base44.entities.Carrier.update(carrierId, {
      research_status: "Researching",
      lead_status: "Researching",
      staff_lead_status: normalizedStaffLeadStatus,
    });
    await base44.entities.ActivityLog.create({
      carrier_id: carrierId,
      action: "Browser research started",
      workflow: "researchCarrierBrowser",
      status: "Info",
      timestamp: now,
    });

    const apiKey = secrets.get("WORKER_API_KEY");

    let data: any;
    try {
      data = await callBrowserWorker(workerUrl, apiKey, usdot || carrier.usdot_number, mc || carrier.mc_number, selectedSteps);
    } catch (err: any) {
      await base44.entities.ResearchError.create({
        carrier_id: carrierId,
        step: "Browser Worker",
        error_type: err.message?.includes("Worker returned") ? "Worker Error" : "NETWORK_ERROR",
        error_message: err.message,
        retry_count: 0,
        recommended_action: "Verify the worker is deployed and WORKER_URL is correct.",
        status: "Manual Review",
        timestamp: now,
      });
      await base44.entities.Carrier.update(carrierId, { research_status: "Failed", lead_status: "Failed" });
      return Response.json({ success: false, carrier_id: carrierId, error: err.message }, { status: 502 });
    }

    const result = await processResearchResult(base44, {
      carrierId,
      carrier,
      data,
      selectedSteps,
      now,
      requestedUsdot: usdot,
      requestedMc: mc,
      workflowName: "researchCarrierBrowser",
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
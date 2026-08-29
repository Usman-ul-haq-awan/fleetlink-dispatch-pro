// Server-side batch research runner — invoked by the "Scheduled Research" workflow
// every 5 minutes. Runs as the service role (no user session needed), so it keeps
// working even when no one has the app open. Picks up carriers with lead_status
// "Imported" and researches them through the same browser worker + shared processor
// as the user-invoked researchCarrierBrowser function.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { normalizeSteps, callBrowserWorker, processResearchResult } from "../../shared/researchProcessor.ts";

const BATCH_SIZE = 3;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const workerUrl = secrets.get("WORKER_URL");
    if (!workerUrl) {
      return Response.json({ success: false, error: "WORKER_URL not configured", processed: 0 });
    }
    const apiKey = secrets.get("WORKER_API_KEY");
    const selectedSteps = normalizeSteps(undefined);

    // Pick the oldest imported carriers that have a USDOT or MC to research.
    const queue = await svc.entities.Carrier.filter({ lead_status: "Imported" }, "created_date", BATCH_SIZE * 2);
    const eligible = queue.filter((c: any) => c.usdot_number || c.mc_number).slice(0, BATCH_SIZE);

    if (eligible.length === 0) {
      return Response.json({ success: true, processed: 0, succeeded: 0, failed: 0, remaining: 0, message: "No imported carriers waiting for research." });
    }

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const carrier of eligible) {
      const carrierId = carrier.id;
      const now = new Date().toISOString();

      try {
        // Normalize legacy single-string staff_lead_status to array so schema validation passes
        const normalizedStaffLeadStatus = Array.isArray(carrier.staff_lead_status)
          ? carrier.staff_lead_status
          : (carrier.staff_lead_status ? [carrier.staff_lead_status] : []);
        await svc.entities.Carrier.update(carrierId, {
          research_status: "Researching",
          lead_status: "Researching",
          staff_lead_status: normalizedStaffLeadStatus,
        });
        await svc.entities.ActivityLog.create({
          carrier_id: carrierId,
          action: "Scheduled research started",
          workflow: "runResearchBatch",
          status: "Info",
          timestamp: now,
        });

        const data = await callBrowserWorker(workerUrl, apiKey, carrier.usdot_number, carrier.mc_number, selectedSteps);
        await processResearchResult(svc, {
          carrierId,
          carrier,
          data,
          selectedSteps,
          now,
          requestedUsdot: carrier.usdot_number,
          requestedMc: carrier.mc_number,
          workflowName: "runResearchBatch",
        });
        succeeded++;
      } catch (err: any) {
        failed++;
        errors.push(`${carrier.usdot_number || carrier.mc_number || carrierId}: ${err.message}`);
        try {
          await svc.entities.ResearchError.create({
            carrier_id: carrierId,
            step: "Browser Worker",
            error_type: err.message?.includes("Worker returned") ? "Worker Error" : "NETWORK_ERROR",
            error_message: err.message,
            retry_count: 0,
            recommended_action: "Will be retried on the next scheduled run if still Imported.",
            status: "Manual Review",
            timestamp: now,
          });
          await svc.entities.Carrier.update(carrierId, {
            research_status: "Failed",
            lead_status: "Failed",
            staff_lead_status: Array.isArray(carrier.staff_lead_status)
              ? carrier.staff_lead_status
              : (carrier.staff_lead_status ? [carrier.staff_lead_status] : []),
          });
        } catch {}
      }
    }

    // Count how many imported carriers remain for the next run
    const remaining = await svc.entities.Carrier.filter({ lead_status: "Imported" }, "created_date", 1);

    return Response.json({
      success: true,
      processed: eligible.length,
      succeeded,
      failed,
      remaining: remaining.length,
      errors,
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
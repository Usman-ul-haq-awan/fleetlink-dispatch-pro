// Server-side auto-research runner — processes a larger batch of imported
// carriers in a single invocation. Runs entirely on the server (service role),
// so it is NOT affected by app updates, hot reloads, or browser navigation.
// Triggered on demand from the Carrier Research page, and also usable by a
// scheduled workflow for continuous background processing.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { normalizeSteps, callBrowserWorker, processResearchResult } from "../../shared/researchProcessor.ts";

const BATCH_SIZE = 12;       // carriers per invocation
const CONCURRENCY = 3;       // parallel worker calls

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

    // Accept an optional batch size override from the payload.
    let body: any = {};
    try { body = await req.json(); } catch {}
    const batchSize = Math.min(Math.max(parseInt(body?.batch_size, 10) || BATCH_SIZE, 1), 25);

    // Pull imported carriers that have a USDOT or MC to research.
    const queue = await svc.entities.Carrier.filter({ lead_status: "Imported" }, "created_date", batchSize * 3);
    const eligible = queue.filter((c: any) => c.usdot_number || c.mc_number).slice(0, batchSize);

    if (eligible.length === 0) {
      return Response.json({
        success: true, processed: 0, succeeded: 0, failed: 0, remaining: 0,
        message: "No imported carriers waiting for research.",
      });
    }

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    // Mark all as Researching up front so concurrent runs don't double-process.
    // Normalize legacy single-string staff_lead_status to array so schema validation passes.
    await Promise.all(eligible.map((c: any) => {
      const normalized = Array.isArray(c.staff_lead_status)
        ? c.staff_lead_status
        : (c.staff_lead_status ? [c.staff_lead_status] : []);
      return svc.entities.Carrier.update(c.id, {
        research_status: "Researching",
        lead_status: "Researching",
        staff_lead_status: normalized,
      });
    }));

    // Process in concurrency-limited batches.
    for (let i = 0; i < eligible.length; i += CONCURRENCY) {
      const chunk = eligible.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(async (carrier: any) => {
        const carrierId = carrier.id;
        const now = new Date().toISOString();
        try {
          await svc.entities.ActivityLog.create({
            carrier_id: carrierId,
            action: "Server-side auto-research started",
            workflow: "runAutoResearch",
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
            workflowName: "runAutoResearch",
          });
          return true;
        } catch (err: any) {
          errors.push(`${carrier.usdot_number || carrier.mc_number || carrierId}: ${err.message}`);
          try {
            await svc.entities.ResearchError.create({
              carrier_id: carrierId,
              step: "Browser Worker",
              error_type: "NETWORK_ERROR",
              error_message: err.message,
              retry_count: 0,
              recommended_action: "Will be retried on the next run if still Imported.",
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
          return false;
        }
      }));
      succeeded += results.filter(Boolean).length;
      failed += results.filter((r) => !r).length;
    }

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
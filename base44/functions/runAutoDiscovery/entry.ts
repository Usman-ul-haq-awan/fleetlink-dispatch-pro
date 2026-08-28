// Server-side MC-number discovery — runs entirely on the Base44 server, so it
// keeps working through app updates, hot reloads, and browser navigation.
// Iterates MC numbers (from a start point or max-MC-in-DB + 1), researches each
// via the browser worker, keeps valid carriers, and deletes invalid/not-found
// ones. Processes a bounded batch per call; the UI auto-continues with the
// returned next_mc until the target carrier count is reached.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { normalizeSteps, callBrowserWorker, processResearchResult } from "../../shared/researchProcessor.ts";
import { deleteCarrierAndRelated } from "../../shared/carrierCleanup.ts";

const DEFAULT_BATCH = 8;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const workerUrl = secrets.get("WORKER_URL");
    if (!workerUrl) {
      return Response.json({ success: false, error: "WORKER_URL not configured" }, { status: 503 });
    }
    const apiKey = secrets.get("WORKER_API_KEY");
    const selectedSteps = normalizeSteps(undefined);

    let body: any = {};
    try { body = await req.json(); } catch {}
    const batchSize = Math.min(Math.max(parseInt(body?.batch_size, 10) || DEFAULT_BATCH, 1), 15);
    const startMc = body?.start_mc ? parseInt(body.start_mc, 10) : null;
    const targetCount = Math.max(1, parseInt(body?.target_count, 10) || 200);

    // Determine starting MC.
    let currentMc: number;
    if (startMc && !isNaN(startMc)) {
      currentMc = startMc - 1; // loop pre-increments, so first attempt = startMc
    } else {
      // Find the max MC number currently in the database.
      let maxMc = 0;
      let skip = 0;
      const pageLimit = 5000;
      while (true) {
        const page = await svc.entities.Carrier.list("-created_date", pageLimit, skip);
        if (!page || page.length === 0) break;
        page.forEach((c: any) => {
          const num = parseInt(String(c.mc_number || "").replace(/[^0-9]/g, ""), 10);
          if (!isNaN(num) && num > maxMc) maxMc = num;
        });
        if (page.length < pageLimit) break;
        skip += pageLimit;
      }
      currentMc = maxMc;
    }

    let found = 0;
    let failed = 0;
    let attempted = 0;
    let lastMc = currentMc;
    const errors: string[] = [];

    // Count current carrier total to gauge progress toward target.
    let totalCarriers = 0;
    {
      let skip = 0;
      while (true) {
        const page = await svc.entities.Carrier.list("-created_date", 5000, skip);
        if (!page || page.length === 0) break;
        totalCarriers += page.length;
        if (page.length < 5000) break;
        skip += 5000;
      }
    }

    while (attempted < batchSize && totalCarriers < targetCount) {
      currentMc += 1;
      lastMc = currentMc;
      const mcStr = String(currentMc);

      // Skip if a carrier with this MC already exists.
      const existing = await svc.entities.Carrier.filter({ mc_number: mcStr });
      if (existing.length > 0) {
        attempted += 1;
        continue;
      }

      attempted += 1;
      const now = new Date().toISOString();

      // Create a placeholder carrier, then research it in place.
      const carrier = await svc.entities.Carrier.create({
        carrier_id: crypto.randomUUID(),
        mc_number: mcStr,
        lead_status: "Imported",
        safety_qualification: "Not Assessed",
      });

      try {
        await svc.entities.Carrier.update(carrier.id, { research_status: "Researching", lead_status: "Researching" });
        const data = await callBrowserWorker(workerUrl, apiKey, undefined, mcStr, selectedSteps);
        const result = await processResearchResult(svc, {
          carrierId: carrier.id,
          carrier,
          data,
          selectedSteps,
          now,
          requestedMc: mcStr,
          workflowName: "runAutoDiscovery",
        });

        if (result.success && result.carrier && result.carrier.legal_name) {
          found += 1;
          totalCarriers += 1;
        } else if (result.not_authorized) {
          // processResearchResult already deleted the carrier.
          failed += 1;
        } else {
          // No real carrier found for this MC — clean up the placeholder.
          try { await deleteCarrierAndRelated(svc, carrier.id); } catch {}
          failed += 1;
        }
      } catch (err: any) {
        failed += 1;
        errors.push(`MC-${mcStr}: ${err.message}`);
        try { await deleteCarrierAndRelated(svc, carrier.id); } catch {}
      }
    }

    return Response.json({
      success: true,
      found,
      failed,
      attempted,
      next_mc: lastMc + 1,
      total_carriers: totalCarriers,
      target_reached: totalCarriers >= targetCount,
      errors,
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
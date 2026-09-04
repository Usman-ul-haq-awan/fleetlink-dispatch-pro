// Server-side MC-number discovery — runs entirely on the Base44 server via a
// scheduled workflow (every 2 minutes), so it keeps working through app
// updates, browser navigation, AND internet disconnections on the user's
// machine. The workflow calls this function; the function only does work when
// the `discovery_enabled` AppSetting is "true". When the target carrier count
// is reached, it auto-disables itself so the workflow becomes a no-op until
// the user starts it again.
//
// Iterates MC numbers (from a stored start point or max-MC-in-DB + 1),
// researches each via the browser worker, keeps valid carriers, and deletes
// invalid/not-found ones. Processes a bounded batch per call.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { normalizeSteps, callBrowserWorker, processResearchResult } from "../../shared/researchProcessor.ts";
import { deleteCarrierAndRelated } from "../../shared/carrierCleanup.ts";

const DEFAULT_BATCH = 8;
const DEFAULT_TARGET = 200;

async function getSetting(svc: any, key: string): Promise<string | null> {
  try {
    const rows = await svc.entities.AppSetting.filter({ setting_key: key });
    return rows && rows.length > 0 ? rows[0].setting_value : null;
  } catch {
    return null;
  }
}

async function setSetting(svc: any, key: string, value: string, category = "batch", type = "string", description = "") {
  try {
    const rows = await svc.entities.AppSetting.filter({ setting_key: key });
    if (rows && rows.length > 0) {
      await svc.entities.AppSetting.update(rows[0].id, { setting_value: value });
    } else {
      await svc.entities.AppSetting.create({
        setting_key: key,
        setting_value: value,
        setting_category: category,
        setting_type: type,
        description,
      });
    }
  } catch {}
}

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

    // Read runtime config from AppSettings (so the scheduled workflow can call
    // this with no args and still respect the user's target / start MC).
    const enabledVal = await getSetting(svc, "discovery_enabled");
    const enabled = enabledVal !== "false"; // default ON unless explicitly disabled
    if (!enabled) {
      return Response.json({ success: true, skipped: true, message: "Discovery engine is stopped." });
    }

    // target_count = how many NEW carriers to discover this run (not a DB total).
    const targetCount = Math.max(
      1,
      parseInt(body?.target_count, 10) || parseInt((await getSetting(svc, "discovery_target_count")) || "", 10) || DEFAULT_TARGET
    );
    // Persistent progress: new carriers found so far in this run.
    const foundStart = Math.max(0, parseInt((await getSetting(svc, "discovery_found_count")) || "", 10) || 0);
    // Persistent cursor: next MC to try. Set on start; advanced each call so
    // we never re-check MC numbers that already failed.
    const cursorRaw = await getSetting(svc, "discovery_cursor");
    const cursor = cursorRaw ? parseInt(cursorRaw, 10) : NaN;

    // Determine starting MC.
    let currentMc: number;
    let maxMc = 0;
    // Build a set of all existing MC digit sequences so discovery skips
    // duplicates regardless of how the MC was stored ("122019" vs "MC-122019"
    // vs "MC-116446 MC-125894"). Previously this only checked exact string
    // match via a per-MC filter call, which missed format variants.
    const existingMcDigits = new Set<string>();
    {
      let skip = 0;
      const pageLimit = 5000;
      while (true) {
        const page = await svc.entities.Carrier.list("-created_date", pageLimit, skip);
        if (!page || page.length === 0) break;
        page.forEach((c: any) => {
          const raw = String(c.mc_number || "");
          // Add every digit sequence to the dedup set.
          (raw.match(/\d+/g) || []).forEach((d: string) => {
            const n = parseInt(d, 10);
            if (!isNaN(n) && n < 2000000) existingMcDigits.add(d);
          });
          // Conservative maxMc: prefer explicit "MC-123456" token; fall back
          // to pure digits only when reasonable (<= 7 digits), so garbage
          // like "88058862680226" or "FF-57191 MC-684565" can't poison the cursor.
          const mcMatch = raw.match(/MC-?\s*(\d+)/i);
          let num: number | null = null;
          if (mcMatch) {
            num = parseInt(mcMatch[1], 10);
          } else {
            const digits = raw.replace(/[^0-9]/g, "");
            if (digits && digits.length <= 7) num = parseInt(digits, 10);
          }
          if (num !== null && !isNaN(num) && num > maxMc && num < 2000000) maxMc = num;
        });
        if (page.length < pageLimit) break;
        skip += pageLimit;
      }
    }
    // Resume from the cursor if set; otherwise continue from the DB max.
    if (!isNaN(cursor) && cursor > 0) {
      currentMc = cursor - 1; // loop pre-increments
    } else {
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

    while (attempted < batchSize && (foundStart + found) < targetCount) {
      currentMc += 1;
      lastMc = currentMc;
      const mcStr = String(currentMc);

      // Skip if a carrier with this MC already exists (normalized digit check).
      if (existingMcDigits.has(mcStr)) {
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

    const totalFound = foundStart + found;
    const targetReached = totalFound >= targetCount;
    // Persist progress + cursor so the next scheduled call continues cleanly.
    await setSetting(svc, "discovery_found_count", String(totalFound), "batch", "number", "New carriers found in the current discovery run");
    await setSetting(svc, "discovery_cursor", String(lastMc + 1), "batch", "number", "Next MC number to try for discovery");
    // Auto-disable when the target is reached; reset progress for next run.
    if (targetReached) {
      await setSetting(svc, "discovery_enabled", "false", "batch", "boolean", "Server-side discovery engine running state");
      await setSetting(svc, "discovery_found_count", "0", "batch", "number", "New carriers found in the current discovery run");
      await setSetting(svc, "discovery_cursor", "", "batch", "number", "Next MC number to try for discovery");
    }

    return Response.json({
      success: true,
      found,
      failed,
      attempted,
      found_this_run: totalFound,
      next_mc: lastMc + 1,
      total_carriers: totalCarriers,
      target_count: targetCount,
      target_reached: targetReached,
      auto_disabled: targetReached,
      errors,
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
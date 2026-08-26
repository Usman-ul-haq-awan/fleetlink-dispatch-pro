// Audits the carrier database for operating authority status.
// For each carrier:
//   1. If operating_status is already stored, check it immediately.
//   2. If operating_status is missing, call the browser worker to fetch the
//      Company Snapshot and check the live status.
// Carriers whose status does NOT contain "AUTHORIZED FOR" are removed from
// the database along with all their related child records.
//
// Processes a bounded batch per call (max_worker_checks) to avoid timeouts.
// Returns progress so the frontend can call again until all carriers are audited.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { deleteCarrierAndRelated, isAuthorizedStatus, isExplicitlyUnauthorized } from "../../shared/carrierCleanup.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const maxWorkerChecks: number = Math.min(parseInt(body.max_worker_checks, 10) || 30, 50);
    const maxDeletions: number = Math.min(parseInt(body.max_deletions, 10) || 20, 30);

    const now = new Date().toISOString();
    const workerUrl = secrets.get("WORKER_URL");
    const apiKey = secrets.get("WORKER_API_KEY");

    // Load carriers (bounded to avoid rate limits; frontend calls repeatedly)
    const carriers = await base44.entities.Carrier.list("-updated_date", 500);

    let checkedFromStored = 0;
    let checkedFromWorker = 0;
    let removedCount = 0;
    let keptCount = 0;
    let workerCallsUsed = 0;
    const removedCarriers: any[] = [];

    for (const carrier of carriers) {
      if (removedCount >= maxDeletions && workerCallsUsed >= maxWorkerChecks) break;

      const opStatus = (carrier.operating_status || "").trim();

      if (opStatus) {
        // Already have operating status stored — check immediately.
        // Only remove carriers that are EXPLICITLY unauthorized ("NOT AUTHORIZED"
        // or "OUT-OF-SERVICE"). Carriers with ambiguous values like "ACTIVE"
        // (which is the USDOT Status, not the Operating Authority Status) are
        // skipped — they need a worker re-check to get the real authority status.
        if (isExplicitlyUnauthorized(opStatus)) {
          if (removedCount >= maxDeletions) continue;
          await deleteCarrierAndRelated(base44, carrier.id);
          checkedFromStored++;
          removedCount++;
          removedCarriers.push({
            id: carrier.id,
            legal_name: carrier.legal_name || "",
            usdot: carrier.usdot_number || "",
            mc: carrier.mc_number || "",
            operating_status: opStatus,
          });
          await base44.entities.ActivityLog.create({
            action: "Carrier removed by authority audit (stored status)",
            details: `${carrier.legal_name || carrier.usdot_number || carrier.id}: ${opStatus}`,
            status: "Warning",
            timestamp: now,
          });
        } else if (isAuthorizedStatus(opStatus)) {
          checkedFromStored++;
          keptCount++;
        } else {
          // Ambiguous status (e.g. "ACTIVE") — treat as unchecked, needs worker
          checkedFromStored++;
          // Don't count as kept or removed — fall through to worker check below
          if (!workerUrl || workerCallsUsed >= maxWorkerChecks) continue;
          workerCallsUsed++;
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (apiKey) headers["x-worker-api-key"] = apiKey;
          try {
            const workerRes = await fetch(`${workerUrl.replace(/\/$/, "")}/research`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                usdot: carrier.usdot_number,
                mc: carrier.mc_number,
                steps: ["company_snapshot", "operation_status"],
              }),
            });
            if (!workerRes.ok) continue;
            const data: any = await workerRes.json();
            checkedFromWorker++;
            const liveStatus = data?.safer?.operating_status || data?.operation_status?.operating_status || "";
            if (isExplicitlyUnauthorized(liveStatus)) {
              if (removedCount >= maxDeletions) continue;
              await deleteCarrierAndRelated(base44, carrier.id);
              removedCount++;
              removedCarriers.push({
                id: carrier.id,
                legal_name: carrier.legal_name || data?.carrier?.legal_name || "",
                usdot: carrier.usdot_number || "",
                mc: carrier.mc_number || "",
                operating_status: liveStatus,
              });
              await base44.entities.ActivityLog.create({
                action: "Carrier removed by authority audit (worker re-check)",
                details: `${carrier.legal_name || carrier.usdot_number || carrier.id}: ${liveStatus}`,
                status: "Warning",
                timestamp: now,
              });
            } else if (isAuthorizedStatus(liveStatus)) {
              keptCount++;
              await base44.entities.Carrier.update(carrier.id, { operating_status: liveStatus });
            }
          } catch {
            // Worker call failed — skip this carrier for now
          }
        }
      } else {
        // No stored operating status — need the worker to fetch the snapshot
        if (!workerUrl || workerCallsUsed >= maxWorkerChecks) continue;

        workerCallsUsed++;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["x-worker-api-key"] = apiKey;

        try {
          const workerRes = await fetch(`${workerUrl.replace(/\/$/, "")}/research`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              usdot: carrier.usdot_number,
              mc: carrier.mc_number,
              steps: ["company_snapshot", "operation_status"],
            }),
          });

          if (!workerRes.ok) continue;
          const data: any = await workerRes.json();
          checkedFromWorker++;

          const liveStatus = data?.safer?.operating_status || data?.operation_status?.operating_status || "";
          if (isExplicitlyUnauthorized(liveStatus)) {
            await deleteCarrierAndRelated(base44, carrier.id);
            removedCount++;
            removedCarriers.push({
              id: carrier.id,
              legal_name: carrier.legal_name || data?.carrier?.legal_name || "",
              usdot: carrier.usdot_number || "",
              mc: carrier.mc_number || "",
              operating_status: liveStatus,
            });
            await base44.entities.ActivityLog.create({
              action: "Carrier removed by authority audit (worker check)",
              details: `${carrier.legal_name || carrier.usdot_number || carrier.id}: ${liveStatus}`,
              status: "Warning",
              timestamp: now,
            });
          } else if (isAuthorizedStatus(liveStatus)) {
            // Update stored operating_status so we don't re-check next time
            keptCount++;
            await base44.entities.Carrier.update(carrier.id, { operating_status: liveStatus });
          }
        } catch {
          // Worker call failed — skip this carrier for now
        }
      }
    }

    const processed = checkedFromStored + checkedFromWorker;
    const remainingUnchecked = carriers.length - processed;

    return Response.json({
      success: true,
      total_carriers: carriers.length,
      checked_from_stored: checkedFromStored,
      checked_from_worker: checkedFromWorker,
      removed: removedCount,
      kept: keptCount,
      worker_calls_used: workerCallsUsed,
      remaining_unchecked: remainingUnchecked,
      removed_carriers: removedCarriers,
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
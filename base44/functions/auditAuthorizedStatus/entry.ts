// Audits the carrier database for:
//   1. Operating authority status — removes carriers that are NOT AUTHORIZED
//      or OUT-OF-SERVICE, or that FMCSA has no record of (dummy/test records).
//      When the worker is called to verify status, it ALSO backfills any
//      missing carrier fields (legal_name, address, phone, etc.) from the
//      same snapshot so the audit enriches the database, not just prunes it.
//   2. Duplicate carriers — removes carriers that share the same USDOT or MC
//      number, keeping the most complete record.
//
// Processes a bounded batch per call to avoid timeouts.
// Returns progress so the frontend can call again until all carriers are audited.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { deleteCarrierAndRelated, isAuthorizedStatus, isExplicitlyUnauthorized } from "../../shared/carrierCleanup.ts";
import { mapWorkerDataToCarrierFields, buildBackfillUpdate, completenessScore } from "../../shared/carrierFieldMapper.ts";

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

    // Duplicate detection MUST see the entire database at once — if two
    // duplicate carriers land in different 500-record pages, a bounded load
    // never compares them and the duplicates survive forever. So we paginate
    // through ALL carriers for the duplicate phase. The authority phase below
    // is still bounded per call (worker calls are rate-limited) and the
    // frontend runner loops until remaining_unchecked hits 0.
    const loadAllCarriers = async () => {
      const limit = 5000;
      let skip = 0;
      let all: any[] = [];
      while (true) {
        const batch = await base44.entities.Carrier.list("-updated_date", limit, skip);
        if (!batch || batch.length === 0) break;
        all = all.concat(batch);
        if (batch.length < limit) break;
        skip += limit;
      }
      return all;
    };

    const carriers = await loadAllCarriers();

    let checkedFromStored = 0;
    let checkedFromWorker = 0;
    let removedCount = 0;
    let keptCount = 0;
    let backfilledCount = 0;
    let duplicatesRemoved = 0;
    let workerCallsUsed = 0;
    const removedCarriers: any[] = [];

    const isCarrierNotFound = (data: any): boolean => {
      if (!data) return false;
      if (data.identity_verified === false) return true;
      const legalName = data?.carrier?.legal_name || "";
      const liveStatus = data?.safer?.operating_status || data?.operation_status?.operating_status || "";
      return !legalName && !liveStatus;
    };

    // ---- Phase 1: Duplicate detection ----
    // Group carriers by USDOT and MC. Any group with >1 entry has duplicates.
    // Keep the most complete record; delete the rest.
    // Normalize identifiers to digit strings so format differences
    // ("122019" vs "MC-122019" vs "MC-116446 MC-125894") don't hide duplicates.
    const byUsdot = new Map<string, any[]>();
    const byMc = new Map<string, any[]>();
    const addGroup = (map: Map<string, any[]>, key: string, carrier: any) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(carrier);
    };
    for (const c of carriers) {
      ((c.usdot_number || "").match(/\d+/g) || []).forEach(n => addGroup(byUsdot, n, c));
      ((c.mc_number || "").match(/\d+/g) || []).forEach(n => addGroup(byMc, n, c));
    }

    const duplicateIds = new Set<string>();
    const findDuplicates = (groups: Map<string, any[]>) => {
      for (const [, group] of groups) {
        if (group.length < 2) continue;
        // Sort by completeness desc, then by created_date asc (keep oldest if tied)
        group.sort((a, b) => {
          const sc = completenessScore(b) - completenessScore(a);
          if (sc !== 0) return sc;
          return (a.created_date || "").localeCompare(b.created_date || "");
        });
        // Keep the first (most complete), mark the rest as duplicates
        for (let i = 1; i < group.length; i++) {
          duplicateIds.add(group[i].id);
        }
      }
    };
    findDuplicates(byUsdot);
    findDuplicates(byMc);

    for (const dupId of duplicateIds) {
      if (removedCount >= maxDeletions) break;
      const dupCarrier = carriers.find((c) => c.id === dupId);
      await deleteCarrierAndRelated(base44, dupId);
      removedCount++;
      duplicatesRemoved++;
      removedCarriers.push({
        id: dupId,
        legal_name: dupCarrier?.legal_name || "",
        usdot: dupCarrier?.usdot_number || "",
        mc: dupCarrier?.mc_number || "",
        operating_status: "DUPLICATE — removed",
      });
      await base44.entities.ActivityLog.create({
        action: "Duplicate carrier removed by audit",
        details: `${dupCarrier?.legal_name || dupId} (USDOT: ${dupCarrier?.usdot_number || "—"}, MC: ${dupCarrier?.mc_number || "—"}) — duplicate of a more complete record`,
        status: "Warning",
        timestamp: now,
      });
    }

    // ---- Phase 2: Authority status check + backfill ----
    // Only process carriers that are NOT already marked as duplicates above.
    for (const carrier of carriers) {
      if (duplicateIds.has(carrier.id)) continue;
      if (removedCount >= maxDeletions && workerCallsUsed >= maxWorkerChecks) break;

      // No USDOT and no MC — unverifiable, remove
      if (!carrier.usdot_number && !carrier.mc_number) {
        if (removedCount >= maxDeletions) continue;
        await deleteCarrierAndRelated(base44, carrier.id);
        removedCount++;
        removedCarriers.push({
          id: carrier.id,
          legal_name: carrier.legal_name || "",
          usdot: "",
          mc: "",
          operating_status: "NO USDOT/MC — unverifiable",
        });
        await base44.entities.ActivityLog.create({
          action: "Carrier removed by authority audit (no USDOT/MC)",
          details: `${carrier.legal_name || carrier.id}: has no USDOT or MC number`,
          status: "Warning",
          timestamp: now,
        });
        checkedFromStored++;
        continue;
      }

      const opStatus = (carrier.operating_status || "").trim();

      if (opStatus && isExplicitlyUnauthorized(opStatus)) {
        // Stored status is explicitly unauthorized — remove immediately
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
        continue;
      }

      if (opStatus && isAuthorizedStatus(opStatus)) {
        // Already authorized — no worker call needed
        checkedFromStored++;
        keptCount++;
        continue;
      }

      // Status is missing or ambiguous (e.g. "ACTIVE") — need worker to verify.
      // Request the full snapshot so we can ALSO backfill missing fields.
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
            steps: ["company_snapshot", "operation_status", "sms_overview", "complete_sms", "carrier_history", "registration", "licensing_insurance", "inspections_crashes", "safety_rating"],
          }),
        });

        if (!workerRes.ok) continue;
        const data: any = await workerRes.json();
        checkedFromWorker++;

        const liveStatus = data?.safer?.operating_status || data?.operation_status?.operating_status || "";

        if (isExplicitlyUnauthorized(liveStatus) || isCarrierNotFound(data)) {
          if (removedCount >= maxDeletions) continue;
          await deleteCarrierAndRelated(base44, carrier.id);
          removedCount++;
          removedCarriers.push({
            id: carrier.id,
            legal_name: carrier.legal_name || data?.carrier?.legal_name || "",
            usdot: carrier.usdot_number || "",
            mc: carrier.mc_number || "",
            operating_status: liveStatus || "NOT FOUND ON FMCSA",
          });
          await base44.entities.ActivityLog.create({
            action: "Carrier removed by authority audit (worker check)",
            details: `${carrier.legal_name || carrier.usdot_number || carrier.id}: ${liveStatus || "not found"}`,
            status: "Warning",
            timestamp: now,
          });
        } else if (isAuthorizedStatus(liveStatus) || (data.success && data.carrier?.legal_name)) {
          // Authorized — backfill any missing fields from the worker snapshot
          keptCount++;
          const mapped = mapWorkerDataToCarrierFields(data);
          const backfill = buildBackfillUpdate(carrier, mapped);
          // Always update operating_status so we don't re-check next time
          backfill.operating_status = liveStatus || carrier.operating_status;
          backfill.last_researched_at = now;
          if (Object.keys(backfill).length > 1) {
            backfilledCount++;
            await base44.entities.Carrier.update(carrier.id, backfill);
            await base44.entities.ActivityLog.create({
              action: "Carrier backfilled by audit",
              details: `${carrier.legal_name || carrier.usdot_number || carrier.id}: filled ${Object.keys(backfill).length - 1} missing fields from FMCSA snapshot`,
              status: "Success",
              timestamp: now,
            });
          } else {
            await base44.entities.Carrier.update(carrier.id, { operating_status: liveStatus });
          }
        }
      } catch {
        // Worker call failed — skip this carrier for now
      }
    }

    const processed = checkedFromStored + checkedFromWorker;
    const remainingUnchecked = carriers.length - processed - duplicatesRemoved;

    return Response.json({
      success: true,
      total_carriers: carriers.length,
      checked_from_stored: checkedFromStored,
      checked_from_worker: checkedFromWorker,
      removed: removedCount,
      duplicates_removed: duplicatesRemoved,
      backfilled: backfilledCount,
      kept: keptCount,
      worker_calls_used: workerCallsUsed,
      remaining_unchecked: remainingUnchecked,
      removed_carriers: removedCarriers,
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
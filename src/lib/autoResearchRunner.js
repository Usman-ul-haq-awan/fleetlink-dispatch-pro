// Module-level background runner for the "Start Auto-Research" loop.
// Lives outside any React component so navigating away from the Carrier
// Research page does NOT stop the loop — it keeps running until the queue
// is empty or is explicitly stopped. UI components subscribe to receive
// live state snapshots (progress + current carrier being researched).

import { base44 } from "@/api/base44Client";
import { listAllCarriers } from "@/lib/paginatedList";

let state = {
  running: false,
  progress: { total: 0, done: 0, failed: 0, current: "" },
  currentCarrier: null,
};
let stopRequested = false;
const listeners = new Set();

function snapshot() {
  return {
    running: state.running,
    progress: { ...state.progress },
    currentCarrier: state.currentCarrier ? { ...state.currentCarrier } : null,
  };
}
function emit() { listeners.forEach((fn) => fn(snapshot())); }
function patch(p) { state = { ...state, ...p }; emit(); }
function patchProgress(p) { state = { ...state, progress: { ...state.progress, ...p } }; emit(); }

export function subscribe(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getState() { return snapshot(); }

export function stopAutoResearch() {
  stopRequested = true;
  patchProgress({ current: "Stopping after current batch..." });
}

// Runs a continuous loop: load queued carriers, process them in batches of 3,
// reload, repeat until no queued carriers remain or stopped.
export async function startAutoResearch(selectedSteps) {
  if (state.running) return;
  stopRequested = false;
  patch({ running: true, progress: { total: 0, done: 0, failed: 0, current: "Loading carriers..." }, currentCarrier: null });

  try {
    while (!stopRequested) {
      const all = await listAllCarriers("-updated_date");
      const queued = all.filter((c) =>
        c.usdot_number && ["Imported", "Queued", "Failed"].includes(c.lead_status)
      );
      if (queued.length === 0) break;

      const toProcess = queued.slice(0, 10);
      patchProgress({ total: toProcess.length, done: 0, failed: 0, current: `Auto-researching ${toProcess.length} carriers · ${queued.length} in queue` });

      const BATCH_SIZE = 3;
      for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
        if (stopRequested) break;
        const batch = toProcess.slice(i, i + BATCH_SIZE);
        patchProgress({ current: `Processing ${i + 1}-${Math.min(i + BATCH_SIZE, toProcess.length)} of ${toProcess.length} · ${queued.length} in queue` });

        const results = await Promise.all(
          batch.map(async (c) => {
            patch({ currentCarrier: { carrierId: c.id, name: c.legal_name || c.usdot_number || "Unknown", steps: [], status: "running", errors: [] } });
            try {
              const res = await base44.functions.invoke("researchCarrierBrowser", {
                carrier_id: c.id,
                usdot: c.usdot_number,
                mc: c.mc_number,
                steps: selectedSteps,
              });
              const data = res.data;
              patch({
                currentCarrier: {
                  carrierId: c.id,
                  name: c.legal_name || c.usdot_number || "Unknown",
                  steps: data.steps || [],
                  status: data.success ? "done" : (data.not_authorized ? "not_authorized" : "error"),
                  errors: data.not_authorized
                    ? [`Not authorized: ${data.operating_status || "NOT AUTHORIZED"}`]
                    : (data.errors || (data.error ? [data.error] : [])),
                },
              });
              return data.success;
            } catch (err) {
              const msg = err.response?.data?.error || err.message;
              patch({
                currentCarrier: {
                  carrierId: c.id,
                  name: c.legal_name || c.usdot_number || "Unknown",
                  steps: [],
                  status: "error",
                  errors: [msg],
                },
              });
              return false;
            }
          })
        );

        patchProgress({
          done: state.progress.done + results.filter(Boolean).length,
          failed: state.progress.failed + results.filter((r) => !r).length,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    patchProgress({ current: stopRequested ? "Stopped" : "Queue complete" });
  } finally {
    patch({ running: false, currentCarrier: null });
    stopRequested = false;
  }
}
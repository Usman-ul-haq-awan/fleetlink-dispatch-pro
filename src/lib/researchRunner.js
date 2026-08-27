// Module-level background runner that re-researches every carrier in the
// database through the browser worker (researchCarrierBrowser). Lives outside
// any React component so navigating away does not stop it. UI components
// subscribe to receive live progress snapshots.

import { base44 } from "@/api/base44Client";
import { listAllCarriers } from "@/lib/paginatedList";

let state = {
  running: false,
  progress: { total: 0, done: 0, failed: 0, current: "" },
};
let stopRequested = false;
const listeners = new Set();

function snapshot() {
  return { running: state.running, progress: { ...state.progress } };
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
export function stopResearch() {
  stopRequested = true;
  patchProgress({ current: "Stopping after current batch..." });
}

// Processes every carrier in the database through the browser worker in
// controlled-concurrency batches. Skips carriers with no USDOT/MC.
export async function startResearch() {
  if (state.running) return;
  stopRequested = false;
  patch({ running: true, progress: { total: 0, done: 0, failed: 0, current: "Loading carriers..." } });

  try {
    const all = await listAllCarriers("-updated_date");
    const queue = all.filter((c) => c.usdot_number || c.mc_number);
    patchProgress({ total: queue.length, current: `Updating ${queue.length} carriers...` });

    const BATCH = 3;
    for (let i = 0; i < queue.length; i += BATCH) {
      if (stopRequested) break;
      const batch = queue.slice(i, i + BATCH);
      patchProgress({ current: `Researching ${i + 1}-${Math.min(i + BATCH, queue.length)} of ${queue.length}` });

      const results = await Promise.all(
        batch.map(async (c) => {
          try {
            const res = await base44.functions.invoke("researchCarrierBrowser", {
              carrier_id: c.id,
              usdot: c.usdot_number,
              mc: c.mc_number,
            });
            return res.data?.success === true;
          } catch {
            return false;
          }
        })
      );

      patchProgress({
        done: state.progress.done + results.filter(Boolean).length,
        failed: state.progress.failed + results.filter((r) => !r).length,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
    patchProgress({ current: stopRequested ? "Stopped" : "Research center update complete" });
  } finally {
    patch({ running: false });
    stopRequested = false;
  }
}
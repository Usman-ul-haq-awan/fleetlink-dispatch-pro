// Module-level background runner that re-researches every carrier in the
// database through the browser worker (researchCarrierBrowser). Lives outside
// any React component so navigating away does not stop it. UI components
// subscribe to receive live progress snapshots.

import { base44 } from "@/api/base44Client";

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
export async function startResearch(refreshQueue, initialQueue = [], selectedSteps = []) {
  if (state.running) return;
  stopRequested = false;
  patch({ running: true, progress: { total: 0, done: 0, failed: 0, current: "Preparing visible carrier table..." } });

  try {
    let queue = Array.isArray(initialQueue) ? initialQueue.filter((c) => c.usdot_number || c.mc_number) : [];
    const handledIds = new Set();

    while (!stopRequested && queue.length > 0) {
      queue = queue.filter((c) => !handledIds.has(c.id));
      if (queue.length === 0) break;

      patchProgress({ total: queue.length, current: `Researching ${queue.length} visible carriers...` });

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
                steps: selectedSteps,
              });
              const data = res.data || {};
              return { id: c.id, handled: data.success === true || data.not_authorized === true };
            } catch {
              return { id: c.id, handled: false };
            }
          })
        );

        results.filter((r) => r.handled).forEach((r) => handledIds.add(r.id));

        patchProgress({
          done: state.progress.done + results.filter((r) => r.handled).length,
          failed: state.progress.failed + results.filter((r) => !r.handled).length,
        });
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (stopRequested) break;

      const refreshed = typeof refreshQueue === "function" ? ((await refreshQueue()) || []) : [];
      queue = refreshed
        .filter((c) => (c.usdot_number || c.mc_number) && !handledIds.has(c.id));

      patchProgress({
        total: queue.length,
        current: queue.length
          ? `Refreshing table — ${queue.length} carriers remain`
          : "Table clear — research complete",
      });
    }

    patchProgress({ current: stopRequested ? "Stopped" : "Table clear — research complete" });
  } finally {
    patch({ running: false });
    stopRequested = false;
  }
}

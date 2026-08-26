// Module-level background runner for the Authorized Authority Audit.
// Lives outside any React component so navigating away from the Carrier
// Research page does NOT stop the audit — the loop keeps running until it
// finishes all unchecked carriers or is explicitly stopped. UI components
// subscribe to receive live state snapshots.

import { base44 } from "@/api/base44Client";

let state = {
  running: false,
  progress: { removed: 0, kept: 0, workerChecks: 0, storedChecks: 0, remaining: 0, current: "" },
  removedCarriers: [],
};
let stopRequested = false;
const listeners = new Set();

function snapshot() {
  return {
    running: state.running,
    progress: { ...state.progress },
    removedCarriers: [...state.removedCarriers],
  };
}

function emit() {
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
}

function patch(p) {
  state = { ...state, ...p };
  emit();
}

function patchProgress(p) {
  state = { ...state, progress: { ...state.progress, ...p } };
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getState() {
  return snapshot();
}

export function stopAudit() {
  stopRequested = true;
  patchProgress({ current: "Stopping after current batch..." });
}

export function clearRemoved() {
  patch({ removedCarriers: [] });
}

export async function startAudit() {
  if (state.running) return;
  stopRequested = false;
  patch({
    running: true,
    removedCarriers: [],
    progress: { removed: 0, kept: 0, workerChecks: 0, storedChecks: 0, remaining: 1, current: "Starting audit..." },
  });

  try {
    let rounds = 0;
    let remaining = 1;

    while (!stopRequested && remaining > 0 && rounds < 60) {
      rounds++;
      patchProgress({ current: `Audit round ${rounds} — checking carriers...` });

      let res;
      try {
        res = await base44.functions.invoke("auditAuthorizedStatus", { max_worker_checks: 10, max_deletions: 10 });
      } catch (err) {
        patchProgress({ current: `Audit error: ${err.response?.data?.error || err.message}`, remaining: 0 });
        break;
      }

      const d = res.data;
      const newRemoved = (d.removed_carriers || []).map((c) => ({
        legal_name: c.legal_name || c.usdot || c.mc || c.id,
        operating_status: c.operating_status || "NOT AUTHORIZED",
      }));

      patch({
        removedCarriers: [...state.removedCarriers, ...newRemoved],
        progress: {
          removed: state.progress.removed + (d.removed || 0),
          kept: state.progress.kept + (d.kept || 0),
          workerChecks: state.progress.workerChecks + (d.checked_from_worker || 0),
          storedChecks: state.progress.storedChecks + (d.checked_from_stored || 0),
          remaining: d.remaining_unchecked || 0,
          current: d.remaining_unchecked > 0
            ? `Round ${rounds}: ${d.removed || 0} removed, ${d.remaining_unchecked} still unchecked...`
            : "Audit complete",
        },
      });

      remaining = d.remaining_unchecked || 0;
      if (remaining > 0 && !stopRequested) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    patchProgress({ current: stopRequested ? "Stopped" : "Audit complete", remaining: 0 });
  } finally {
    patch({ running: false });
    stopRequested = false;
  }
}
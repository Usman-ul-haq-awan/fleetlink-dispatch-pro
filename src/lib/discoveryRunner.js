// Module-level background runner for MC-number discovery.
// Lives outside any React component so navigating away from the Carrier
// Research page does NOT stop the worker — the loop keeps running until it
// reaches the target count or is explicitly stopped. UI components subscribe
// to receive live state snapshots.

import { base44 } from "@/api/base44Client";

let state = {
  running: false,
  progress: { total: 0, done: 0, failed: 0, current: "" },
  failedMcs: [],
  target: 200,
};
let stopRequested = false;
const listeners = new Set();

function snapshot() {
  return {
    running: state.running,
    progress: { ...state.progress },
    failedMcs: [...state.failedMcs],
    target: state.target,
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

function buildFailureReason(data, err) {
  if (err) {
    return { reason: "Exception", detail: err.response?.data?.error || err.message || "Request failed" };
  }
  if (!data) return { reason: "No Response", detail: "No response from research worker" };
  if (data.success && data.carrier && !data.carrier.legal_name) {
    return { reason: "No Carrier Found", detail: "FMCSA SAFER returned no real carrier for this MC number (no legal name present on the snapshot)." };
  }
  if (!data.success) {
    const topErr = data.error || "Research Failed";
    const stepFails = (data.steps || []).filter((s) => s.status === "failed").map((s) => `${s.name}: ${s.error || s.status}`).join("; ");
    const workerErrs = (data.errors || []).map((e) => `${e.step || e.state || "Worker"}: ${e.message || e.state || ""}`).join("; ");
    const detail = [stepFails, workerErrs].filter(Boolean).join(" | ") || topErr;
    return { reason: topErr, detail };
  }
  return { reason: "Unknown", detail: "Unrecognized response from research worker" };
}

function recordFailure(mcLabel, data, err) {
  const f = buildFailureReason(data, err);
  patch({ failedMcs: [{ mc: mcLabel, reason: f.reason, detail: f.detail, timestamp: new Date().toISOString() }, ...state.failedMcs] });
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getState() {
  return snapshot();
}

export function clearFailedMcs() {
  patch({ failedMcs: [] });
}

export function stopDiscovery() {
  stopRequested = true;
  patchProgress({ current: "Stopping after current MC..." });
}

export async function startDiscovery(target) {
  if (state.running) return;
  stopRequested = false;
  const targetCount = Math.max(1, target || state.target);
  patch({ running: true, target: targetCount, failedMcs: [] });
  try {
    const all = await base44.entities.Carrier.list("-created_date", 1000);
    let found = all.length;
    let maxMc = 0;
    all.forEach((c) => {
      const num = parseInt(String(c.mc_number || "").replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > maxMc) maxMc = num;
    });
    let currentMc = maxMc;
    patchProgress({ total: targetCount, done: found, failed: 0, current: `Discovering from MC-${currentMc + 1} · ${found}/${targetCount} found` });

    while (!stopRequested && found < targetCount) {
      currentMc += 1;
      patchProgress({ current: `Researching MC-${currentMc} · ${found}/${targetCount} carriers found` });
      try {
        const res = await base44.functions.invoke("researchCarrierBrowser", { mc: String(currentMc) });
        const data = res.data;
        if (data.success && data.carrier && data.carrier.legal_name) {
          found += 1;
          patchProgress({ done: found });
        } else {
          if (data.carrier_id) {
            try { await base44.entities.Carrier.delete(data.carrier_id); } catch {}
          }
          recordFailure(`MC-${currentMc}`, data);
          patchProgress({ failed: state.progress.failed + 1 });
        }
      } catch (err) {
        recordFailure(`MC-${currentMc}`, null, err);
        patchProgress({ failed: state.progress.failed + 1 });
      }
    }
  } finally {
    patch({ running: false });
    patchProgress({ current: stopRequested ? "Stopped" : "Discovery complete" });
    stopRequested = false;
  }
}
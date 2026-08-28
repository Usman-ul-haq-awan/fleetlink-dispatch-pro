import React, { useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Play, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, Truck, Download, Trash2, ShieldCheck, Server } from "lucide-react";
import ResearchStepsPanel from "@/components/ResearchStepsPanel";
import ResearchStepsSelector, { ALL_STEP_KEYS } from "@/components/ResearchStepsSelector";
import { subscribe as subscribeDiscovery, startDiscovery as startRunnerDiscovery, stopDiscovery as stopRunnerDiscovery, clearFailedMcs as clearRunnerFailedMcs } from "@/lib/discoveryRunner";
import { subscribe as subscribeAudit, startAudit as startRunnerAudit, stopAudit as stopRunnerAudit } from "@/lib/auditRunner";
import { subscribe as subscribeAutoResearch, startAutoResearch as startRunnerAutoResearch, stopAutoResearch as stopRunnerAutoResearch } from "@/lib/autoResearchRunner";
import { listAllCarriers } from "@/lib/paginatedList";

const QUEUE_STATUSES = ["Imported", "Queued", "Researching", "Failed", "Needs Review"];

export default function CarrierResearch() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0, current: "" });
  const [errors, setErrors] = useState([]);
  const [activeResearch, setActiveResearch] = useState(null);
  const [discoverTarget, setDiscoverTarget] = useState(200);
  const [discoverStartMc, setDiscoverStartMc] = useState("");
  const [selectedSteps, setSelectedSteps] = useState(ALL_STEP_KEYS);
  const [failedMcs, setFailedMcs] = useState([]);
  const [discovery, setDiscovery] = useState({ running: false, progress: { total: 0, done: 0, failed: 0, current: "" }, failedMcs: [] });
  const [audit, setAudit] = useState({ running: false, progress: { removed: 0, kept: 0, workerChecks: 0, storedChecks: 0, remaining: 0, current: "" }, removedCarriers: [] });
  const [autoResearch, setAutoResearch] = useState({ running: false, progress: { total: 0, done: 0, failed: 0, current: "" }, currentCarrier: null });
  const [serverResearch, setServerResearch] = useState({ running: false, result: null });
  const [serverDiscovery, setServerDiscovery] = useState({ running: false, progress: null, result: null });
  const serverDiscoveryStop = useRef(false);

  useEffect(() => {
    const unsub = subscribeDiscovery((snap) => {
      setDiscovery(snap);
      setFailedMcs(snap.failedMcs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeAutoResearch((snap) => setAutoResearch(snap));
    return unsub;
  }, []);

  const buildFailureReason = (data, err) => {
    if (err) {
      return { reason: "Exception", detail: err.response?.data?.error || err.message || "Request failed" };
    }
    if (!data) return { reason: "No Response", detail: "No response from research worker" };
    if (data.not_authorized) {
      return { reason: "Not Authorized", detail: `Operating Status: ${data.operating_status || "NOT AUTHORIZED"} — carrier removed from database` };
    }
    if (data.success && data.carrier && !data.carrier.legal_name) {
      return { reason: "No Carrier Found", detail: "FMCSA SAFER returned no real carrier for this MC number (no legal name present on the snapshot)." };
    }
    if (!data.success) {
      const topErr = data.error || "Research Failed";
      const stepFails = (data.steps || []).filter(s => s.status === "failed").map(s => `${s.name}: ${s.error || s.status}`).join("; ");
      const workerErrs = (data.errors || []).map(e => `${e.step || e.state || "Worker"}: ${e.message || e.state || ""}`).join("; ");
      const detail = [stepFails, workerErrs].filter(Boolean).join(" | ") || topErr;
      return { reason: topErr, detail };
    }
    return { reason: "Unknown", detail: "Unrecognized response from research worker" };
  };

  const recordFailure = (mcLabel, data, err) => {
    const f = buildFailureReason(data, err);
    setFailedMcs(prev => [{ mc: mcLabel, reason: f.reason, detail: f.detail, timestamp: new Date().toISOString() }, ...prev]);
  };

  const exportFailedMcs = () => {
    if (failedMcs.length === 0) return;
    const headers = ["MC Number", "Reason", "Detail", "Timestamp"];
    const rows = failedMcs.map(f => [f.mc, f.reason, f.detail, f.timestamp]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `failed_mc_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listAllCarriers("-updated_date");
      const queued = all.filter(c => QUEUE_STATUSES.includes(c.lead_status));
      setCarriers(queued);
      const researchErrors = await base44.entities.ResearchError.filter({ status: "Manual Review" }, "-timestamp", 50);
      setErrors(researchErrors);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh the carrier list when auto-research finishes
  const prevAutoRunning = useRef(false);
  useEffect(() => {
    if (prevAutoRunning.current && !autoResearch.running) load();
    prevAutoRunning.current = autoResearch.running;
  }, [autoResearch.running, load]);

  const prevAuditRunning = useRef(false);
  const prevAuditRemoved = useRef(0);
  useEffect(() => {
    const unsub = subscribeAudit((snap) => {
      setAudit(snap);
      if (prevAuditRunning.current && !snap.running) load();
      // Refresh the carrier list as removals happen during the audit
      if (snap.running && snap.progress.removed > prevAuditRemoved.current) load();
      prevAuditRunning.current = snap.running;
      prevAuditRemoved.current = snap.progress.removed;
    });
    return unsub;
  }, [load]);

  const processOne = async (carrier) => {
    setActiveResearch({
      carrierId: carrier.id,
      name: carrier.legal_name || carrier.usdot_number || "Unknown",
      steps: [],
      status: "running",
      errors: [],
    });
    try {
      const res = await base44.functions.invoke("researchCarrierBrowser", {
        carrier_id: carrier.id,
        usdot: carrier.usdot_number,
        mc: carrier.mc_number,
        steps: selectedSteps,
      });
      const data = res.data;
      setActiveResearch((prev) =>
        prev ? {
          ...prev,
          steps: data.steps || [],
          status: data.success ? "done" : (data.not_authorized ? "not_authorized" : "error"),
          errors: data.not_authorized ? [`Not authorized: ${data.operating_status || "NOT AUTHORIZED"}`] : (data.errors || (data.error ? [data.error] : [])),
        } : prev
      );
      if (!data.success && !data.not_authorized && carrier.mc_number) recordFailure(`MC-${carrier.mc_number}`, data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setActiveResearch((prev) => (prev ? { ...prev, status: "error", errors: [msg] } : prev));
      if (carrier.mc_number) recordFailure(`MC-${carrier.mc_number}`, null, err);
      return { success: false, error: msg };
    }
  };

  const processBatch = async () => {
    const toProcess = carriers.filter(c => c.usdot_number && (c.lead_status === "Imported" || c.lead_status === "Queued" || c.lead_status === "Failed")).slice(0, 10);
    if (toProcess.length === 0) return;

    setProcessing(true);
    setProgress({ total: toProcess.length, done: 0, failed: 0, current: "" });

    const BATCH_SIZE = 3; // Controlled concurrency
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);
      setProgress(p => ({ ...p, current: `Processing ${i + 1}-${Math.min(i + BATCH_SIZE, toProcess.length)} of ${toProcess.length}` }));

      const results = await Promise.all(batch.map(c => processOne(c)));

      setProgress(p => ({
        ...p,
        done: p.done + results.filter(r => r.success).length,
        failed: p.failed + results.filter(r => !r.success).length,
      }));

      // Small delay between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setProcessing(false);
    setProgress(p => ({ ...p, current: "Complete" }));
    load();
  };

  const retryOne = async (carrier) => {
    setProcessing(true);
    await processOne(carrier);
    setProcessing(false);
    load();
  };

  const startAutoResearch = () => startRunnerAutoResearch(selectedSteps);
  const stopAutoResearch = () => stopRunnerAutoResearch();

  // Server-side research — runs on the Base44 server, so it keeps going
  // through app updates, hot reloads, and browser navigation.
  const runServerResearch = async () => {
    setServerResearch({ running: true, result: null });
    try {
      const res = await base44.functions.invoke("runAutoResearch", { batch_size: 12 });
      setServerResearch({ running: false, result: res.data });
      load();
      // If carriers remain, keep going automatically.
      if (res.data?.remaining > 0) {
        setTimeout(runServerResearch, 2000);
      }
    } catch (err) {
      setServerResearch({ running: false, result: { error: err.response?.data?.error || err.message } });
    }
  };

  // MC-number discovery runs in a module-level background runner so it keeps
  // working even when the user navigates away from this page.
  const startDiscovery = () => startRunnerDiscovery(discoverTarget);
  const startDiscoveryFromMc = () => {
    const mc = parseInt(String(discoverStartMc).replace(/[^0-9]/g, ""), 10);
    if (!mc || isNaN(mc)) return;
    startRunnerDiscovery(discoverTarget, mc);
  };
  const stopDiscovery = () => stopRunnerDiscovery();

  // Server-side MC discovery — runs on the Base44 server, survives app updates.
  // Uses the same target + start-MC inputs as the browser discovery runner.
  const runServerDiscovery = async (startMc, nextMc) => {
    if (serverDiscoveryStop.current) return;
    setServerDiscovery((prev) => ({ running: true, progress: prev.progress, result: null }));
    try {
      const res = await base44.functions.invoke("runAutoDiscovery", {
        batch_size: 8,
        target_count: discoverTarget,
        start_mc: startMc ?? (nextMc ?? null),
      });
      const data = res.data;
      setServerDiscovery((prev) => {
        const prog = prev.progress || { found: 0, failed: 0, currentMc: startMc ?? data.next_mc, totalCarriers: 0 };
        return {
          running: false,
          progress: {
            found: prog.found + (data.found || 0),
            failed: prog.failed + (data.failed || 0),
            currentMc: data.next_mc,
            totalCarriers: data.total_carriers,
          },
          result: data,
        };
      });
      load();
      // Auto-continue until the target is reached or stopped.
      if (!data.target_reached && !serverDiscoveryStop.current) {
        setTimeout(() => runServerDiscovery(null, data.next_mc), 1500);
      } else if (data.target_reached) {
        setServerDiscovery((prev) => ({ ...prev, running: false, result: { ...data, message: "Target carrier count reached." } }));
      }
    } catch (err) {
      setServerDiscovery((prev) => ({ running: false, progress: prev.progress, result: { error: err.response?.data?.error || err.message } }));
    }
  };

  const startServerDiscovery = () => {
    const mc = parseInt(String(discoverStartMc).replace(/[^0-9]/g, ""), 10);
    serverDiscoveryStop.current = false;
    setServerDiscovery({ running: true, progress: { found: 0, failed: 0, currentMc: mc || 0, totalCarriers: 0 }, result: null });
    runServerDiscovery(mc || null, null);
  };

  const stopServerDiscovery = () => {
    serverDiscoveryStop.current = true;
    setServerDiscovery((prev) => ({ ...prev, running: false, result: { ...prev.result, message: "Stopped — no further batches will run." } }));
  };

  const runAudit = () => startRunnerAudit();
  const stopAudit = () => stopRunnerAudit();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Research Queue</h1>
          <p className="text-slate-500 text-sm mt-1">{carriers.length} carriers in queue</p>
        </div>
        <div className="flex items-center gap-2">
          {!autoResearch.running ? (
            <button onClick={startAutoResearch} disabled={processing || carriers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <Play className="w-4 h-4" />
              Start Auto-Research
            </button>
          ) : (
            <button onClick={stopAutoResearch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              <AlertCircle className="w-4 h-4" />
              Stop Scraping
            </button>
          )}
          <button onClick={runServerResearch} disabled={serverResearch.running || processing || autoResearch.running || carriers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {serverResearch.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
            {serverResearch.running ? "Server Researching..." : "Server-Side Research"}
          </button>
          <button onClick={processBatch} disabled={processing || autoResearch.running || carriers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {processing && !autoResearch.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Research Batch (10)
          </button>
        </div>
      </div>

      <ResearchStepsSelector selected={selectedSteps} onChange={setSelectedSteps} />

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4" /> MC Number Discovery
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Starts from the highest MC number in your database + 1, researches each successive MC via the worker,
              keeps valid carriers and skips MCs that don't resolve — until the database holds the target count.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Target</label>
            <input type="number" min="1" value={discoverTarget}
              onChange={e => setDiscoverTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={discovery.running}
              className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-md disabled:opacity-50" />
            {!discovery.running ? (
              <button onClick={startDiscovery} disabled={processing || autoResearch.running}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                <Play className="w-4 h-4" />
                Auto-Discover (MC+1)
              </button>
            ) : (
              <button onClick={stopDiscovery}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                <AlertCircle className="w-4 h-4" />
                Stop Discovery
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t border-slate-200">
          <label className="text-xs text-slate-500">Start from MC</label>
          <input type="number" min="1" value={discoverStartMc}
            onChange={e => setDiscoverStartMc(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !discovery.running) startDiscoveryFromMc(); }}
            placeholder="e.g. 1500000"
            disabled={discovery.running}
            className="w-36 px-2 py-1.5 text-sm border border-slate-300 rounded-md disabled:opacity-50" />
          <button onClick={startDiscoveryFromMc} disabled={discovery.running || !discoverStartMc}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            <Play className="w-4 h-4" />
            Research from MC
          </button>
          <p className="text-xs text-slate-400 w-full">Starts at the MC number you enter and continues +1 until the target count is reached.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t border-slate-200">
          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> Server-Side Discovery
          </span>
          <span className="text-xs text-slate-400">— runs on the server, survives app updates</span>
          {!serverDiscovery.running ? (
            <button onClick={startServerDiscovery} disabled={discovery.running}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 ml-auto">
              <Server className="w-4 h-4" />
              {discoverStartMc ? `Start from MC-${discoverStartMc}` : "Start Server Discovery"}
            </button>
          ) : (
            <button onClick={stopServerDiscovery}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 ml-auto">
              <AlertCircle className="w-4 h-4" />
              Stop Server Discovery
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Authorized Authority Audit
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Checks every carrier in the database for "AUTHORIZED FOR" operating authority status.
              Carriers already researched are checked from stored data; others are verified live via the worker.
              Unauthorized carriers are removed from the database.
            </p>
          </div>
          {!audit.running ? (
            <button onClick={runAudit} disabled={processing || autoResearch.running}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              <ShieldCheck className="w-4 h-4" />
              Audit Database
            </button>
          ) : (
            <button onClick={stopAudit}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              <AlertCircle className="w-4 h-4" />
              Stop Audit
            </button>
          )}
        </div>
        {(audit.running || audit.progress.current || audit.removedCarriers.length > 0) && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
              {audit.running && <Loader2 className="w-3 h-3 animate-spin text-violet-600" />}
              {audit.progress.current || "Idle"}
            </p>
            <div className="flex gap-4 flex-wrap text-xs">
              <span className="text-green-700">Kept: {audit.progress.kept}</span>
              <span className="text-red-700">Removed: {audit.progress.removed}</span>
              <span className="text-orange-600">Dupes removed: {audit.progress.duplicatesRemoved}</span>
              <span className="text-blue-600">Backfilled: {audit.progress.backfilled}</span>
              <span className="text-slate-500">Worker checks: {audit.progress.workerChecks}</span>
              {audit.progress.remaining > 0 && <span className="text-amber-600">Remaining: {audit.progress.remaining}</span>}
            </div>
            {audit.removedCarriers.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {audit.removedCarriers.slice(0, 20).map((c, i) => (
                  <div key={i} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{c.legal_name}</span>
                    <span className="text-red-500 ml-2">— {c.operating_status}</span>
                  </div>
                ))}
                {audit.removedCarriers.length > 20 && (
                  <p className="text-xs text-slate-400">…and {audit.removedCarriers.length - 20} more</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {discovery.running && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {discovery.progress.current}
            </span>
            <span className="text-sm text-emerald-600">{discovery.progress.done} found, {discovery.progress.failed} failed</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${discovery.progress.total ? (discovery.progress.done + discovery.progress.failed) / discovery.progress.total * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-emerald-700 mt-2">Running in the background — you can navigate to other pages and this will keep going.</p>
        </div>
      )}

      {(serverDiscovery.running || serverDiscovery.progress) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              {serverDiscovery.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              {serverDiscovery.running
                ? `Server discovery — next MC-${serverDiscovery.progress?.currentMc || "…"}`
                : (serverDiscovery.result?.message || "Server discovery idle")}
            </span>
            <span className="text-sm text-emerald-600">
              {serverDiscovery.progress?.found || 0} found · {serverDiscovery.progress?.failed || 0} failed
              {serverDiscovery.progress?.totalCarriers != null && ` · ${serverDiscovery.progress.totalCarriers} total`}
            </span>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            Runs on the Base44 server — keeps going through app updates and browser navigation.
          </p>
          {serverDiscovery.result?.error && (
            <p className="text-xs text-red-600 mt-1">{serverDiscovery.result.error}</p>
          )}
        </div>
      )}

      {processing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">{progress.current}</span>
            <span className="text-sm text-blue-600">{progress.done} done, {progress.failed} failed</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress.total ? (progress.done + progress.failed) / progress.total * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {autoResearch.running && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {autoResearch.progress.current}
            </span>
            <span className="text-sm text-green-600">{autoResearch.progress.done} done, {autoResearch.progress.failed} failed</span>
          </div>
          <div className="w-full bg-green-100 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${autoResearch.progress.total ? (autoResearch.progress.done + autoResearch.progress.failed) / autoResearch.progress.total * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-green-700 mt-2">Running in the background — you can navigate to other pages and this will keep going.</p>
        </div>
      )}

      {serverResearch.running && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Server-side research in progress — runs on the server, survives app updates.</span>
          </div>
        </div>
      )}
      {serverResearch.result && !serverResearch.result.error && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-emerald-800">
              Server batch complete — {serverResearch.result.succeeded || 0} succeeded, {serverResearch.result.failed || 0} failed
            </p>
            <p className="text-emerald-700 text-xs mt-1">
              {serverResearch.result.remaining > 0
                ? `${serverResearch.result.remaining} imported carriers remaining — next batch starting automatically.`
                : "No imported carriers remaining."}
            </p>
          </div>
        </div>
      )}
      {serverResearch.result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{serverResearch.result.error}</p>
        </div>
      )}

      {autoResearch.currentCarrier && <ResearchStepsPanel research={autoResearch.currentCarrier} />}
      {!autoResearch.running && activeResearch && <ResearchStepsPanel research={activeResearch} />}

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-red-800 text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Research Errors ({errors.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {errors.map(err => (
              <div key={err.id} className="text-xs text-red-700">
                <strong>{err.step}:</strong> {err.error_message}
                {err.source_url && <a href={err.source_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">Source</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {failedMcs.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
            <h3 className="font-medium text-amber-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Failed MC Report ({failedMcs.length})
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={exportFailedMcs} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button onClick={clearRunnerFailedMcs} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">MC Number</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Reason</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Detail</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {failedMcs.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-900 whitespace-nowrap">{f.mc}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 whitespace-nowrap">{f.reason}</span></td>
                    <td className="px-4 py-2 text-xs text-slate-600">{f.detail}</td>
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{new Date(f.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : carriers.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-slate-500">No carriers in queue. All carriers have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">USDOT</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Research Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Last Researched</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carriers.map(carrier => (
                  <tr key={carrier.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{carrier.legal_name || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-600">{carrier.usdot_number || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        carrier.lead_status === "Failed" ? "bg-red-100 text-red-700" :
                        carrier.lead_status === "Researching" ? "bg-indigo-100 text-indigo-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{carrier.lead_status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{carrier.research_status || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{carrier.last_researched_at ? new Date(carrier.last_researched_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {carrier.usdot_number && (
                        <button onClick={() => retryOne(carrier)} disabled={processing || autoResearch.running}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50" title="Research">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="font-medium text-slate-700 text-sm mb-2">Browser Automation Workflow (Playwright)</h3>
        <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
          <li>Open SAFER Company Snapshot in a real Chromium browser</li>
          <li>Extract carrier fields + discover carrier-specific links (SMS, Insurance, Inspections, Safety Rating)</li>
          <li>Open SMS Overview → Complete SMS Profile → Carrier History → Registration Details</li>
          <li>Return to snapshot → open Licensing & Insurance</li>
          <li>Open Inspections/Crashes page</li>
          <li>Open Safety Rating page</li>
          <li>Validate USDOT identity on every page (stops on mismatch)</li>
          <li>Safety qualification engine + lead score calculation</li>
          <li>Evidence records created for every field with source URL + timestamp</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          Requires the Playwright browser worker to be deployed (see browser-worker/README.md) and the WORKER_URL + WORKER_API_KEY secrets configured in app settings. Until then, research will return a "worker not configured" error.
        </p>
      </div>
    </div>
  );
}
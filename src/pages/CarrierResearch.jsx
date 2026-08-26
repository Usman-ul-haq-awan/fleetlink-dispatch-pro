import React, { useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Play, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, Truck, Download, Trash2 } from "lucide-react";
import ResearchStepsPanel from "@/components/ResearchStepsPanel";

const QUEUE_STATUSES = ["Imported", "Queued", "Researching", "Failed", "Needs Review"];

export default function CarrierResearch() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0, current: "" });
  const [errors, setErrors] = useState([]);
  const [activeResearch, setActiveResearch] = useState(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoverTarget, setDiscoverTarget] = useState(200);
  const stopRef = useRef(false);
  const [failedMcs, setFailedMcs] = useState([]);

  const buildFailureReason = (data, err) => {
    if (err) {
      return { reason: "Exception", detail: err.response?.data?.error || err.message || "Request failed" };
    }
    if (!data) return { reason: "No Response", detail: "No response from research worker" };
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
      const all = await base44.entities.Carrier.list("-updated_date", 500);
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
      });
      const data = res.data;
      setActiveResearch((prev) =>
        prev ? {
          ...prev,
          steps: data.steps || [],
          status: data.success ? "done" : "error",
          errors: data.errors || (data.error ? [data.error] : []),
        } : prev
      );
      if (!data.success && carrier.mc_number) recordFailure(`MC-${carrier.mc_number}`, data);
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

  const startAutoResearch = async () => {
    stopRef.current = false;
    setAutoRunning(true);
    setProcessing(true);
    try {
      while (!stopRef.current) {
        const all = await base44.entities.Carrier.list("-updated_date", 500);
        const queued = all.filter(c =>
          c.usdot_number && ["Imported", "Queued", "Failed"].includes(c.lead_status)
        );
        if (queued.length === 0) break;

        const toProcess = queued.slice(0, 10);
        setProgress({ total: toProcess.length, done: 0, failed: 0, current: `Auto-researching ${toProcess.length} carriers · ${queued.length} in queue` });

        const BATCH_SIZE = 3;
        for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
          if (stopRef.current) break;
          const batch = toProcess.slice(i, i + BATCH_SIZE);
          setProgress(p => ({ ...p, current: `Processing ${i + 1}-${Math.min(i + BATCH_SIZE, toProcess.length)} of ${toProcess.length} · ${queued.length} in queue` }));
          const results = await Promise.all(batch.map(c => processOne(c)));
          setProgress(p => ({
            ...p,
            done: p.done + results.filter(r => r.success).length,
            failed: p.failed + results.filter(r => !r.success).length,
          }));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        await load();
      }
    } finally {
      setAutoRunning(false);
      setProcessing(false);
      setProgress(p => ({ ...p, current: stopRef.current ? "Stopped" : "Queue complete" }));
      stopRef.current = false;
    }
  };

  const stopAutoResearch = () => {
    stopRef.current = true;
    setProgress(p => ({ ...p, current: "Stopping after current batch..." }));
  };

  // MC-number discovery: start from the highest MC in the database + 1,
  // research each successive MC via the browser worker, keep valid carriers,
  // skip MCs that don't resolve to a real carrier, until the database holds
  // `discoverTarget` carriers or the user stops the run.
  const startDiscovery = async () => {
    stopRef.current = false;
    setDiscovering(true);
    setProcessing(true);
    try {
      const all = await base44.entities.Carrier.list("-created_date", 1000);
      let found = all.length;
      let maxMc = 0;
      all.forEach(c => {
        const num = parseInt(String(c.mc_number || "").replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num > maxMc) maxMc = num;
      });
      let currentMc = maxMc;
      setProgress({ total: discoverTarget, done: found, failed: 0, current: `Discovering from MC-${currentMc + 1} · ${found}/${discoverTarget} found` });

      while (!stopRef.current && found < discoverTarget) {
        currentMc += 1;
        setProgress(p => ({ ...p, current: `Researching MC-${currentMc} · ${found}/${discoverTarget} carriers found` }));
        try {
          const res = await base44.functions.invoke("researchCarrierBrowser", { mc: String(currentMc) });
          const data = res.data;
          if (data.success && data.carrier && data.carrier.legal_name) {
            found += 1;
            setProgress(p => ({ ...p, done: found }));
          } else {
            // No real carrier for this MC — remove the auto-created stub so it
            // doesn't pollute the database or inflate the count.
            if (data.carrier_id) {
              try { await base44.entities.Carrier.delete(data.carrier_id); } catch {}
            }
            recordFailure(`MC-${currentMc}`, data);
            setProgress(p => ({ ...p, failed: p.failed + 1 }));
          }
        } catch (err) {
          recordFailure(`MC-${currentMc}`, null, err);
          setProgress(p => ({ ...p, failed: p.failed + 1 }));
        }
        await load();
      }
    } finally {
      setDiscovering(false);
      setProcessing(false);
      setProgress(p => ({ ...p, current: stopRef.current ? "Stopped" : "Discovery complete" }));
      stopRef.current = false;
    }
  };

  const stopDiscovery = () => {
    stopRef.current = true;
    setProgress(p => ({ ...p, current: "Stopping after current MC..." }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Research Queue</h1>
          <p className="text-slate-500 text-sm mt-1">{carriers.length} carriers in queue</p>
        </div>
        <div className="flex items-center gap-2">
          {!autoRunning ? (
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
          <button onClick={processBatch} disabled={processing || carriers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {processing && !autoRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Research Batch (10)
          </button>
        </div>
      </div>

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
              disabled={discovering}
              className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-md disabled:opacity-50" />
            {!discovering ? (
              <button onClick={startDiscovery} disabled={processing}
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
      </div>

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

      {activeResearch && <ResearchStepsPanel research={activeResearch} />}

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
              <button onClick={() => setFailedMcs([])} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md">
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
                        <button onClick={() => retryOne(carrier)} disabled={processing}
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
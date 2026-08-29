import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Filter, Eye, Truck, RefreshCw, FileSpreadsheet, Loader2, Radar, Square, Trash2, Calendar, X } from "lucide-react";
import * as XLSX from "xlsx";
import { listAllCarriers, listCarriersForUser } from "@/lib/paginatedList";
import { subscribe as subscribeResearch, startResearch as startRunnerResearch, stopResearch as stopRunnerResearch } from "@/lib/researchRunner";

// Classifies a carrier's operation type from the stored carrier_segment /
// operating_status fields. FMCSA uses "A" = Interstate, "B" = Intrastate,
// "C" = Both; SMS may store a descriptive string.
function getOperationType(carrier) {
  const seg = String(carrier.carrier_segment || "").toUpperCase();
  const op = String(carrier.operating_status || "").toUpperCase();
  const text = `${seg} ${op}`;
  if (text.includes("C") && (text.includes("BOTH") || seg === "C")) return "Both";
  if (text.includes("INTRASTATE") || seg === "B" || seg.startsWith("B ")) return "Intrastate";
  if (text.includes("INTERSTATE") || seg === "A" || seg.startsWith("A ")) return "Interstate";
  return "Unknown";
}

const STATUS_COLORS = {
  "Imported": "bg-slate-100 text-slate-700",
  "Queued": "bg-blue-100 text-blue-700",
  "Researching": "bg-indigo-100 text-indigo-700",
  "SAFER Complete": "bg-cyan-100 text-cyan-700",
  "SMS Complete": "bg-teal-100 text-teal-700",
  "Qualified": "bg-green-100 text-green-700",
  "Needs Review": "bg-amber-100 text-amber-700",
  "Failed": "bg-red-100 text-red-700",
  "Ready for Outreach": "bg-emerald-100 text-emerald-700",
  "Contacted": "bg-purple-100 text-purple-700",
  "Interested": "bg-green-100 text-green-700",
  "Human Handoff": "bg-orange-100 text-orange-700",
  "Onboarding": "bg-blue-100 text-blue-700",
  "Active Client": "bg-green-100 text-green-800",
  "Do Not Contact": "bg-red-100 text-red-700",
};

const SAFETY_COLORS = {
  "Qualified": "bg-green-100 text-green-700",
  "Review Required": "bg-amber-100 text-amber-700",
  "High Risk": "bg-red-100 text-red-700",
  "Insufficient Data": "bg-slate-100 text-slate-700",
  "Not Assessed": "bg-slate-100 text-slate-500",
};

export default function CarrierDatabase() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mcSearch, setMcSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allocatedDate, setAllocatedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [safetyFilter, setSafetyFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [researching, setResearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [researchCenter, setResearchCenter] = useState({ running: false, progress: { total: 0, done: 0, failed: 0, current: "" } });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [savingComment, setSavingComment] = useState(null);
  const PAGE_SIZE = 50;

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const saveComment = async (carrierId, text) => {
    setSavingComment(carrierId);
    try {
      await base44.entities.Carrier.update(carrierId, {
        staff_comment: text,
        staff_comment_date: new Date().toISOString(),
      });
    } catch (err) {
      alert("Failed to save comment: " + (err.message || ""));
    } finally {
      setSavingComment(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === carriers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(carriers.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} carrier(s)? This removes the carrier and all its related records. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const BATCH = 25;
      for (let i = 0; i < ids.length; i += BATCH) {
        await base44.entities.Carrier.deleteMany({ id: { $in: ids.slice(i, i + BATCH) } });
      }
      setSelectedIds(new Set());
      await loadCarriers(true);
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const unsub = subscribeResearch((snap) => setResearchCenter(snap));
    return unsub;
  }, []);

  // Apply a safety filter passed via the URL (e.g. ?safety=Qualified) on first load.
  useEffect(() => {
    const safety = searchParams.get("safety");
    if (safety) setSafetyFilter(safety);
  }, [searchParams]);

  const loadCarriers = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      // Staff (non-admin) only fetch carriers allocated to them (server-side filter)
      let filtered = (currentUser && !isAdmin)
        ? await listCarriersForUser(currentUser.id, "-assigned_date")
        : await listAllCarriers("-assigned_date");

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c =>
          (c.legal_name || "").toLowerCase().includes(q) ||
          (c.dba_name || "").toLowerCase().includes(q) ||
          (c.usdot_number || "").includes(q) ||
          (c.mc_number || "").includes(q)
        );
      }
      if (mcSearch) {
        const mcq = mcSearch.toLowerCase();
        filtered = filtered.filter(c => (c.mc_number || "").toLowerCase().includes(mcq));
      }
      if (phoneSearch) {
        const pq = phoneSearch.toLowerCase();
        filtered = filtered.filter(c => (c.phone || "").toLowerCase().includes(pq));
      }
      if (allocatedDate) {
        filtered = filtered.filter(c => c.assigned_date && c.assigned_date.split("T")[0] === allocatedDate);
      }
      if (statusFilter) filtered = filtered.filter(c => c.lead_status === statusFilter);
      if (safetyFilter) filtered = filtered.filter(c => c.safety_qualification === safetyFilter);
      if (stateFilter) filtered = filtered.filter(c => c.state === stateFilter);
      if (operationFilter) filtered = filtered.filter(c => getOperationType(c) === operationFilter);

      setCarriers(filtered);
      setHasMore(filtered.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, mcSearch, phoneSearch, allocatedDate, statusFilter, safetyFilter, stateFilter, operationFilter, currentUser, isAdmin]);

  useEffect(() => { if (currentUser) loadCarriers(true); }, [loadCarriers, currentUser]);

  const handleResearch = async (carrierId, usdot) => {
    setResearching(true);
    try {
      await base44.functions.invoke("researchCarrier", { carrier_id: carrierId, usdot });
      loadCarriers();
    } catch (err) {
      alert("Research failed: " + (err.response?.data?.error || err.message));
    } finally {
      setResearching(false);
    }
  };

  const exportToExcel = () => {
    if (carriers.length === 0) return;
    setExporting(true);
    try {
      const rows = carriers.map(c => ({
        "Staff Lead Status": Array.isArray(c.staff_lead_status) ? c.staff_lead_status.join(", ") : (c.staff_lead_status || ""),
        "Staff Comment": c.staff_comment || "",
        "Allocated On": c.assigned_date || "",
        "Legal Name": c.legal_name || "",
        "DBA Name": c.dba_name || "",
        "USDOT": c.usdot_number || "",
        "MC": c.mc_number || "",
        "MX": c.mx_number || "",
        "Operating Status": c.operating_status || "",
        "State": c.state || "",
        "City": c.city || "",
        "Phone": c.phone || "",
        "Email": c.email || "",
        "Owner": c.owner_name || "",
        "Power Units": c.power_units ?? "",
        "Drivers": c.drivers ?? "",
        "Equipment": c.equipment_types || "",
        "Cargo Types": c.cargo_types || "",
        "Safety Qualification": c.safety_qualification || "",
        "Safety Rating": c.safety_rating || "",
        "Lead Score": c.lead_score ?? "",
        "Lead Status": c.lead_status || "",
        "Last Researched": c.last_researched_at || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.min(Math.max(k.length + 2, 12), 40) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Carriers");
      const suffix = safetyFilter ? `_${safetyFilter.replace(/\s+/g, "_")}` : "";
      XLSX.writeFile(wb, `carriers${suffix}_${Date.now()}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const states = [...new Set(carriers.map(c => c.state).filter(Boolean))].sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Database</h1>
          <p className="text-slate-500 text-sm mt-1">{carriers.length} carriers</p>
        </div>
        <div className="flex items-center gap-2">
          {!researchCenter.running ? (
            <button onClick={startRunnerResearch} disabled={carriers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              <Radar className="w-4 h-4" />
              Research Center
            </button>
          ) : (
            <button onClick={stopRunnerResearch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              <Square className="w-4 h-4" />
              Stop Research
            </button>
          )}
          <button onClick={exportToExcel} disabled={exporting || carriers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export to Excel
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={allocatedDate}
                onChange={e => setAllocatedDate(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {allocatedDate && (
                <button
                  onClick={() => setAllocatedDate("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  title="Clear date filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setAllocatedDate(new Date().toISOString().split("T")[0])}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${allocatedDate === new Date().toISOString().split("T")[0] ? "bg-violet-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>
          </div>
          <button onClick={handleBulkDelete} disabled={deleting || selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>
          <Link to="/import-export" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Import Carriers
          </Link>
        </div>
      </div>

      {researchCenter.running && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-violet-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {researchCenter.progress.current}
            </span>
            <span className="text-sm text-violet-600">{researchCenter.progress.done} done, {researchCenter.progress.failed} failed</span>
          </div>
          <div className="w-full bg-violet-100 rounded-full h-2">
            <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${researchCenter.progress.total ? (researchCenter.progress.done + researchCenter.progress.failed) / researchCenter.progress.total * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-violet-700 mt-2">Running in the background — you can navigate to other pages and this will keep going.</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, USDOT, MC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by MC number..."
              value={mcSearch}
              onChange={e => setMcSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone..."
              value={phoneSearch}
              onChange={e => setPhoneSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={safetyFilter} onChange={e => setSafetyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Safety</option>
            <option value="Qualified">Qualified</option>
            <option value="Review Required">Review Required</option>
            <option value="High Risk">High Risk</option>
            <option value="Insufficient Data">Insufficient Data</option>
            <option value="Not Assessed">Not Assessed</option>
          </select>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={operationFilter} onChange={e => setOperationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Operations</option>
            <option value="Interstate">Interstate</option>
            <option value="Intrastate">Intrastate</option>
            <option value="Both">Both</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-auto h-[340px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : carriers.length === 0 ? (
          <div className="text-center py-20">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No carriers found. Import carriers to get started.</p>
            <Link to="/import-export" className="inline-block mt-3 text-blue-600 text-sm font-medium hover:underline">
              Import Carriers →
            </Link>
          </div>
        ) : (
            <table className="min-w-full w-max text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={carriers.length > 0 && selectedIds.size === carriers.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                   <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">USDOT</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">MC</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">State</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Operation</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Equipment</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Units</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Safety</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Scraped On</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Allocated On</th>
                  {!isAdmin && <th className="text-left px-4 py-3 font-medium text-slate-600">Lead Mark</th>}
                  {!isAdmin && <th className="text-left px-4 py-3 font-medium text-slate-600">Approach Result / Comment</th>}
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carriers.map(carrier => (
                  <tr key={carrier.id} className={`hover:bg-slate-50 ${selectedIds.has(carrier.id) ? "bg-blue-50" : ""}`}>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(carrier.id)}
                        onChange={() => toggleSelect(carrier.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/carriers/${carrier.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {carrier.legal_name || carrier.dba_name || "Unknown"}
                      </Link>
                      {carrier.dba_name && carrier.legal_name && (
                        <p className="text-xs text-slate-400">DBA: {carrier.dba_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{carrier.usdot_number || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{carrier.mc_number || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{carrier.state || "—"}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const op = getOperationType(carrier);
                        const cls = op === "Interstate" ? "bg-blue-100 text-blue-700" :
                          op === "Intrastate" ? "bg-amber-100 text-amber-700" :
                          op === "Both" ? "bg-purple-100 text-purple-700" :
                          "bg-slate-100 text-slate-500";
                        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{op}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{carrier.equipment_types || "—"}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{carrier.power_units || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SAFETY_COLORS[carrier.safety_qualification] || SAFETY_COLORS["Not Assessed"]}`}>
                        {carrier.safety_qualification || "Not Assessed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {carrier.lead_score ? (
                        <span className="font-semibold text-slate-700">{carrier.lead_score}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[carrier.lead_status] || "bg-slate-100 text-slate-700"}`}>
                        {carrier.lead_status || "Imported"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {carrier.last_researched_at
                        ? new Date(carrier.last_researched_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {carrier.assigned_date
                        ? <span className="text-slate-600">{new Date(carrier.assigned_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    {!isAdmin && (
                      <td className="px-4 py-3">
                        {(() => {
                          const statuses = Array.isArray(carrier.staff_lead_status)
                            ? carrier.staff_lead_status
                            : (carrier.staff_lead_status ? [carrier.staff_lead_status] : []);
                          if (statuses.length === 0) {
                            return <span className="text-xs text-slate-400">Not approached</span>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1">
                              {statuses.map(s => (
                                <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                  s === "Not Approached" ? "bg-slate-100 text-slate-500" :
                                  s === "Approached" ? "bg-emerald-100 text-emerald-700" :
                                  s === "Lead" ? "bg-blue-100 text-blue-700" :
                                  s === "Dead Lead" ? "bg-red-100 text-red-700" :
                                  s === "Follow-up" ? "bg-amber-100 text-amber-700" :
                                  s === "Voicemail Left" ? "bg-cyan-100 text-cyan-700" :
                                  s === "Hangup" ? "bg-slate-200 text-slate-700" :
                                  s === "Onboard" ? "bg-green-100 text-green-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>{s}</span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                    )}
                    {!isAdmin && (
                      <td className="px-4 py-3 min-w-[200px]">
                        <textarea
                          value={commentInputs[carrier.id] !== undefined ? commentInputs[carrier.id] : (carrier.staff_comment || "")}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [carrier.id]: e.target.value }))}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== (carrier.staff_comment || "")) saveComment(carrier.id, val);
                          }}
                          placeholder="Write approach result..."
                          rows={1}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                        {savingComment === carrier.id && <p className="text-[10px] text-blue-500 mt-0.5">Saving...</p>}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/carriers/${carrier.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {carrier.usdot_number && carrier.lead_status === "Imported" && (
                          <button onClick={() => handleResearch(carrier.id, carrier.usdot_number)}
                            disabled={researching}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
                            title="Research Carrier">
                            <RefreshCw className={`w-4 h-4 ${researching ? "animate-spin" : ""}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
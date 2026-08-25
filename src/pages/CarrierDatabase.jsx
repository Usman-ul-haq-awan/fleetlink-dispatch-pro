import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Filter, Eye, Truck, RefreshCw } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState("");
  const [safetyFilter, setSafetyFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [researching, setResearching] = useState(false);
  const PAGE_SIZE = 50;

  const loadCarriers = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const all = await base44.entities.Carrier.list("-updated_date", 500);
      let filtered = all;

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c =>
          (c.legal_name || "").toLowerCase().includes(q) ||
          (c.dba_name || "").toLowerCase().includes(q) ||
          (c.usdot_number || "").includes(q) ||
          (c.mc_number || "").includes(q)
        );
      }
      if (statusFilter) filtered = filtered.filter(c => c.lead_status === statusFilter);
      if (safetyFilter) filtered = filtered.filter(c => c.safety_qualification === safetyFilter);
      if (stateFilter) filtered = filtered.filter(c => c.state === stateFilter);

      setCarriers(filtered);
      setHasMore(filtered.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, safetyFilter, stateFilter]);

  useEffect(() => { loadCarriers(true); }, [loadCarriers]);

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

  const states = [...new Set(carriers.map(c => c.state).filter(Boolean))].sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Database</h1>
          <p className="text-slate-500 text-sm mt-1">{carriers.length} carriers</p>
        </div>
        <Link to="/import-export" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Import Carriers
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">USDOT</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">MC</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">State</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Equipment</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Units</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Safety</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carriers.map(carrier => (
                  <tr key={carrier.id} className="hover:bg-slate-50">
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
          </div>
        )}
      </div>
    </div>
  );
}
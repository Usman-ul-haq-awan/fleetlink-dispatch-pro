import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Loader2, Truck, Plus } from "lucide-react";
import { listAllCarriers } from "@/lib/paginatedList";

export default function StartOnboardingModal({ open, onClose, existingCarrierIds, onCreated }) {
  const [carriers, setCarriers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listAllCarriers("-updated_date")
      .then((all) => {
        // Exclude carriers that already have an onboarding record
        const available = all.filter((c) => !existingCarrierIds.has(c.id));
        setCarriers(available);
        setFiltered(available);
      })
      .catch((err) => setError(err.message || "Failed to load carriers"))
      .finally(() => setLoading(false));
  }, [open, existingCarrierIds]);

  useEffect(() => {
    if (!search) {
      setFiltered(carriers);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      carriers.filter(
        (c) =>
          (c.legal_name || "").toLowerCase().includes(q) ||
          (c.dba_name || "").toLowerCase().includes(q) ||
          (c.usdot_number || "").includes(q) ||
          (c.mc_number || "").includes(q)
      )
    );
  }, [search, carriers]);

  const handleStart = async (carrier) => {
    setCreating(carrier.id);
    setError("");
    try {
      await base44.entities.Onboarding.create({
        carrier_id: carrier.id,
        onboarding_status: "New",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await base44.entities.Carrier.update(carrier.id, { lead_status: "Onboarding" });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to start onboarding");
    } finally {
      setCreating(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Start Onboarding
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, USDOT, or MC number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {filtered.length} carrier{filtered.length !== 1 ? "s" : ""} available for onboarding
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {carriers.length === 0
                  ? "All carriers are already in onboarding."
                  : "No carriers match your search."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.slice(0, 100).map((carrier) => (
                <div
                  key={carrier.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {carrier.legal_name || carrier.dba_name || "Unknown Carrier"}
                    </p>
                    <p className="text-xs text-slate-500">
                      USDOT: {carrier.usdot_number || "—"} • MC: {carrier.mc_number || "—"} •{" "}
                      {carrier.state || "—"} • Status: {carrier.lead_status || "Imported"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStart(carrier)}
                    disabled={creating === carrier.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 ml-3"
                  >
                    {creating === carrier.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
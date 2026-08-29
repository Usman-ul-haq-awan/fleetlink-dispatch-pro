import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Eye, Pencil, Trash2, Loader2, Briefcase, X, ShieldCheck, RefreshCw, Radar } from "lucide-react";
import BrokerForm from "@/components/brokers/BrokerForm";
import BrokerScoreCard from "@/components/brokers/BrokerScoreCard";
import { RATING_COLORS, RATING_DOT, scoreBroker } from "@/lib/brokerScoring";

const AUTHORITY_COLORS = {
  "Active": "bg-green-100 text-green-700",
  "Inactive": "bg-slate-100 text-slate-500",
  "Suspended": "bg-orange-100 text-orange-700",
  "Revoked": "bg-red-100 text-red-700",
  "Not Verified": "bg-slate-100 text-slate-400",
};

const STATUS_COLORS = {
  "Pending": "bg-slate-100 text-slate-600",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Review": "bg-amber-100 text-amber-700",
};

export default function BrokerVetting() {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [rescanning, setRescanning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Broker.list("-vetting_date", 500);
      let filtered = all;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(b =>
          (b.broker_name || "").toLowerCase().includes(q) ||
          (b.mc_number || "").includes(q) ||
          (b.usdot_number || "").includes(q)
        );
      }
      if (ratingFilter) filtered = filtered.filter(b => b.vetting_rating === ratingFilter);
      if (statusFilter) filtered = filtered.filter(b => b.vetting_status === statusFilter);
      setBrokers(filtered);
    } catch (err) {
      console.error("Broker load error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (b) => { setEditing(b); setShowForm(true); setDetail(null); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, vetting_date: new Date().toISOString() };
      if (editing) {
        await base44.entities.Broker.update(editing.id, payload);
      } else {
        await base44.entities.Broker.create(payload);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      alert("Failed to save broker: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete broker "${b.broker_name}"?`)) return;
    try {
      await base44.entities.Broker.delete(b.id);
      setDetail(null);
      load();
    } catch (err) {
      alert("Delete failed: " + (err.message || ""));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await base44.functions.invoke("syncBrokersFromCarriers", {});
      const d = res.data || res;
      setSyncMsg(`Scanned ${d.total_carriers_scanned} carriers — found ${d.broker_carriers_found} brokers, created ${d.brokers_created} new, skipped ${d.brokers_skipped_existing} existing. Total brokers now: ${d.total_brokers_now}.`);
      load();
    } catch (err) {
      setSyncMsg("Sync failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleRescan = async (b) => {
    setRescanning(b.id);
    try {
      const { score, rating } = scoreBroker(b);
      await base44.entities.Broker.update(b.id, {
        vetting_score: score,
        vetting_rating: rating,
        vetting_date: new Date().toISOString(),
      });
      load();
      if (detail?.id === b.id) setDetail({ ...b, vetting_score: score, vetting_rating: rating });
    } catch (err) {
      alert("Re-scan failed: " + (err.message || ""));
    } finally {
      setRescanning(null);
    }
  };

  const setStatus = async (b, status) => {
    try {
      await base44.entities.Broker.update(b.id, { vetting_status: status });
      load();
      if (detail?.id === b.id) setDetail({ ...b, vetting_status: status });
    } catch (err) {
      alert("Update failed: " + (err.message || ""));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> Broker Vetting
          </h1>
          <p className="text-slate-500 text-sm mt-1">{brokers.length} brokers — verify authority, bond, payment reputation & load legitimacy</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Sync from Carriers
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Broker
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4 text-sm text-violet-800">{syncMsg}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search name, MC, USDOT..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Ratings</option>
            <option>Approved</option><option>Approved with Caution</option><option>High Risk</option><option>Do Not Use</option><option>Not Scored</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option>Pending</option><option>Approved</option><option>Rejected</option><option>Review</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : brokers.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No brokers yet. Add a broker to start vetting.</p>
          </div>
        ) : (
          <table className="min-w-full w-max text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                {["Broker Name","MC","DOT","Authority","Bond","Phone","Email","Years","Pay Days","Complaints","Fraud Flags","Score","Rating","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brokers.map(b => {
                const complaints = (b.non_payment_reports||0)+(b.slow_payment_complaints||0)+(b.cargo_disputes||0);
                const fraudFlags = (b.fraud_complaints||0)+(b.double_brokering_complaints||0);
                const bondOk = b.bond_verified && b.bond_active;
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <button onClick={() => setDetail(b)} className="text-left hover:text-blue-600 hover:underline">{b.broker_name}</button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.mc_number || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{b.usdot_number || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${AUTHORITY_COLORS[b.authority_status]||AUTHORITY_COLORS["Not Verified"]}`}>{b.authority_status||"Not Verified"}</span></td>
                    <td className="px-4 py-3">
                      {b.bond_type ? (
                        <span className={`text-xs font-medium ${bondOk ? "text-green-700" : "text-slate-500"}`}>{b.bond_type} {bondOk ? "✓" : ""}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{b.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{b.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{b.years_active || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{b.payment_days_avg || "—"}</td>
                    <td className="px-4 py-3 text-center"><span className={complaints>0?"text-amber-600 font-medium":"text-slate-400"}>{complaints}</span></td>
                    <td className="px-4 py-3 text-center"><span className={fraudFlags>0?"text-red-600 font-medium":"text-slate-400"}>{fraudFlags}</span></td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{b.vetting_score ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${RATING_COLORS[b.vetting_rating]||RATING_COLORS["Not Scored"]}`}><span className={`w-1.5 h-1.5 rounded-full ${RATING_DOT[b.vetting_rating]||RATING_DOT["Not Scored"]}`} />{b.vetting_rating||"Not Scored"}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.vetting_status]||STATUS_COLORS["Pending"]}`}>{b.vetting_status||"Pending"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetail(b)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleRescan(b)} disabled={rescanning === b.id} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded disabled:opacity-50" title="Re-scan score">
                          {rescanning === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(b)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-slate-900">{editing ? "Edit Broker" : "Add Broker"}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <BrokerForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} saving={saving} />
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{detail.broker_name}</h2>
                {detail.dba_name && <p className="text-xs text-slate-500">DBA: {detail.dba_name}</p>}
              </div>
              <button onClick={() => setDetail(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <Section title="Identity">
                  <Row label="MC" value={detail.mc_number} />
                  <Row label="USDOT" value={detail.usdot_number} />
                  <Row label="Phone" value={detail.phone} />
                  <Row label="Email" value={detail.email} />
                  <Row label="Website" value={detail.website} />
                  <Row label="Contact" value={[detail.contact_person, detail.contact_title].filter(Boolean).join(" — ")} />
                  <Row label="Address" value={[detail.address, detail.city, detail.state, detail.zip].filter(Boolean).join(", ")} />
                </Section>
                <Section title="Authority & Bond">
                  <Row label="Authority Status" value={detail.authority_status} />
                  <Row label="Authority Type" value={detail.authority_type} />
                  <Row label="Authority Verified" value={detail.authority_verified ? "Yes" : "No"} />
                  <Row label="Name Matches" value={detail.name_matches_authority ? "Yes" : "No"} />
                  <Row label="Bond Type" value={detail.bond_type} />
                  <Row label="Bond Amount" value={detail.bond_amount ? `$${detail.bond_amount}` : "—"} />
                  <Row label="Bond Active" value={detail.bond_active ? "Yes" : "No"} />
                </Section>
                <Section title="Payment Reputation">
                  <Row label="Avg Days to Pay" value={detail.payment_days_avg} />
                  <Row label="Years Active" value={detail.years_active} />
                  <Row label="Non-Payment Reports" value={detail.non_payment_reports} />
                  <Row label="Slow-Payment Complaints" value={detail.slow_payment_complaints} />
                  <Row label="Double-Brokering" value={detail.double_brokering_complaints} />
                  <Row label="Fraud Complaints" value={detail.fraud_complaints} />
                  <Row label="Cargo Disputes" value={detail.cargo_disputes} />
                  <Row label="Working w/ Carriers" value={detail.currently_working_with_carriers ? "Yes" : "No"} />
                  {detail.carrier_reviews && <Row label="Reviews" value={detail.carrier_reviews} />}
                </Section>
                <Section title="Load Details">
                  <Row label="Pickup" value={detail.load_pickup} />
                  <Row label="Delivery" value={detail.load_delivery} />
                  <Row label="Commodity" value={detail.load_commodity} />
                  <Row label="Weight" value={detail.load_weight} />
                  <Row label="Rate" value={detail.load_rate ? `$${detail.load_rate}` : "—"} />
                  <Row label="Mileage" value={detail.load_mileage} />
                  <Row label="Rate Conf. Received" value={detail.rate_confirmation_received ? "Yes" : "No"} />
                  <Row label="Rate Above Market" value={detail.load_rate_warning ? "Yes ⚠" : "No"} />
                  <Row label="Who Pays Carrier" value={detail.who_pays_carrier} />
                </Section>
                {detail.notes && <Section title="Notes"><p className="text-sm text-slate-600">{detail.notes}</p></Section>}
              </div>
              <div className="space-y-4">
                <BrokerScoreCard broker={detail} />
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Vetting Status</h3>
                  <div className="flex flex-col gap-2">
                    {["Pending","Approved","Rejected","Review"].map(s => (
                      <button key={s} onClick={() => setStatus(detail, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${detail.vetting_status===s ? "bg-blue-600 text-white border-blue-600" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => openEdit(detail)} className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  const v = value === 0 ? "0" : (value || "—");
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 text-right">{v}</span>
    </div>
  );
}
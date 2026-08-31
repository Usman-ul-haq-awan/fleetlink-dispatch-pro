import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { UserCheck, Phone, Mail, Truck } from "lucide-react";
import { useEntity } from "@/lib/entityContext";
import VisitorEmptyState from "@/components/VisitorEmptyState";

export default function HumanHandoff() {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isVisitor } = useEntity();

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Handoff.list("-created_at", 100);
      setHandoffs(all);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!isVisitor) load(); }, [isVisitor]);

  const updateStatus = async (handoff, status) => {
    await base44.entities.Handoff.update(handoff.id, { status });
    if (status === "Completed") {
      const ob = await base44.entities.Onboarding.filter({ carrier_id: handoff.carrier_id });
      if (ob.length === 0) {
        await base44.entities.Onboarding.create({
          carrier_id: handoff.carrier_id,
          onboarding_status: "New",
          created_at: new Date().toISOString(),
        });
      }
      await base44.entities.Carrier.update(handoff.carrier_id, { lead_status: "Onboarding" });
    }
    load();
  };

  if (isVisitor) return <VisitorEmptyState title="Human Handoff" message="Handoff records are hidden for visitors." />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Human Handoff</h1>
        <p className="text-slate-500 text-sm mt-1">Hot leads ready for back office onboarding</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : handoffs.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No handoffs yet. Hot leads will appear here when carriers express interest.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {handoffs.map(h => (
            <div key={h.id} className={`bg-white rounded-lg border p-4 ${h.is_hot_lead ? "border-orange-200 bg-orange-50" : "border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {h.is_hot_lead && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">🔥 Hot Lead</span>}
                    <Link to={`/carriers/${h.carrier_id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                      {h.usdot_number ? `USDOT ${h.usdot_number}` : "View Carrier"}
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                    {h.contact_name && <div className="text-slate-600">Contact: <strong>{h.contact_name}</strong></div>}
                    {h.phone && <div className="text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {h.phone}</div>}
                    {h.email && <div className="text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {h.email}</div>}
                    {h.mc_number && <div className="text-slate-600">MC: <strong>{h.mc_number}</strong></div>}
                    {h.equipment && <div className="text-slate-600 flex items-center gap-1"><Truck className="w-3 h-3" /> {h.equipment}</div>}
                    <div className="text-slate-600">Score: <strong>{h.lead_score || 0}</strong></div>
                    <div className="text-slate-600">Safety: <strong>{h.safety_qualification || "—"}</strong></div>
                  </div>
                  {h.notes && <p className="text-xs text-slate-500 mt-2">{h.notes}</p>}
                  {h.next_action && <p className="text-xs text-blue-600 mt-1">Next: {h.next_action}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  {["New", "Assigned", "Contacted", "Completed", "Lost"].map(s => (
                    <button key={s} onClick={() => updateStatus(h, s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        h.status === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
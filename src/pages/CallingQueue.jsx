import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Phone, PhoneCall, AlertCircle } from "lucide-react";

export default function CallingQueue() {
  const [calls, setCalls] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logOutcome, setLogOutcome] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const readyCarriers = await base44.entities.Carrier.filter({ lead_status: "Ready for Outreach" }, "-lead_score", 100);
      setCarriers(readyCarriers);
      const recentCalls = await base44.entities.CallLog.list("-call_date", 50);
      setCalls(recentCalls);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const logCall = async (carrier, outcome) => {
    try {
      await base44.entities.CallLog.create({
        carrier_id: carrier.id,
        phone_number: carrier.phone || "",
        outcome: outcome,
        call_date: new Date().toISOString(),
        status: "Completed",
        is_ai_call: false,
        notes: "Manual call logged",
      });

      if (outcome === "Do Not Contact") {
        await base44.entities.Carrier.update(carrier.id, { do_not_contact: true, dnc_reason: "Call outcome: Do Not Contact", lead_status: "Do Not Contact" });
      } else if (outcome === "Interested" || outcome === "Very Interested" || outcome === "Callback Requested") {
        await base44.entities.Carrier.update(carrier.id, { lead_status: "Interested" });
        await base44.entities.Handoff.create({
          carrier_id: carrier.id,
          contact_name: carrier.contact_name || carrier.owner_name || "",
          phone: carrier.phone || "",
          email: carrier.email || "",
          mc_number: carrier.mc_number || "",
          usdot_number: carrier.usdot_number || "",
          equipment: carrier.equipment_types || "",
          lead_score: carrier.lead_score || 0,
          safety_qualification: carrier.safety_qualification || "",
          trigger_source: "Call",
          trigger_outcome: outcome,
          notes: `Call outcome: ${outcome}`,
          next_action: "Back office to contact for onboarding",
          status: "New",
          is_hot_lead: true,
          created_at: new Date().toISOString(),
        });
        await base44.entities.ActivityLog.create({
          carrier_id: carrier.id,
          action: "Human handoff created",
          workflow: "CallingQueue",
          details: `Call outcome: ${outcome}. Hot lead for back office.`,
          status: "Success",
          timestamp: new Date().toISOString(),
        });
      } else if (outcome === "Human Handoff") {
        await base44.entities.Carrier.update(carrier.id, { lead_status: "Human Handoff" });
      }

      setLogOutcome(null);
      load();
    } catch (err) { alert("Failed to log call: " + err.message); }
  };

  const OUTCOMES = ["No Answer", "Voicemail", "Interested", "Very Interested", "Callback Requested", "Not Interested", "Already Has Dispatcher", "Wrong Number", "Do Not Contact", "Human Handoff"];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calling Queue</h1>
        <p className="text-slate-500 text-sm mt-1">Carriers ready for outreach calls</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">AI Calling Not Yet Active</p>
            <p className="text-xs text-blue-700 mt-1">
              The calling queue and data model are ready. To activate AI voice calling, connect a voice provider
              (Retell AI, Vapi, Twilio). The AI will use a female voice, your corporate business number as caller ID,
              and will identify itself as an AI assistant. You can manually log call outcomes below.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900 text-sm">Call Queue ({carriers.length})</h2>
            </div>
            {carriers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No carriers ready for outreach.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {carriers.map(carrier => (
                  <div key={carrier.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link to={`/carriers/${carrier.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                          {carrier.legal_name || "Unknown"}
                        </Link>
                        <p className="text-xs text-slate-500">
                          USDOT: {carrier.usdot_number || "—"} • Phone: {carrier.phone || "—"} • Score: {carrier.lead_score || 0}
                        </p>
                      </div>
                      <button onClick={() => setLogOutcome(logOutcome === carrier.id ? null : carrier.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">
                        <PhoneCall className="w-3 h-3" /> Log Call
                      </button>
                    </div>
                    {logOutcome === carrier.id && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {OUTCOMES.map(o => (
                          <button key={o} onClick={() => logCall(carrier, o)}
                            className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-100">
                            {o}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {calls.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 text-sm">Recent Calls ({calls.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {calls.map(call => (
                  <div key={call.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{call.outcome || "Pending"}</span>
                      <p className="text-xs text-slate-400">{call.phone_number} • {call.call_date ? new Date(call.call_date).toLocaleString() : ""}</p>
                    </div>
                    {call.notes && <span className="text-xs text-slate-500">{call.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ClipboardCheck, ChevronDown, ChevronUp, FileText } from "lucide-react";
import OnboardingDetail from "@/components/onboarding/OnboardingDetail";

const STATUSES = [
  "New",
  "Contacted",
  "Documents Requested",
  "Documents Received",
  "Under Review",
  "Ready for Dispatch",
  "Active Client",
  "Lost",
];

const CHECKLIST = [
  { key: "dispatch_agreement", label: "Dispatch Agreement" },
  { key: "carrier_documents", label: "Carrier Documents" },
  { key: "w9_received", label: "W-9" },
  { key: "insurance_verified", label: "Insurance" },
  { key: "operating_authority_verified", label: "Operating Authority" },
  { key: "equipment_confirmed", label: "Equipment" },
];

export default function OnboardingPage() {
  const [onboardingRecords, setOnboardingRecords] = useState([]);
  const [carriers, setCarriers] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Onboarding.list("-updated_at", 200);
      setOnboardingRecords(all);
      const carrierIds = [...new Set(all.map((o) => o.carrier_id))];
      const carrierPromises = carrierIds.map((id) =>
        base44.entities.Carrier.get(id).catch(() => null)
      );
      const carrierResults = await Promise.all(carrierPromises);
      const carrierMap = {};
      carrierResults.forEach((c) => {
        if (c) carrierMap[c.id] = c;
      });
      setCarriers(carrierMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (record, status) => {
    await base44.entities.Onboarding.update(record.id, {
      onboarding_status: status,
      updated_at: new Date().toISOString(),
    });
    const carrier = carriers[record.carrier_id];
    if (carrier) {
      const newLeadStatus = status === "Active Client" ? "Active Client" : "Onboarding";
      await base44.entities.Carrier.update(carrier.id, { lead_status: newLeadStatus });
    }
    load();
  };

  const toggleChecklist = async (record, field) => {
    await base44.entities.Onboarding.update(record.id, {
      [field]: !record[field],
      updated_at: new Date().toISOString(),
    });
    load();
  };

  const docCount = (record) => {
    const keys = ["mc_authority_url", "coi_url", "w9_url", "setup_packet_url"];
    if (record.uses_factoring) keys.push("notice_of_assignment_url");
    else keys.push("void_check_url");
    return keys.filter((k) => record[k]).length;
  };

  const totalDocs = (record) => (record.uses_factoring ? 5 : 5);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Onboarding</h1>
        <p className="text-slate-500 text-sm mt-1">
          {onboardingRecords.length} carriers in onboarding pipeline
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : onboardingRecords.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            No carriers in onboarding. Move hot leads to onboarding from the Human Handoff page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {onboardingRecords.map((record) => {
            const carrier = carriers[record.carrier_id];
            const completedItems = CHECKLIST.filter((c) => record[c.key]).length;
            const docs = docCount(record);
            const isExpanded = expandedId === record.id;

            return (
              <div
                key={record.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        to={`/carriers/${record.carrier_id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {carrier?.legal_name || "Unknown Carrier"}
                      </Link>
                      <p className="text-xs text-slate-500">
                        USDOT: {carrier?.usdot_number || "—"} • MC: {carrier?.mc_number || "—"} •
                        Checklist: {completedItems}/{CHECKLIST.length} • Documents: {docs}/
                        {totalDocs(record)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          record.onboarding_status === "Active Client"
                            ? "bg-green-100 text-green-700"
                            : record.onboarding_status === "Ready for Dispatch"
                            ? "bg-blue-100 text-blue-700"
                            : record.onboarding_status === "Lost"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {record.onboarding_status}
                      </span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isExpanded ? "Hide" : "Profile & Documents"}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(record, s)}
                        className={`px-2 py-1 rounded text-xs ${
                          record.onboarding_status === s
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CHECKLIST.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={record[item.key] || false}
                          onChange={() => toggleChecklist(record, item.key)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <OnboardingDetail
                      record={record}
                      carrier={carrier}
                      onReload={load}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
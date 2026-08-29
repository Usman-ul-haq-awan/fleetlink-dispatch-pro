import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Target, XCircle, Clock, UserCheck, Voicemail } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "Lead", label: "Lead", icon: Target, activeClass: "bg-blue-600 text-white border-blue-600", inactiveClass: "text-blue-700 border-blue-200 hover:bg-blue-50" },
  { value: "Dead Lead", label: "Dead Lead", icon: XCircle, activeClass: "bg-red-600 text-white border-red-600", inactiveClass: "text-red-700 border-red-200 hover:bg-red-50" },
  { value: "Follow-up", label: "Follow-up", icon: Clock, activeClass: "bg-amber-500 text-white border-amber-500", inactiveClass: "text-amber-700 border-amber-200 hover:bg-amber-50" },
  { value: "Voicemail Left", label: "Voicemail Left", icon: Voicemail, activeClass: "bg-cyan-600 text-white border-cyan-600", inactiveClass: "text-cyan-700 border-cyan-200 hover:bg-cyan-50" },
  { value: "Onboard", label: "Onboard", icon: UserCheck, activeClass: "bg-green-600 text-white border-green-600", inactiveClass: "text-green-700 border-green-200 hover:bg-green-50" },
];

export default function StaffLeadBar({ carrier, existingOnboarding, onUpdated }) {
  const [setting, setSetting] = useState(null);

  const handleSet = async (status) => {
    setSetting(status);
    try {
      const updates = { staff_lead_status: status };
      if (status === "Onboard") {
        updates.lead_status = "Onboarding";
        if (!existingOnboarding) {
          await base44.entities.Onboarding.create({
            carrier_id: carrier.id,
            onboarding_status: "New",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      await base44.entities.Carrier.update(carrier.id, updates);
      onUpdated();
    } catch (err) {
      alert("Failed to update lead status: " + (err.message || ""));
    } finally {
      setSetting(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Mark as:</span>
        {STATUS_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isActive = carrier.staff_lead_status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSet(opt.value)}
              disabled={setting !== null}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                isActive ? opt.activeClass : opt.inactiveClass
              }`}
            >
              {setting === opt.value ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {opt.label}
            </button>
          );
        })}
        {carrier.staff_lead_status && (
          <span className="text-xs text-slate-400 ml-auto">
            Currently marked: <strong className="text-slate-600">{carrier.staff_lead_status}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
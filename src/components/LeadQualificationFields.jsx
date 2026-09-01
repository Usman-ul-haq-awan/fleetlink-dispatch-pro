import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ClipboardCheck } from "lucide-react";

// Lead Qualification Fields — a set of single-select dropdowns staff fill in
// while working a carrier. Each change persists immediately. Stored on the
// Carrier entity alongside staff_lead_status / staff_comment.

const QUAL_FIELDS = [
  { key: "lead_qual_status", label: "Lead Status", options: ["Hot Lead", "Warm Lead", "Qualified", "Ideal", "Not Qualified"] },
  { key: "follow_up_required", label: "Follow-up", options: ["Required", "Not Required"] },
  { key: "callback_attempted", label: "Callback Attempted by Carrier", options: ["Yes", "No"] },
  { key: "priority", label: "Priority", options: ["High", "Not High"] },
  { key: "asset", label: "Asset", options: ["Yes", "Not"] },
  { key: "interest_level", label: "Interest Level", options: ["High", "Medium", "Low", "Unknown"] },
  { key: "dispatch_needed", label: "Dispatch Needed", options: ["Yes", "No", "Unknown"] },
  { key: "truck_available", label: "Truck Available", options: ["Yes", "No", "Unknown"] },
  { key: "lead_equipment_type", label: "Equipment Type", options: ["Dry Van", "Reefer", "Flatbed", "Box Truck", "Power Only", "Other", "Unknown"] },
  { key: "number_of_trucks", label: "Number of Trucks", options: ["1", "2-5", "6-10", "10+"] },
  { key: "decision_maker_contacted", label: "Decision Maker Contacted", options: ["Yes", "No"] },
  { key: "decision_maker", label: "Decision Maker", options: ["Owner", "Driver", "Manager", "Dispatcher", "Other", "Unknown"] },
  { key: "tycoon_service_fit", label: "Tycoon Service Fit", options: ["High", "Medium", "Low", "None"] },
  { key: "qualification_result", label: "Qualification Result", options: ["Ideal", "Qualified", "Potential", "Needs Verification", "Not Qualified"] },
];

const normalizeStatuses = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

export default function LeadQualificationFields({ carrier, onUpdated }) {
  const [saving, setSaving] = useState(null);

  const handleChange = async (key, value) => {
    setSaving(key);
    try {
      await base44.entities.Carrier.update(carrier.id, {
        [key]: value,
        // Normalize legacy single-string values to array so schema validation passes
        staff_lead_status: normalizeStatuses(carrier.staff_lead_status),
      });
      onUpdated();
    } catch (err) {
      alert("Failed to save: " + (err.message || ""));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-1.5 mb-3">
        <ClipboardCheck className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">Lead Qualification</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUAL_FIELDS.map(field => {
          const current = carrier[field.key] || "";
          return (
            <div key={field.key} className="flex flex-col">
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                {field.label}
                {saving === field.key && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
              </label>
              <select
                value={current}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className={`px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  current ? "border-blue-300 bg-blue-50 text-slate-800" : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <option value="">—</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
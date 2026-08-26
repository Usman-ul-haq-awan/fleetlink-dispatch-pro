import React from "react";
import { Search, FileText, Shield, History, ClipboardList, FileCheck, AlertTriangle, Star, Lock, BadgeCheck } from "lucide-react";

// Canonical research step definitions. The `key` must match the keys used by
// the browser worker (browser-worker/scraper.js) and the backend function
// (researchCarrierBrowser) so selection flows end-to-end.
// Company Snapshot is always required — it's the entry point and performs
// USDOT identity validation, so it cannot be deselected.
export const RESEARCH_STEPS = [
  { key: "company_snapshot", name: "Company Snapshot", icon: Search, desc: "Legal name, DBA, USDOT/MC, address, phone, power units", required: true },
  { key: "sms_overview", name: "SMS Overview", icon: FileText, desc: "Safety Measurement System summary + BASIC categories", required: false },
  { key: "sms_profile", name: "Complete SMS Profile", icon: Shield, desc: "Full BASIC measures, percentiles, deficiency indicators", required: false },
  { key: "carrier_history", name: "Carrier History", icon: History, desc: "Historical status changes, authority revocations/reinstatements", required: false },
  { key: "registration", name: "Registration Details", icon: ClipboardList, desc: "Authority grants, BOC-3 process agents, operating authority", required: false },
  { key: "insurance", name: "Licensing & Insurance", icon: FileCheck, desc: "Insurance filings, policy numbers, coverage amounts", required: false },
  { key: "inspection_crash", name: "Inspections & Crashes", icon: AlertTriangle, desc: "Inspection counts, violations, out-of-service, crashes", required: false },
  { key: "safety_rating", name: "Safety Rating", icon: Star, desc: "Conditional/Satisfactory/Unsatisfactory safety audit rating", required: false },
  { key: "operation_status", name: "Operating Authority", icon: BadgeCheck, desc: "Gate — only keep carriers with AUTHORIZED FOR operating status", required: false },
];

export const ALL_STEP_KEYS = RESEARCH_STEPS.map(s => s.key);

export default function ResearchStepsSelector({ selected, onChange }) {
  const toggle = (key) => {
    if (selected.includes(key)) {
      // Don't allow unselecting required steps
      const step = RESEARCH_STEPS.find(s => s.key === key);
      if (step?.required) return;
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const selectAll = () => onChange(ALL_STEP_KEYS);
  const clearAll = () => onChange(RESEARCH_STEPS.filter(s => s.required).map(s => s.key));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-slate-800 text-sm">Research Criteria</h3>
          <p className="text-xs text-slate-500 mt-0.5">Select which data sections the worker extracts for this search.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">
            Select All
          </button>
          <button onClick={clearAll} className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {RESEARCH_STEPS.map(step => {
          const Icon = step.icon;
          const isOn = selected.includes(step.key);
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => toggle(step.key)}
              className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                isOn
                  ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  isOn ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                }`}>
                  {isOn && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <Icon className={`w-3.5 h-3.5 ${isOn ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-xs font-medium truncate ${isOn ? "text-slate-900" : "text-slate-500"}`}>{step.name}</span>
                {step.required && <Lock className="w-3 h-3 text-slate-300 ml-auto flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {selected.length} of {RESEARCH_STEPS.length} selected · Company Snapshot is always required (identity validation).
      </p>
    </div>
  );
}
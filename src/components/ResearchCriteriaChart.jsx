import React from "react";
import { Search, FileText, Shield, History, ClipboardList, FileCheck, AlertTriangle, Star } from "lucide-react";

// The 8 research steps the browser worker (browser-worker/scraper.js) executes
// for each carrier via FMCSA SAFER + SMS. Shown as a visual pipeline on the
// Dashboard so the team can see exactly what the worker extracts.
const RESEARCH_STEPS = [
  { icon: Search, name: "Company Snapshot", desc: "Legal name, DBA, USDOT/MC, operating status, address, phone, power units, drivers", color: "blue" },
  { icon: FileText, name: "SMS Overview", desc: "Safety Measurement System summary — BASIC categories and on-road performance", color: "indigo" },
  { icon: Shield, name: "Complete SMS Profile", desc: "Full BASIC measure values, percentiles, deficiency indicators, data period", color: "purple" },
  { icon: History, name: "Carrier History", desc: "Historical status changes, authority revocations, reinstatements, relevant dates", color: "amber" },
  { icon: ClipboardList, name: "Registration Details", desc: "Authority grants, motor carrier applications, BOC-3 process agents, operating authority", color: "cyan" },
  { icon: FileCheck, name: "Licensing & Insurance", desc: "Insurance filings (BI, PD, Cargo), policy numbers, coverage amounts, effective/cancellation dates", color: "green" },
  { icon: AlertTriangle, name: "Inspections & Crashes", desc: "Inspection counts, violations, out-of-service rate, fatal/injury/towaway crashes", color: "orange" },
  { icon: Star, name: "Safety Rating", desc: "Conditional/Satisfactory/Unsatisfactory rating from FMCSA safety audit", color: "rose" },
];

const colorMap = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  green: "border-green-200 bg-green-50 text-green-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function ResearchCriteriaChart() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-900">Worker Research Criteria</h2>
          <p className="text-xs text-slate-500 mt-0.5">8-step browser automation pipeline (FMCSA SAFER + SMS)</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          Per Carrier
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {RESEARCH_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.name} className={`rounded-lg border p-3 ${colorMap[step.color]}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-semibold truncate">{step.name}</span>
              </div>
              <p className="text-xs opacity-80 leading-snug">{step.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
        <Search className="w-3.5 h-3.5" />
        <span>Each step stores evidence with source URL, retrieval timestamp, and confidence level.</span>
      </div>
    </div>
  );
}
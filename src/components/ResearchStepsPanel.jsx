import React from "react";
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, ExternalLink } from "lucide-react";

const DEFAULT_STEPS = [
  { name: "Company Snapshot", status: "pending" },
  { name: "SMS Overview", status: "pending" },
  { name: "Complete SMS Profile", status: "pending" },
  { name: "Carrier History", status: "pending" },
  { name: "Registration Details", status: "pending" },
  { name: "Licensing & Insurance", status: "pending" },
  { name: "Inspections/Crashes", status: "pending" },
  { name: "Safety Rating", status: "pending" },
];

function StepIcon({ status }) {
  if (status === "ok") return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (status === "not_found") return <Clock className="w-4 h-4 text-slate-300 shrink-0" />;
  return <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />;
}

export default function ResearchStepsPanel({ research }) {
  if (!research) return null;
  const status = research.status;
  const steps = research.steps && research.steps.length > 0 ? research.steps : DEFAULT_STEPS;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
          <Loader2 className={`w-4 h-4 ${status === "running" ? "animate-spin text-blue-600" : "hidden"}`} />
          Browser Research: <span className="text-slate-600">{research.name}</span>
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          status === "running" ? "bg-blue-100 text-blue-700" :
          status === "done" ? "bg-green-100 text-green-700" :
          "bg-red-100 text-red-700"
        }`}>
          {status === "running" ? "Running in browser..." : status === "done" ? "Complete" : "Error"}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5">
            <StepIcon status={s.status} />
            <span className="truncate">{s.name}</span>
            {s.source_url && (
              <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-slate-300 hover:text-blue-600">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
      {research.errors && research.errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {research.errors.map((e, i) => (
            <div key={i} className="text-xs text-red-600 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{(e.state || e.step) ? `[${e.state || e.step}] ` : ""}{e.message || e}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
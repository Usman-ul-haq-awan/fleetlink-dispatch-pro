import React from "react";
import { RATING_COLORS, RATING_DOT } from "@/lib/brokerScoring";

export default function BrokerScoreCard({ broker }) {
  const score = broker.vetting_score ?? 0;
  const rating = broker.vetting_rating || "Not Scored";
  // Re-derive breakdown from stored broker for display
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Vetting Score</h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${RATING_COLORS[rating]}`}>
          <span className={`w-2 h-2 rounded-full ${RATING_DOT[rating]}`} />
          {rating}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-4xl font-bold text-slate-900">{score}</span>
        <span className="text-sm text-slate-400 mb-1">/ 100</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
        <div className={`h-2 rounded-full ${RATING_DOT[rating]}`} style={{ width: `${score}%` }} />
      </div>
      <div className="space-y-2 text-xs">
        {[
          { label: "Active FMCSA authority", max: 20 },
          { label: "Bond/trust verified", max: 15 },
          { label: "Company identity verified", max: 10 },
          { label: "Payment history", max: 20 },
          { label: "Carrier reviews/reputation", max: 15 },
          { label: "Time in business", max: 5 },
          { label: "Load/rate appears legitimate", max: 10 },
          { label: "Fraud/double-broker warning", max: 5 },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-slate-600">
            <span>{row.label}</span>
            <span className="font-medium text-slate-800">— / {row.max}</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 pt-1">Detailed per-category points are computed live in the edit form.</p>
      </div>
    </div>
  );
}
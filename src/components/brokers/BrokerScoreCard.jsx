import React from "react";
import { RATING_COLORS, RATING_DOT, scoreBroker } from "@/lib/brokerScoring";
import { ShieldCheck, FilePenLine } from "lucide-react";

// Categories that researchBroker auto-fills from FMCSA. The rest rely on
// manual entry (brokers don't publish payment reputation, load details, etc.).
const FMCSA_VERIFIED = new Set([
  "Active FMCSA authority",
  "Bond/trust verified",
  "Company identity verified",
  "Time in business",
]);

export default function BrokerScoreCard({ broker }) {
  const score = broker.vetting_score ?? 0;
  const rating = broker.vetting_rating || "Not Scored";
  const { breakdown } = scoreBroker(broker);

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
        {breakdown.map((row) => {
          const verified = FMCSA_VERIFIED.has(row.category);
          return (
            <div key={row.category} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-600">
                {verified ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-500" title="Auto-verified from FMCSA" />
                ) : (
                  <FilePenLine className="w-3 h-3 text-slate-300" title="Manual entry required" />
                )}
                {row.category}
              </span>
              <span className="font-medium text-slate-800 whitespace-nowrap">
                {row.points} / {row.max}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> FMCSA-verified</span>
        <span className="flex items-center gap-1"><FilePenLine className="w-3 h-3 text-slate-300" /> Manual entry</span>
      </div>
    </div>
  );
}
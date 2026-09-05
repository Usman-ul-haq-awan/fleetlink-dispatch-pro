import React from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

const STATUS_COLORS = {
  "Not Approached": "bg-slate-100 text-slate-500",
  "Approached": "bg-emerald-100 text-emerald-700",
  "Lead": "bg-blue-100 text-blue-700",
  "Dead Lead": "bg-red-100 text-red-700",
  "Follow-up": "bg-amber-100 text-amber-700",
  "Voicemail Left": "bg-cyan-100 text-cyan-700",
  "Hangup": "bg-slate-200 text-slate-700",
  "Onboard": "bg-green-100 text-green-700",
};

function getStatuses(c) {
  const s = c.staff_lead_status;
  return Array.isArray(s) ? s : s ? [s] : [];
}

// Renders an agent's allocated carriers grouped by their allocated date
// (newest first), with a date header showing the date and carrier count.
// This lets an admin see which carriers were handed out on which day,
// instead of a flat list that hides the timeline.
export default function CarrierGroupsByDate({ carriers, fmtDate }) {
  // Bucket carriers by the date portion of assigned_date. Carriers with no
  // assigned_date fall under "Undated".
  const buckets = {};
  carriers.forEach(c => {
    const key = c.assigned_date ? c.assigned_date.split("T")[0] : "undated";
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(c);
  });

  // Sort date buckets descending (undated last).
  const sortedKeys = Object.keys(buckets).sort((a, b) => {
    if (a === "undated") return 1;
    if (b === "undated") return -1;
    return b.localeCompare(a);
  });

  if (sortedKeys.length === 0) {
    return <p className="text-sm text-slate-400 px-4 py-3">No carriers allocated.</p>;
  }

  return (
    <div className="space-y-4">
      {sortedKeys.map(key => (
        <div key={key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              {key === "undated" ? "Undated" : fmtDate(key)}
            </span>
            <span className="text-xs text-slate-400">
              · {buckets[key].length} carrier{buckets[key].length !== 1 ? "s" : ""}
            </span>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Carrier</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">USDOT</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">MC</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">State</th>
                <th className="text-center px-4 py-2 font-medium text-slate-600">Emails</th>
                <th className="text-center px-4 py-2 font-medium text-slate-600">Calls</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Lead Status</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Mark as</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buckets[key].map(c => {
                const statuses = getStatuses(c);
                const approached = c._email_count > 0 || c._call_count > 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link to={`/carriers/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                        {c.legal_name || c.dba_name || "Unknown"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{c.usdot_number || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{c.mc_number || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{c.state || "—"}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-medium ${c._email_count > 0 ? "text-green-700" : "text-slate-400"}`}>
                        {c._email_count || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-medium ${c._call_count > 0 ? "text-indigo-700" : "text-slate-400"}`}>
                        {c._call_count || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {approached ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Approached</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Not approached</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {statuses.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {statuses.map(s => (
                            <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[s] || "bg-slate-100 text-slate-600"}`}>{s}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
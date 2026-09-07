import React from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, Mail, PhoneCall, CheckCircle2 } from "lucide-react";
import { extractCallbackDate, formatCallbackDate, isPendingCallback } from "@/lib/callbackDate";

export default function FollowUpLeadsTable({ carriers, loading, icon: Icon = Clock, emptyText = 'No follow-up leads. Mark carriers as "Follow-up" from their detail page to see them here.', emailSentCarrierIds, agentMap, from }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (carriers.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">
          {emptyText}
        </p>
      </div>
    );
  }

  // Derive callback info per carrier and sort pending callbacks to the top
  // so they stand out as a separate, red-highlighted group.
  const rows = carriers.map(carrier => {
    const callbackDate = extractCallbackDate(carrier.staff_comment);
    const pending = isPendingCallback(carrier);
    return { carrier, callbackDate, pending };
  });
  rows.sort((a, b) => (b.pending ? 1 : 0) - (a.pending ? 1 : 0));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Pending callback date
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> Callback done (Approached)
        </span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-auto max-h-[22rem]">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="text-center px-4 py-3 font-medium text-slate-600 w-10">#</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">USDOT</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">MC</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">State</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Agent</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Staff Comment</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Callback Date</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const carrier = row.carrier;
              return (
                <tr key={carrier.id} className={`hover:bg-slate-50 ${row.pending ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/carriers/${carrier.id}${from ? `?from=${from}` : ""}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {carrier.legal_name || carrier.dba_name || "Unknown"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{carrier.usdot_number || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{carrier.mc_number || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{carrier.state || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {(() => {
                      const a = agentMap?.[carrier.assigned_to_user_id];
                      if (!a) return <span className="text-slate-400">—</span>;
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">{a.name}</span>
                          {a.sudo && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-700" title="Sales SUDO">
                              {a.sudo}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{carrier.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {carrier.email ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        emailSentCarrierIds?.has(carrier.id) ? "bg-green-100 text-green-700" : "text-slate-600"
                      }`} title={emailSentCarrierIds?.has(carrier.id) ? "Email sent to this carrier" : ""}>
                        {emailSentCarrierIds?.has(carrier.id) && <Mail className="w-3 h-3" />}
                        {carrier.email}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{carrier.staff_comment || "—"}</td>
                  <td className="px-4 py-3">
                    {row.callbackDate ? (
                      row.pending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-400 shadow-sm" title="Pending callback — mark as Approached once contacted">
                          <PhoneCall className="w-3 h-3" />
                          {formatCallbackDate(row.callbackDate)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300" title="Callback completed">
                          <CheckCircle2 className="w-3 h-3" />
                          {formatCallbackDate(row.callbackDate)}
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/carriers/${carrier.id}${from ? `?from=${from}` : ""}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded inline-flex">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, Mail } from "lucide-react";

export default function FollowUpLeadsTable({ carriers, loading, icon: Icon = Clock, emptyText = 'No follow-up leads. Mark carriers as "Follow-up" from their detail page to see them here.', emailSentCarrierIds }) {
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

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
          <tr>
            <th className="text-center px-4 py-3 font-medium text-slate-600 w-10">#</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">USDOT</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">MC</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">State</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Staff Comment</th>
            <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {carriers.map((carrier, idx) => (
            <tr key={carrier.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400">{idx + 1}</td>
              <td className="px-4 py-3">
                <Link to={`/carriers/${carrier.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                  {carrier.legal_name || carrier.dba_name || "Unknown"}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{carrier.usdot_number || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{carrier.mc_number || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{carrier.state || "—"}</td>
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
              <td className="px-4 py-3 text-center">
                <Link to={`/carriers/${carrier.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded inline-flex">
                  <Eye className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
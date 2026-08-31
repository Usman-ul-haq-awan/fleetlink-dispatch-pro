import React from "react";
import { X, Mail, Printer, CheckCircle, XCircle, Clock, Award, RefreshCw, Send, Phone } from "lucide-react";

// Modal shown when an admin clicks a student's name in the results table.
// Shows the full quiz result + payment details and lets the admin issue
// the certificate (print), verify/reject payment, or email the result.
export default function QuizResultDetailModal({
  result,
  payment,
  onClose,
  onPrint,
  onEmail,
  onVerifyPayment,
  emailing,
  verifying,
}) {
  if (!result) return null;
  const p = payment;

  const dateStr = result.created_date
    ? new Date(result.created_date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${result.passed ? "bg-gradient-to-r from-green-600 to-green-700" : "bg-gradient-to-r from-red-600 to-red-700"}`}>
          <div className="flex items-center gap-2 text-white">
            {result.passed ? <Award className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <h2 className="text-lg font-bold">Quiz Result Details</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Student info */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Student</p>
            <p className="text-lg font-bold text-slate-900">{result.student_name}</p>
            <div className="mt-1 space-y-0.5 text-sm text-slate-600">
              {result.student_email && <p>📧 {result.student_email}</p>}
              {result.whatsapp && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {result.whatsapp}</p>}
            </div>
          </div>

          {/* Quiz info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Module</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">M{result.module_number}: {result.module_title}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Date</p>
              <p className="text-sm text-slate-700 mt-0.5">{dateStr}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Score</p>
              <p className="text-xl font-bold text-blue-800 mt-0.5">{result.score}/{result.total}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Percentage</p>
              <p className={`text-xl font-bold mt-0.5 ${result.passed ? "text-green-700" : "text-red-700"}`}>{result.percentage}%</p>
            </div>
          </div>

          {/* Result badge */}
          <div className="text-center">
            {result.passed ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700">
                <CheckCircle className="w-4 h-4" /> Passed — 70% threshold met
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700">
                <XCircle className="w-4 h-4" /> Failed — needs 70% to pass
              </span>
            )}
          </div>

          {/* Payment section */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Certificate Payment</p>
            {!p ? (
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm text-slate-500">No payment submitted yet</p>
                <p className="text-xs text-slate-400 mt-1">Student must pay and submit a transaction reference to unlock the certificate.</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  {p.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 font-bold text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Paid</span>
                  ) : p.status === "pending_verification" ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700"><Clock className="w-3.5 h-3.5" /> Pending Verification</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-red-700"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
                  )}
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Provider:</span><span className="font-medium capitalize text-slate-800">{p.provider}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="font-medium text-slate-800">{p.currency} {p.amount}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transaction Ref:</span><span className="font-mono text-xs text-slate-800">{p.transaction_ref}</span></div>
                {p.submitted_at && <div className="flex justify-between"><span className="text-slate-500">Submitted:</span><span className="text-xs text-slate-600">{new Date(p.submitted_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span></div>}
                {p.verified_at && <div className="flex justify-between"><span className="text-slate-500">Verified:</span><span className="text-xs text-slate-600">{new Date(p.verified_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span></div>}
                {p.verified_by_name && <div className="flex justify-between"><span className="text-slate-500">Verified By:</span><span className="text-xs text-slate-600">{p.verified_by_name}</span></div>}
                {p.notes && <div className="flex justify-between gap-2"><span className="text-slate-500 flex-shrink-0">Notes:</span><span className="text-xs text-slate-600 text-right">{p.notes}</span></div>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            {/* Certificate issue */}
            <button onClick={() => onPrint(result)} disabled={!result.passed || p?.status !== "paid"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-800 text-white hover:bg-blue-900"
              title={!result.passed ? "Student has not passed" : p?.status !== "paid" ? "Payment not verified" : "Issue / print certificate"}>
              <Printer className="w-4 h-4" /> Issue Certificate
            </button>
            {!result.passed && <p className="text-xs text-center text-slate-400">Certificate unavailable — student did not pass.</p>}
            {result.passed && p?.status !== "paid" && <p className="text-xs text-center text-slate-400">Certificate locked — verify payment to unlock.</p>}

            {/* Payment verification */}
            {p?.status === "pending_verification" && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onVerifyPayment(p.id, "verify")} disabled={verifying === p.id + "verify"}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                  {verifying === p.id + "verify" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Verify Payment
                </button>
                <button onClick={() => onVerifyPayment(p.id, "reject")} disabled={verifying === p.id + "reject"}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {verifying === p.id + "reject" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                </button>
              </div>
            )}

            {/* Email result */}
            <button onClick={() => onEmail(result)} disabled={emailing === result.id || !result.student_email}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50">
              {emailing === result.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Email Result to Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, DollarSign, CheckCircle, Award } from "lucide-react";

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

// Admin panel for recording cash payments received in person.
// Shows all passed quiz results that don't yet have a paid certificate
// payment, with a one-click "Cash Received" button that unlocks the
// student's certificate immediately.
export default function CashPaymentPanel() {
  const [results, setResults] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [marking, setMarking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.QuizResult.list("-created_date", 500);
      const pays = await base44.entities.CertificatePayment.list("-created_date", 500);
      setResults(all);
      setPayments(pays);
    } catch (err) {
      console.error("Cash panel load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const paidByResult = {};
  payments.forEach((p) => {
    if (p.status === "paid") paidByResult[p.quiz_result_id] = p;
  });

  // Only passed results without a paid payment
  const owed = results.filter((r) => r.passed && !paidByResult[r.id]);

  const filtered = owed.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.student_name || "").toLowerCase().includes(q) || (r.student_email || "").toLowerCase().includes(q);
  });

  const markCash = async (r) => {
    if (!confirm(`Confirm cash payment received from ${r.student_name} for Module ${r.module_number}?`)) return;
    setMarking(r.id);
    try {
      const res = await base44.functions.invoke("markCashPayment", { quiz_result_id: r.id });
      if (res.data?.error) throw new Error(res.data.error);
      await load();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.error || err.message));
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        Cash Payment Received
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Record cash payments collected in person. Clicking "Cash Received" instantly unlocks the student's certificate — no verification step needed.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : owed.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500">All passed students have paid certificates. No outstanding cash payments.</p>
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search student name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{r.student_name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    M{r.module_number}: {r.module_title} · {r.percentage}% · {r.student_email || "no email"}
                  </p>
                </div>
                <button onClick={() => markCash(r)} disabled={marking === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 whitespace-nowrap">
                  {marking === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                  Cash Received
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">No students match your search.</p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {owed.length} student{owed.length !== 1 ? "s" : ""} passed but haven't paid for their certificate yet.
          </p>
        </>
      )}
    </div>
  );
}
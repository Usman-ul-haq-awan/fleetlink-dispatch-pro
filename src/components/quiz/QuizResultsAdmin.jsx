import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, Printer, Search, Award, XCircle, RefreshCw, CheckCircle } from "lucide-react";

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function QuizResultsAdmin() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [passFilter, setPassFilter] = useState("");
  const [emailing, setEmailing] = useState(null);
  const [emailStatus, setEmailStatus] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.QuizResult.list("-created_date", 500);
      setResults(all);
    } catch (err) {
      console.error("Quiz results load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = results.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(r.student_name || "").toLowerCase().includes(q) && !(r.student_email || "").toLowerCase().includes(q)) return false;
    }
    if (moduleFilter && r.module_number !== parseInt(moduleFilter)) return false;
    if (passFilter === "pass" && !r.passed) return false;
    if (passFilter === "fail" && r.passed) return false;
    return true;
  });

  const sendEmail = async (r) => {
    setEmailing(r.id);
    try {
      const res = await base44.functions.invoke("sendQuizResult", { quiz_result_id: r.id });
      setEmailStatus((prev) => ({ ...prev, [r.id]: res.data?.email_sent ? "sent" : "failed" }));
      load();
    } catch (err) {
      setEmailStatus((prev) => ({ ...prev, [r.id]: "failed" }));
      alert("Email failed: " + (err.response?.data?.error || err.message));
    } finally {
      setEmailing(null);
    }
  };

  const printCertificate = (r) => {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) { alert("Please allow popups to print the certificate."); return; }
    const dateStr = new Date(r.created_date || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${r.student_name}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;font-family:Georgia,serif;}
    body{padding:40px;background:#f4f6fb;}
    .cert{max-width:700px;margin:0 auto;background:#fff;border:8px double #0a2a6e;padding:50px 40px;text-align:center;}
    .badge{display:inline-block;background:#cc0000;color:#fff;font-size:12px;font-weight:bold;padding:5px 18px;border-radius:20px;letter-spacing:1px;margin-bottom:20px;}
    h1{font-size:30px;color:#0a2a6e;margin-bottom:8px;}
    .sub{font-size:14px;color:#666;margin-bottom:30px;}
    .name{font-size:26px;color:#000;font-weight:bold;border-bottom:2px solid #cc0000;display:inline-block;padding:0 20px 8px;margin:10px 0 20px;}
    .module{font-size:18px;color:#333;margin:8px 0;}
    .score{font-size:16px;color:#16a34a;font-weight:bold;margin:16px 0;}
    .date{font-size:13px;color:#999;margin-top:30px;}
    .brand{font-size:12px;color:#999;margin-top:6px;}
    @media print{body{padding:0;background:#fff;}.cert{border:4px double #0a2a6e;}}
    </style></head><body>
    <div class="cert">
      <div class="badge">CERTIFICATE OF COMPLETION</div>
      <h1>Tycoon Dispatch Academy</h1>
      <div class="sub">This certifies that</div>
      <div class="name">${r.student_name}</div>
      <div class="sub">has successfully completed</div>
      <div class="module"><strong>Module ${r.module_number}: ${r.module_title}</strong></div>
      <div class="score">Score: ${r.percentage}% (${r.score}/${r.total})</div>
      <div class="date">${dateStr}</div>
      <div class="brand">Tycoon Logistics · Dispatching Academy</div>
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    w.document.close();
  };

  const passedCount = results.filter((r) => r.passed).length;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border p-4 bg-blue-50 border-blue-200 text-blue-700">
          <p className="text-2xl font-bold">{results.length}</p>
          <p className="text-xs font-medium opacity-80">Total Attempts</p>
        </div>
        <div className="rounded-lg border p-4 bg-green-50 border-green-200 text-green-700">
          <p className="text-2xl font-bold">{passedCount}</p>
          <p className="text-xs font-medium opacity-80">Passed</p>
        </div>
        <div className="rounded-lg border p-4 bg-violet-50 border-violet-200 text-violet-700">
          <p className="text-2xl font-bold">{avgScore}%</p>
          <p className="text-xs font-medium opacity-80">Average Score</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search student name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputCls} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>
            {Array.from({ length: 23 }, (_, i) => <option key={i + 1} value={i + 1}>Module {i + 1}</option>)}
          </select>
          <select className={inputCls} value={passFilter} onChange={(e) => setPassFilter(e.target.value)}>
            <option value="">All Results</option>
            <option value="pass">Passed Only</option>
            <option value="fail">Failed Only</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No quiz attempts yet. Results will appear here once students complete quizzes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-auto max-h-[560px]">
          <table className="min-w-full w-max text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                {["Student", "Email", "Module", "Score", "Result", "Date", "Email", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.student_name}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.student_email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">M{r.module_number}: {r.module_title}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{r.score}/{r.total} <span className="text-slate-400">({r.percentage}%)</span></td>
                  <td className="px-4 py-3">
                    {r.passed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Passed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{r.created_date ? new Date(r.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                  <td className="px-4 py-3">
                    {r.email_sent ? (
                      <span className="text-xs text-green-600 font-medium">✓ Sent</span>
                    ) : emailStatus[r.id] === "failed" ? (
                      <span className="text-xs text-red-600 font-medium">Failed</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => printCertificate(r)} disabled={!r.passed}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-40" title={r.passed ? "Print certificate" : "Only passed attempts get a certificate"}>
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button onClick={() => sendEmail(r)} disabled={emailing === r.id || !r.student_email}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50" title="Email result to student">
                        {emailing === r.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
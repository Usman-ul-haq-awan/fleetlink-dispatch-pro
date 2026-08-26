import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Send, Loader2, CheckCircle, AlertCircle, Mail, FlaskConical,
  Eye, Truck, Clock, RefreshCw
} from "lucide-react";

export default function EmailTesting() {
  const [user, setUser] = useState(null);
  const [carriers, setCarriers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);

  // Step 1 — pipeline test
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("Test Email from Dispatch CRM");
  const [testBody, setTestBody] = useState("This is a test email to verify the dispatch CRM email pipeline is working. No carrier was contacted.");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Step 2 — personalized preview
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [previewTarget, setPreviewTarget] = useState("");
  const [sendingPreview, setSendingPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);

  // Step 3 — logs
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email) {
        setTestEmail(u.email);
        setPreviewTarget(u.email);
      }
    }).catch(() => {});
    loadCarriers();
    loadLogs();
  }, []);

  const loadCarriers = async () => {
    setLoadingCarriers(true);
    try {
      const all = await base44.entities.Carrier.list("-updated_date", 200);
      setCarriers(all);
    } catch (err) { console.error(err); }
    finally { setLoadingCarriers(false); }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const recent = await base44.entities.EmailLog.list("-sent_at", 20);
      setLogs(recent);
    } catch (err) { console.error(err); }
    finally { setLoadingLogs(false); }
  };

  // Step 1: send a plain test email to verify the pipeline
  const sendPipelineTest = async () => {
    if (!testEmail || !testSubject) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("sendTestEmail", {
        to_email: testEmail,
        subject: testSubject,
        body: testBody,
      });
      setTestResult({ success: true, message: `Sent to ${res.data.to || testEmail}` });
      loadLogs();
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || err.message });
    } finally {
      setSendingTest(false);
    }
  };

  // Step 2: generate a personalized AI email for the selected carrier
  const generatePreview = async () => {
    if (!selectedCarrier) return;
    setGenerating(true);
    setPreview(null);
    setPreviewResult(null);
    try {
      const res = await base44.functions.invoke("generateEmailContent", { carrier_id: selectedCarrier });
      setPreview(res.data);
    } catch (err) {
      setPreview({ error: err.response?.data?.error || err.message });
    } finally {
      setGenerating(false);
    }
  };

  // Step 2: send the personalized email to YOUR test inbox (not the carrier's)
  const sendPreviewToTest = async () => {
    if (!previewTarget || !preview?.subject) return;
    setSendingPreview(true);
    setPreviewResult(null);
    try {
      const res = await base44.functions.invoke("sendTestEmail", {
        to_email: previewTarget,
        subject: preview.subject,
        body: preview.body,
        carrier_id: selectedCarrier,
      });
      setPreviewResult({ success: true, message: `Sent to ${res.data.to || previewTarget}` });
      loadLogs();
    } catch (err) {
      setPreviewResult({ success: false, message: err.response?.data?.error || err.message });
    } finally {
      setSendingPreview(false);
    }
  };

  const selectedCarrierObj = carriers.find(c => c.id === selectedCarrier);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-blue-600" />
          Email Testing Protocol
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Verify email delivery safely before sending to real carriers. No carrier is contacted in steps 1–2.
        </p>
      </div>

      {/* Step 1 — Pipeline Test */}
      <StepCard
        number={1}
        title="Pipeline Test"
        subtitle="Send a plain test email to your own inbox to confirm the email system can deliver."
        icon={Mail}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Send To (your email)</label>
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Subject</label>
            <input type="text" value={testSubject} onChange={e => setTestSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Body</label>
            <textarea value={testBody} onChange={e => setTestBody(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={sendPipelineTest} disabled={sendingTest || !testEmail || !testSubject}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingTest ? "Sending..." : "Send Test Email"}
          </button>
          {testResult && <ResultBanner result={testResult} />}
        </div>
      </StepCard>

      {/* Step 2 — Personalized Preview */}
      <StepCard
        number={2}
        title="Personalized Preview"
        subtitle="Generate an AI-personalized email for any carrier, then send it to your own inbox to review how it looks."
        icon={Eye}
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <select value={selectedCarrier} onChange={e => { setSelectedCarrier(e.target.value); setPreview(null); setPreviewResult(null); }}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{loadingCarriers ? "Loading carriers..." : "Select a carrier..."}</option>
              {carriers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.legal_name || c.dba_name || "Unknown"} (USDOT: {c.usdot_number || "—"})
                </option>
              ))}
            </select>
            <button onClick={generatePreview} disabled={!selectedCarrier || generating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate AI Email"}
            </button>
          </div>

          {selectedCarrierObj && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <span className="font-medium">Carrier email on file:</span>{" "}
              {selectedCarrierObj.email ? (
                <span className="text-slate-800">{selectedCarrierObj.email}</span>
              ) : (
                <span className="text-amber-600">No email scraped yet</span>
              )}
            </div>
          )}

          {preview && !preview.error && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Subject</label>
                <p className="text-sm font-medium text-slate-900">{preview.subject}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Body</label>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{preview.body}</pre>
              </div>
              <div className="flex items-end gap-2 pt-2 border-t border-slate-200">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Send preview to (your inbox)</label>
                  <input type="email" value={previewTarget} onChange={e => setPreviewTarget(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={sendPreviewToTest} disabled={sendingPreview || !previewTarget}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
                  {sendingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingPreview ? "Sending..." : "Send to Test Inbox"}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                This sends to <strong>your</strong> inbox, not the carrier's. Use it to review formatting and tone.
              </p>
              {previewResult && <ResultBanner result={previewResult} />}
            </div>
          )}

          {preview?.error && <ResultBanner result={{ success: false, message: preview.error }} />}
        </div>
      </StepCard>

      {/* Step 3 — Delivery Log */}
      <StepCard
        number={3}
        title="Delivery Log"
        subtitle="Recent email sends with delivery status. Refresh after each test to confirm."
        icon={Clock}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">{logs.length} recent emails</p>
          <button onClick={loadLogs} disabled={loadingLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        {loadingLogs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No emails sent yet. Run step 1 to see delivery here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">To</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Subject</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700 text-xs">{log.to_email || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs truncate max-w-xs">{log.subject || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === "Sent" ? "bg-green-100 text-green-700" :
                        log.status === "Failed" || log.status === "Bounced" ? "bg-red-100 text-red-700" :
                        log.status === "Replied" ? "bg-blue-100 text-blue-700" :
                        log.status === "Opened" ? "bg-purple-100 text-purple-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{log.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StepCard>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-700">
          <strong>Next step:</strong> Once you've confirmed emails arrive in your inbox (check spam folder too),
          you're ready to send to real scraped carrier emails from the Email Campaigns page.
        </p>
      </div>
    </div>
  );
}

function StepCard({ number, title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400" />
            {title}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ResultBanner({ result }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
      result.success ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
    }`}>
      {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {result.message}
    </div>
  );
}
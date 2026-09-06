import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Mail, AlertTriangle, Send, ListPlus, Save, Sparkles } from "lucide-react";

const SCENARIOS = [
  "General Dispatch Introduction",
  "High-Paying Load Opportunity",
  "Complimentary Trial",
  "Backup Dispatcher Offer",
  "Follow-Up",
  "Carrier-Specific Opportunity",
  "Re-Engagement",
  "Custom Staff Instruction",
];

export default function ColdEmailModal({ carrier, onClose, onSent }) {
  const [comment, setComment] = useState(carrier?.staff_comment || "");
  const [scenario, setScenario] = useState("General Dispatch Introduction");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [staffSudo, setStaffSudo] = useState("");
  const [emailRequested, setEmailRequested] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [generating, setGenerating] = useState(false);
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState(null);
  const [queueId, setQueueId] = useState(null);

  useEffect(() => {
    setComment(carrier?.staff_comment || "");
  }, [carrier]);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("generateColdEmail", {
        carrier_id: carrier.id,
        comment,
        scenario,
      });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      setSubject(data.subject || "");
      setBody(data.body || "");
      setStaffSudo(data.staff_sudo || "");
      setEmailRequested(data.email_requested);
      setDuplicateWarning(data.has_recent_outreach ? `This carrier has ${data.recent_outreach_count} previous outreach email(s).` : "");
      if (data.scenario) setScenario(data.scenario);
    } catch (err) {
      setResult({ type: "error", message: err.message || "Generation failed" });
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (action) => {
    setActing(action);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendColdEmail", {
        carrier_id: carrier.id,
        to_email: carrier.email,
        subject,
        email_body: body,
        scenario,
        comment,
        queue_id: queueId,
        action,
      });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      if (data.queue_id) setQueueId(data.queue_id);
      if (data.status === "Sent") {
        setResult({ type: "success", message: "Email sent successfully!", sent_today: data.sent_today, limit: data.limit });
        if (onSent) onSent();
      } else if (data.status === "Queued") {
        setResult({ type: "info", message: "Email added to the cold email queue." });
      } else if (data.status === "Waiting") {
        setResult({ type: "warning", message: data.message || "Daily limit reached — email queued for tomorrow." });
      } else if (data.status === "Failed") {
        setResult({ type: "error", message: data.error || "Send failed" });
      }
    } catch (err) {
      setResult({ type: "error", message: err.message || "Action failed" });
    } finally {
      setActing(false);
    }
  };

  const hasDraft = subject || body;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Cold Email — {carrier?.legal_name || carrier?.dba_name || "Unknown"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {carrier?.email || "No email on file"} · USDOT {carrier?.usdot_number || "—"}
              {staffSudo && <span className="ml-2 text-blue-600 font-medium">SUDO: {staffSudo}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* No email warning */}
          {!carrier?.email && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">This carrier has no email address. Add one in the carrier's Contacts tab before sending.</p>
            </div>
          )}

          {/* Duplicate warning */}
          {duplicateWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-800">{duplicateWarning}</p>
            </div>
          )}

          {/* Email requested indicator */}
          {emailRequested && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Email request detected from comment.</span>
            </div>
          )}

          {/* Scenario dropdown */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email Scenario</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SCENARIOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Comment / instruction */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Staff Instruction / Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='e.g. "send email - backup dispatch offer" or "send email - high paying TX to FL load"'
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Start with "send email -" to explicitly request an email. The scenario is auto-detected from your comment.</p>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Generating personalized email..." : "Generate Email Draft"}
          </button>

          {/* Generated email */}
          {hasDraft && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Subject (editable)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Email Body (editable)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Result message */}
          {result && (
            <div className={`rounded-lg p-3 text-sm ${
              result.type === "success" ? "bg-green-50 text-green-800 border border-green-200" :
              result.type === "warning" ? "bg-amber-50 text-amber-800 border border-amber-200" :
              result.type === "info" ? "bg-blue-50 text-blue-800 border border-blue-200" :
              "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {result.message}
              {result.sent_today !== undefined && (
                <span className="block text-xs mt-1 opacity-75">Sent today: {result.sent_today} / {result.limit}</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          {hasDraft && (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={() => handleAction("draft")}
                disabled={acting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                {acting === "draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button
                onClick={() => handleAction("queue")}
                disabled={acting || !carrier?.email}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                {acting === "queue" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListPlus className="w-4 h-4" />}
                Add to Queue
              </button>
              <button
                onClick={() => handleAction("send")}
                disabled={acting || !carrier?.email}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto"
              >
                {acting === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
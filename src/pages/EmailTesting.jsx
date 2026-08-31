import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Send, Loader2, CheckCircle, AlertCircle, Mail, Zap, Clock,
  RefreshCw, Truck, TrendingUp, Target, Play, Eye, Power, FileText, Save
} from "lucide-react";
import { listAllCarriers } from "@/lib/paginatedList";
import DirectCarrierEmail from "@/components/email/DirectCarrierEmail";

const FUNNEL_OPTIONS = [
  { id: "seq_1", name: "Self-Dispatch Time Reclaim" },
  { id: "seq_2", name: "Fleet Scaling & Capacity" },
  { id: "seq_3", name: "New MC Authority Acceleration" },
  { id: "seq_4", name: "Broker Quality & Risk Mitigation" },
  { id: "seq_5", name: "No Forced Dispatch Freedom" },
  { id: "seq_6", name: "Deadhead & Lane Optimization" },
  { id: "seq_7", name: "Transparent Financial Structure" },
  { id: "seq_8", name: "24/7/365 Back-Office Support" },
  { id: "seq_9", name: "Growth & Equipment Expansion" },
  { id: "seq_10", name: "Premium Consultative Partnership" },
];

export default function EmailTesting() {
  const [stats, setStats] = useState({ total: 0, eligible: 0, assigned: 0, sent: 0, completed: 0, dueToday: 0 });
  const [funnelBreakdown, setFunnelBreakdown] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [filter, setFilter] = useState("all");
  const [engineEnabled, setEngineEnabled] = useState(false);
  const [togglingEngine, setTogglingEngine] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSeq, setPreviewSeq] = useState("seq_1");
  const [previewStep, setPreviewStep] = useState(0);
  const [ccEmail, setCcEmail] = useState("tycoon.tours.business@gmail.com");
  const [ccInput, setCcInput] = useState("tycoon.tours.business@gmail.com");
  const [savingCc, setSavingCc] = useState(false);
  const [previewMode, setPreviewMode] = useState("template"); // "template" | "last_sent"
  const [testTo, setTestTo] = useState("");
  const [testCc, setTestCc] = useState("");
  const [testBcc, setTestBcc] = useState("");
  const [testSubject, setTestSubject] = useState("Dispatch Test — verifying CC & BCC");
  const [testBody, setTestBody] = useState("This is a test email from the FleetLink Email Engine to verify that CC and BCC recipients are receiving messages correctly.");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [health, setHealth] = useState({ sample: 0, sent: 0, bounced: 0, replied: 0, failed: 0, bounceRate: 0, replyRate: 0, failRate: 0, rating: "—", ratingColor: "slate" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listAllCarriers("-updated_date");
      const logs = await base44.entities.EmailLog.list("-sent_at", 30);
      setRecentLogs(logs);

      // Deliverability health — sample the most recent 500 outbound emails
      const sample = await base44.entities.EmailLog.filter({ direction: "Outbound" }, "-sent_at", 500);
      const sentCount = sample.filter((l) => l.status === "Sent").length;
      const bouncedCount = sample.filter((l) => l.status === "Bounced").length;
      const repliedCount = sample.filter((l) => l.status === "Replied").length;
      const failedCount = sample.filter((l) => l.status === "Failed").length;
      const delivered = sentCount + bouncedCount + repliedCount; // excludes queued/failed
      const bounceRate = delivered > 0 ? (bouncedCount / delivered) * 100 : 0;
      const replyRate = sentCount > 0 ? (repliedCount / sentCount) * 100 : 0;
      const failRate = sample.length > 0 ? (failedCount / sample.length) * 100 : 0;
      // Simple inbox-health rating based on bounce rate (the strongest spam signal)
      let rating = "Excellent";
      let ratingColor = "green";
      if (bounceRate >= 10) { rating = "Poor — high bounce risk"; ratingColor = "red"; }
      else if (bounceRate >= 5) { rating = "Caution — clean your list"; ratingColor = "amber"; }
      else if (bounceRate >= 2) { rating = "Good"; ratingColor = "blue"; }
      setHealth({
        sample: sample.length,
        sent: sentCount,
        bounced: bouncedCount,
        replied: repliedCount,
        failed: failedCount,
        bounceRate: Math.round(bounceRate * 10) / 10,
        replyRate: Math.round(replyRate * 10) / 10,
        failRate: Math.round(failRate * 10) / 10,
        rating,
        ratingColor,
      });

      const hasEmail = all.filter((c) => c.email && !c.do_not_contact);
      const terminal = ["Active Client", "Do Not Contact", "Onboarding", "Human Handoff", "Interested"];
      const eligible = hasEmail.filter((c) => !terminal.includes(c.lead_status));
      const assigned = eligible.filter((c) => c.email_funnel);
      const completed = eligible.filter((c) => c.email_sequence_complete);
      const inProgress = assigned.filter((c) => !c.email_sequence_complete);
      const now = new Date();
      const dueToday = eligible.filter(
        (c) => !c.email_funnel || !c.email_next_send_at || new Date(c.email_next_send_at) <= now
      );

      setStats({
        total: all.length,
        eligible: eligible.length,
        assigned: assigned.length,
        sent: logs.filter((l) => l.status === "Sent").length,
        completed: completed.length,
        dueToday: dueToday.length,
      });

      // Funnel breakdown
      const funnelMap = {};
      assigned.forEach((c) => {
        const f = c.email_funnel || "unassigned";
        funnelMap[f] = (funnelMap[f] || 0) + 1;
      });
      const funnelNames = {
        seq_1: "Self-Dispatch Time Reclaim",
        seq_2: "Fleet Scaling & Capacity",
        seq_3: "New MC Authority Acceleration",
        seq_4: "Broker Quality & Risk Mitigation",
        seq_5: "No Forced Dispatch Freedom",
        seq_6: "Deadhead & Lane Optimization",
        seq_7: "Transparent Financial Structure",
        seq_8: "24/7/365 Back-Office Support",
        seq_9: "Growth & Equipment Expansion",
        seq_10: "Premium Consultative Partnership",
      };
      setFunnelBreakdown(
        Object.entries(funnelMap).map(([id, count]) => ({ id, name: funnelNames[id] || id, count }))
      );

      // Carrier email status
      let filtered = eligible;
      if (filter === "unassigned") filtered = eligible.filter((c) => !c.email_funnel);
      else if (filter === "in_progress") filtered = inProgress;
      else if (filter === "completed") filtered = completed;
      setCarriers(filtered.slice(0, 100));
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Load engine enabled state
  useEffect(() => {
    base44.entities.AppSetting.filter({ setting_key: "email_engine_enabled" })
      .then((rows) => setEngineEnabled(rows.length === 0 || rows[0].setting_value !== "false"))
      .catch(() => setEngineEnabled(true));
  }, []);

  // Load CC email setting
  useEffect(() => {
    base44.entities.AppSetting.filter({ setting_key: "email_cc_address" })
      .then((rows) => {
        if (rows.length > 0 && rows[0].setting_value) {
          setCcEmail(rows[0].setting_value);
          setCcInput(rows[0].setting_value);
        }
      })
      .catch(() => {});
  }, []);

  const saveCcEmail = async () => {
    setSavingCc(true);
    try {
      const rows = await base44.entities.AppSetting.filter({ setting_key: "email_cc_address" });
      if (rows.length > 0) {
        await base44.entities.AppSetting.update(rows[0].id, { setting_value: ccInput });
      } else {
        await base44.entities.AppSetting.create({
          setting_key: "email_cc_address",
          setting_value: ccInput,
          setting_category: "email",
          setting_type: "string",
          description: "CC email for all outbound emails",
        });
      }
      setCcEmail(ccInput);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSavingCc(false);
    }
  };

  const toggleEngine = async () => {
    setTogglingEngine(true);
    try {
      const rows = await base44.entities.AppSetting.filter({ setting_key: "email_engine_enabled" });
      const newValue = !(rows.length === 0 || rows[0].setting_value !== "false");
      if (rows.length > 0) {
        await base44.entities.AppSetting.update(rows[0].id, { setting_value: String(newValue) });
      } else {
        await base44.entities.AppSetting.create({
          setting_key: "email_engine_enabled",
          setting_value: String(newValue),
          setting_category: "email",
          setting_type: "boolean",
          description: "Email Engine running state",
        });
      }
      setEngineEnabled(newValue);
    } catch (err) {
      alert("Toggle failed: " + err.message);
    } finally {
      setTogglingEngine(false);
    }
  };

  // Load email format preview
  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewMode("template");
    try {
      const res = await base44.functions.invoke("previewEmailFormat", {
        sequence_id: previewSeq,
        step: previewStep,
      });
      setPreviewHtml(res.data.html || "");
    } catch (err) {
      setPreviewHtml(`<p style="color:red;padding:20px;">Preview failed: ${err.message}</p>`);
    } finally {
      setPreviewLoading(false);
    }
  }, [previewSeq, previewStep]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const sendTestEmail = async () => {
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("sendTestEmail", {
        to_email: testTo,
        subject: testSubject,
        body: testBody,
        cc: testCc ? testCc.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        bcc: testBcc ? testBcc.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      });
      setTestResult({ success: true, message: res.data?.message || "Test email sent" });
    } catch (err) {
      setTestResult({ error: err.response?.data?.error || err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await base44.functions.invoke("runEmailBatch", {});
      setRunResult(res.data);
      if (res.data?.last_sent_html) {
        setPreviewHtml(res.data.last_sent_html);
        setPreviewMode("last_sent");
      }
      load();
    } catch (err) {
      setRunResult({ error: err.response?.data?.error || err.message });
    } finally {
      setRunning(false);
    }
  };

  const statCards = [
    { label: "Total Carriers", value: stats.total, icon: Truck, color: "blue" },
    { label: "Eligible for Email", value: stats.eligible, icon: Mail, color: "indigo" },
    { label: "Due Today", value: stats.dueToday, icon: Clock, color: "amber" },
    { label: "Funnel Assigned", value: stats.assigned, icon: Target, color: "violet" },
    { label: "Sequences Complete", value: stats.completed, icon: CheckCircle, color: "green" },
    { label: "Recent Sends (30)", value: stats.sent, icon: TrendingUp, color: "teal" },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-violet-600" />
            Email Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Server-side automated outreach — runs daily at 9 AM even when your laptop is off
          </p>
          <div className="flex items-center gap-2 mt-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">CC every email to:</label>
            <input type="email" value={ccInput} onChange={e => setCcInput(e.target.value)}
              className="flex-1 max-w-xs px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cc@example.com" />
            <button onClick={saveCcEmail} disabled={savingCc || ccInput === ccEmail}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {savingCc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {ccInput === ccEmail ? "Saved" : "Save"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleEngine} disabled={togglingEngine}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
              engineEnabled ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
            }`}>
            {togglingEngine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {engineEnabled ? "Stop Engine" : "Start Engine"}
          </button>
          <button onClick={runNow} disabled={running || !engineEnabled}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Running..." : "Run Now"}
          </button>
        </div>
      </div>

      {/* Send Test Email — verify CC/BCC delivery */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Send className="w-5 h-5 text-green-600" />
          Send Test Email
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Send a test email to any address to verify CC and BCC recipients receive messages. Great for showing associates the email pipeline works.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">To *</label>
            <input type="email" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="associate@example.com"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500">CC (comma-separated)</label>
            <input type="text" value={testCc} onChange={e => setTestCc(e.target.value)} placeholder={ccEmail || "cc@example.com"}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500">BCC (comma-separated)</label>
            <input type="text" value={testBcc} onChange={e => setTestBcc(e.target.value)} placeholder="bcc@example.com"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Subject</label>
            <input type="text" value={testSubject} onChange={e => setTestSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Body</label>
            <textarea value={testBody} onChange={e => setTestBody(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={sendTestEmail} disabled={sendingTest || !testTo || !testSubject}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingTest ? "Sending..." : "Send Test Email"}
          </button>
          {testResult?.success && (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" /> {testResult.message}
            </span>
          )}
          {testResult?.error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {testResult.error}
            </span>
          )}
        </div>
      </div>

      {/* Direct Carrier Email */}
      <DirectCarrierEmail ccEmail={ccEmail} />

      {/* Engine status banner */}
      <div className={`rounded-lg border p-3 mb-4 flex items-center gap-2 ${
        engineEnabled ? "bg-green-50 border-green-200" : "bg-slate-100 border-slate-300"
      }`}>
        <span className={`w-2.5 h-2.5 rounded-full ${engineEnabled ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
        <p className="text-sm font-medium text-slate-700">
          {engineEnabled ? "Engine is running — daily emails will send automatically at 9 AM." : "Engine is stopped — no emails will send until you click Start."}
        </p>
      </div>

      {/* Run result banner */}
      {runResult && !runResult.error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-800">
              Engine run complete — {runResult.sent || 0} sent, {runResult.failed || 0} failed
            </p>
            <p className="text-green-700 text-xs mt-1">
              {runResult.eligible || 0} eligible carriers · {runResult.assigned_count || 0} newly assigned to funnels
              {runResult.message && runResult.sent === 0 ? ` · ${runResult.message}` : ""}
            </p>
            {runResult.assigned && runResult.assigned.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto">
                {runResult.assigned.slice(0, 8).map((a, i) => (
                  <p key={i} className="text-xs text-green-600">• {a}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {runResult?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{runResult.error}</p>
        </div>
      )}

      {/* Deliverability Health */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Deliverability Health
          </h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            health.ratingColor === "green" ? "bg-green-100 text-green-700" :
            health.ratingColor === "blue" ? "bg-blue-100 text-blue-700" :
            health.ratingColor === "amber" ? "bg-amber-100 text-amber-700" :
            health.ratingColor === "red" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
          }`}>
            {health.rating}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Based on the last {health.sample} outbound emails. Bounce rate is the strongest inbox-vs-spam signal — keep it under 5%.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 bg-green-50 border-green-200">
            <p className="text-2xl font-bold text-green-700">{health.sent}</p>
            <p className="text-xs font-medium text-green-700/80">Sent</p>
          </div>
          <div className="rounded-lg border p-3 bg-red-50 border-red-200">
            <p className="text-2xl font-bold text-red-700">{health.bounced} <span className="text-sm font-normal">({health.bounceRate}%)</span></p>
            <p className="text-xs font-medium text-red-700/80">Bounced</p>
          </div>
          <div className="rounded-lg border p-3 bg-blue-50 border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{health.replied} <span className="text-sm font-normal">({health.replyRate}%)</span></p>
            <p className="text-xs font-medium text-blue-700/80">Replied</p>
          </div>
          <div className="rounded-lg border p-3 bg-amber-50 border-amber-200">
            <p className="text-2xl font-bold text-amber-700">{health.failed} <span className="text-sm font-normal">({health.failRate}%)</span></p>
            <p className="text-xs font-medium text-amber-700/80">Failed</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {health.bounceRate >= 5
            ? "⚠️ Bounce rate is high — pause the engine and remove invalid/role addresses from your carrier list to protect your sender reputation."
            : health.sample === 0
              ? "No emails sent yet. Send a test or run the engine to start measuring deliverability."
              : "✅ Bounce rate is within a healthy range — your domain authentication is working and inbox placement should be strong."}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-lg border p-4 ${colorClasses[card.color]}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-70" />
                <span className="text-2xl font-bold">{card.value}</span>
              </div>
              <p className="text-xs font-medium opacity-80">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            Funnel Assignments
          </h2>
          {funnelBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No carriers assigned yet. Run the engine to auto-assign funnels based on carrier data.
            </p>
          ) : (
            <div className="space-y-2">
              {funnelBreakdown.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{f.id}</p>
                  </div>
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold">
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sends */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Recent Emails
            </h2>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No emails sent yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    log.status === "Sent" ? "bg-green-500" :
                    log.status === "Failed" ? "bg-red-500" :
                    log.status === "Replied" ? "bg-blue-500" : "bg-slate-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 truncate">{log.to_email}</p>
                    <p className="text-xs text-slate-500 truncate">{log.subject || "—"}</p>
                    <p className="text-xs text-slate-400">{log.sent_at ? new Date(log.sent_at).toLocaleString() : ""}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    log.status === "Sent" ? "bg-green-100 text-green-700" :
                    log.status === "Failed" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrier email status table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Carrier Email Status</h2>
          <div className="flex items-center gap-2">
            {["all", "unassigned", "in_progress", "completed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  filter === f ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        ) : carriers.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No carriers matching this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Company</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Funnel</th>
                  <th className="text-center px-4 py-2 font-medium text-slate-600">Step</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Next Send</th>
                  <th className="text-center px-4 py-2 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carriers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900 truncate max-w-xs">
                      {c.legal_name || c.dba_name || "Unknown"}
                    </td>
                    <td className="px-4 py-2 text-slate-600 text-xs truncate max-w-xs">{c.email}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">
                      {c.email_funnel ? (
                        <span className="font-mono">{c.email_funnel}</span>
                      ) : (
                        <span className="text-amber-600">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center text-slate-600">
                      {c.email_sequence_step || 0}/5
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs">
                      {c.email_next_send_at ? new Date(c.email_next_send_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {c.email_sequence_complete ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Complete</span>
                      ) : c.email_funnel ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">In Progress</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Queued</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email format preview */}
      <div className="mt-6 bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-3">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Email Format Preview
            {previewMode === "last_sent" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Last Sent Email</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <select value={previewSeq} onChange={e => { setPreviewSeq(e.target.value); setPreviewMode("template"); }}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {FUNNEL_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select value={previewStep} onChange={e => { setPreviewStep(parseInt(e.target.value)); setPreviewMode("template"); }}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={0}>Step 1 — Initial</option>
              <option value={1}>Step 2 — Follow-up</option>
              <option value={2}>Step 3 — Follow-up</option>
              <option value={3}>Step 4 — Follow-up</option>
              <option value={4}>Step 5 — Breakup</option>
            </select>
            <button onClick={loadPreview} disabled={previewLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50">
              {previewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Show Template
            </button>
          </div>
        </div>
        <div className="p-2 bg-slate-50">
          {previewLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              title="Email Preview"
              className="w-full bg-white rounded border border-slate-200"
              style={{ height: "500px" }}
            />
          )}
        </div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          {previewMode === "last_sent"
            ? "This is the exact email that was just sent to a carrier. All emails CC " + ccEmail + "."
            : "This is the exact HTML format sent to carriers — with Tycoon Logistics logo, personalized body, and company footer. All emails CC " + ccEmail + "."}
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 bg-violet-50 border border-violet-200 rounded-lg p-4">
        <p className="text-xs text-violet-700">
          <strong>How it works:</strong> The engine runs daily at 9 AM (server-side, no laptop needed).
          It reads each carrier's data (fleet size, safety rating, equipment type), auto-assigns the best
          of 10 email funnels, and sends personalized emails with your Tycoon Logistics logo and company details.
          Each sequence runs 5 emails over 19 days (Day 0, 3, 7, 12, 19). Click "Run Engine Now" to test immediately.
        </p>
      </div>
    </div>
  );
}
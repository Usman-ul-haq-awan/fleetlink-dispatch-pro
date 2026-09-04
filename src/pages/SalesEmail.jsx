import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CheckCircle, AlertCircle, Search, Truck, Mail, User } from "lucide-react";
import TemplatePicker from "@/components/email/TemplatePicker";
import { useEntity } from "@/lib/entityContext";
import VisitorEmptyState from "@/components/VisitorEmptyState";

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500";

// Substitute template placeholders with the selected carrier's data.
function fillPlaceholders(text, carrier) {
  if (!carrier) return text;
  const company = carrier.legal_name || carrier.dba_name || "[Company Name]";
  const firstName = (carrier.contact_name || carrier.owner_name || company).split(" ")[0];
  return text
    .replace(/\[First Name\]/g, firstName)
    .replace(/\[Company Name\]/g, company)
    .replace(/\[MC Number\]/g, carrier.mc_number || "[MC Number]")
    .replace(/\[Equipment Type\]/g, carrier.equipment_types || carrier.lead_equipment_type || "[Equipment Type]")
    .replace(/\[Preferred Lanes\]/g, "[Preferred Lanes]")
    .replace(/\[Fleet Size\]/g, String(carrier.power_units || "[Fleet Size]"));
}

export default function SalesEmail() {
  const [mcSearch, setMcSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toEmail, setToEmail] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [sender, setSender] = useState({ from_email: "", from_name: "", enabled: true, cc: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const debounceRef = useRef(null);
  const { isVisitor } = useEntity();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    // Load staff email configuration: toggle/CC from staff_sales, sender from staff_smtp.
    Promise.all([
      base44.entities.AppSetting.filter({ setting_category: "staff_sales" }),
      base44.entities.AppSetting.filter({ setting_category: "staff_smtp" }),
    ])
      .then(([salesRows, smtpRows]) => {
        const sMap = {};
        salesRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
        const mMap = {};
        smtpRows.forEach(r => { mMap[r.setting_key] = r.setting_value; });
        setSender({
          from_email: mMap.staff_smtp_from_email || "",
          from_name: mMap.staff_smtp_from_name || "Sales Team",
          enabled: sMap.staff_sales_enabled !== "false",
          cc: sMap.staff_sales_cc || "",
        });
      })
      .catch(() => {});
  }, []);

  const loadRecent = async () => {
    if (!currentUser) return;
    setLoadingRecent(true);
    try {
      const logs = await base44.entities.EmailLog.filter(
        { direction: "Outbound", created_by_id: currentUser.id },
        "-sent_at",
        10
      );
      setRecent(logs);
    } catch (err) {
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => { if (!isVisitor && currentUser) loadRecent(); }, [isVisitor, currentUser]);

  const searchByMc = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await base44.entities.Carrier.filter(
          { mc_number: { $regex: query.trim(), $options: "i" } },
          "-updated_date",
          10
        );
        setResults(found);
        setShowResults(true);
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const selectCarrier = (c) => {
    setSelected(c);
    setToEmail(c.email || "");
    setMcSearch(c.mc_number || "");
    setShowResults(false);
    // Re-fill any existing template with the new carrier's data.
    if (subject) setSubject(prev => fillPlaceholders(prev, c));
    if (body) setBody(prev => fillPlaceholders(prev, c));
  };

  const applyTemplate = (tpl) => {
    const c = selected;
    setSubject(fillPlaceholders(tpl.subject, c));
    setBody(fillPlaceholders(tpl.body, c));
  };

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendStaffSalesEmail", {
        to_email: toEmail,
        subject,
        body,
        carrier_id: selected?.id || "",
        branded: true,
        cc: ccInput ? ccInput.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        bcc: bccInput ? bccInput.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      });
      setResult({ success: true, message: res.data?.message || "Sales email sent" });
      loadRecent();
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  if (isVisitor) return <VisitorEmptyState title="Sales Email" message="Sales email is hidden for visitors." />;

  const disabled = !sender.enabled || !sender.from_email;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-violet-600" />
          Sales Email Engine
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Send sales emails to carriers from{" "}
          <strong className="text-slate-700">{sender.from_email || "sales@tycoonlogistics.online"}</strong>
          {sender.from_name ? ` (${sender.from_name})` : ""} — all admin templates available.
        </p>
      </div>

      {disabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800">
            {sender.enabled === false
              ? "Staff sales email is currently disabled by the admin."
              : "Staff SMTP sender is not configured yet. Ask an admin to set it in Settings → Staff SMTP Email Server."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: template library */}
        <div className="lg:col-span-1">
          <TemplatePicker onSelect={applyTemplate} />
        </div>

        {/* Right: composer */}
        <div className="lg:col-span-2 space-y-4">
          {/* MC Search */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-violet-600" />
              Find Carrier
            </h2>
            <div className="relative">
              <label className="text-xs text-slate-500 mb-1 block">Search by MC Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={mcSearch}
                  onChange={e => { setMcSearch(e.target.value); searchByMc(e.target.value); }}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="e.g. MC-123456 or 123456"
                  className={`${inputCls} pl-9`}
                />
                {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 animate-spin" />}
              </div>
              {showResults && results.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {results.map(c => (
                    <button
                      key={c.id}
                      onMouseDown={() => selectCarrier(c)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center gap-2"
                    >
                      <Truck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.legal_name || c.dba_name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">
                          MC: {c.mc_number || "—"} · {c.email ? c.email : <span className="text-amber-600">No email</span>}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div className="mt-3 flex items-center gap-2 p-2.5 bg-violet-50 border border-violet-200 rounded-lg">
                <Truck className="w-4 h-4 text-violet-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{selected.legal_name || selected.dba_name || "Unknown"}</p>
                  <p className="text-xs text-slate-500">MC: {selected.mc_number || "—"} · USDOT: {selected.usdot_number || "—"}</p>
                </div>
                <button onClick={() => { setSelected(null); setToEmail(""); setMcSearch(""); }} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-600" />
              Compose & Send
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">To (carrier email)</label>
                  <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="carrier@example.com" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">CC (comma-separated)</label>
                  <input type="text" value={ccInput} onChange={e => setCcInput(e.target.value)} placeholder={sender.cc || "cc@example.com"} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">BCC (comma-separated)</label>
                  <input type="text" value={bccInput} onChange={e => setBccInput(e.target.value)} placeholder="bcc@example.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Pick a template or write your own subject" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Body (editable — placeholders auto-filled from carrier)</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={12} placeholder="Pick a template from the library, or write your own message..." className={`${inputCls} resize-y font-mono text-xs`} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={send}
                disabled={sending || disabled || !toEmail || !subject}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : "Send Sales Email"}
              </button>
              {result?.success && (
                <span className="flex items-center gap-1.5 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" /> {result.message}
                </span>
              )}
              {result?.error && (
                <span className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" /> {result.error}
                </span>
              )}
            </div>
          </div>

          {/* Recent sends */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-600" />
              Your Recent Sends
            </h2>
            {loadingRecent ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No emails sent yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recent.map(log => (
                  <div key={log.id} className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.status === "Sent" ? "bg-green-500" : log.status === "Failed" ? "bg-red-500" : "bg-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{log.to_email}</p>
                      <p className="text-xs text-slate-500 truncate">{log.subject || "—"}</p>
                      <p className="text-xs text-slate-400">{log.sent_at ? new Date(log.sent_at).toLocaleString() : ""}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${log.status === "Sent" ? "bg-green-100 text-green-700" : log.status === "Failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>{log.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
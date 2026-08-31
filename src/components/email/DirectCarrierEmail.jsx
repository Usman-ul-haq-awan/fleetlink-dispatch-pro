import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CheckCircle, AlertCircle, Search, Truck, Mail } from "lucide-react";

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

const DEFAULT_SUBJECT = "Dispatch Services for {{carrier_name}} — Let's Talk";
const DEFAULT_BODY = `Hi {{carrier_name}},

I hope this message finds you well. I came across your company and wanted to reach out regarding our dispatch services.

We help carriers like yours maximize load opportunities, reduce deadhead miles, and handle the back-office load so you can focus on driving. Here's what we offer:

• 24/7/365 back-office support
• No forced dispatch — you choose your loads
• Transparent financial structure
• Access to premium freight and better rates

I'd love to learn more about your current operations and see if there's a fit. Are you available for a quick call this week?

Best regards,
Tycoon Logistics Team`;

export default function DirectCarrierEmail({ ccEmail }) {
  const [mcSearch, setMcSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toEmail, setToEmail] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const debounceRef = useRef(null);

  const searchByMc = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
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
    setSubject(DEFAULT_SUBJECT.replace("{{carrier_name}}", c.legal_name || c.dba_name || "Carrier"));
    setBody(DEFAULT_BODY.replace(/{{carrier_name}}/g, c.legal_name || c.dba_name || "Carrier"));
    setMcSearch(c.mc_number || "");
    setShowResults(false);
  };

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendTestEmail", {
        to_email: toEmail,
        subject,
        body,
        branded: true,
        cc: ccInput ? ccInput.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        bcc: bccInput ? bccInput.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      });
      setResult({ success: true, message: res.data?.message || "Email sent to carrier" });
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <Mail className="w-5 h-5 text-indigo-600" />
        Direct Carrier Email
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Search a carrier by MC number, auto-fill their email, edit the template below, and send a direct email.
      </p>

      {/* MC Search */}
      <div className="relative mb-4">
        <label className="text-xs text-slate-500 mb-1 block">Search by MC Number</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={mcSearch}
            onChange={(e) => { setMcSearch(e.target.value); searchByMc(e.target.value); }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="e.g. MC-123456 or 123456"
            className={`${inputCls} pl-9`}
          />
          {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 animate-spin" />}
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((c) => (
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

      {/* Selected carrier badge */}
      {selected && (
        <div className="mb-4 flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
          <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{selected.legal_name || selected.dba_name || "Unknown"}</p>
            <p className="text-xs text-slate-500">MC: {selected.mc_number || "—"} · USDOT: {selected.usdot_number || "—"}</p>
          </div>
          <button onClick={() => { setSelected(null); setToEmail(""); setMcSearch(""); }} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
        </div>
      )}

      {/* Email fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">To (carrier email)</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="carrier@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">CC (comma-separated)</label>
            <input
              type="text"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              placeholder={ccEmail || "cc@example.com"}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">BCC (comma-separated)</label>
            <input
              type="text"
              value={bccInput}
              onChange={(e) => setBccInput(e.target.value)}
              placeholder="bcc@example.com"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Body (editable template)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className={`${inputCls} resize-y font-mono text-xs`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={send}
          disabled={sending || !toEmail || !subject}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending..." : "Send Direct Email"}
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
  );
}
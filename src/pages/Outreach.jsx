import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Mail, CheckCircle, Download, Loader2, Search, Eye, Inbox, Send
} from "lucide-react";
import { listAllCarriers } from "@/lib/paginatedList";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

export default function Outreach() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "sent" ? "sent" : "ready";

  const setTab = (t) => setSearchParams({ tab: t });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Outreach</h1>
        <p className="text-slate-500 text-sm mt-1">Carriers ready for email outreach and sent email history</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 border-b border-slate-200">
        <button onClick={() => setTab("ready")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "ready" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}>
          <Inbox className="w-4 h-4" /> Ready for Outreach
        </button>
        <button onClick={() => setTab("sent")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "sent" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}>
          <Send className="w-4 h-4" /> Sent Emails
        </button>
      </div>

      {tab === "ready" ? <ReadyForOutreach /> : <SentEmails />}
    </div>
  );
}

/* ---------- Ready for Outreach tab ---------- */
function ReadyForOutreach() {
  const [carriers, setCarriers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listAllCarriers("-updated_date");
      const ready = all.filter(
        (c) => c.lead_status === "Ready for Outreach" && c.email && !c.do_not_contact
      );
      setCarriers(ready);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search) { setFiltered(carriers); return; }
    const q = search.toLowerCase();
    setFiltered(carriers.filter(c =>
      (c.legal_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.usdot_number || "").includes(q) ||
      (c.mc_number || "").includes(q)
    ));
  }, [carriers, search]);

  const exportCsv = () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      const headers = ["Legal Name", "DBA", "Email", "Phone", "USDOT", "MC", "State", "City", "Equipment", "Power Units", "Drivers", "Lead Score", "Safety Qualification"];
      const rows = filtered.map(c => [
        c.legal_name || "", c.dba_name || "", c.email || "", c.phone || "",
        c.usdot_number || "", c.mc_number || "", c.state || "", c.city || "",
        c.equipment_types || "", c.power_units ?? "", c.drivers ?? "",
        c.lead_score ?? "", c.safety_qualification || ""
      ]);
      const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ready_for_outreach_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search name, email, USDOT, MC..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-72 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <span className="text-sm text-slate-500">{filtered.length} carriers</span>
        </div>
        <button onClick={exportCsv} disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download Email List
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No carriers ready for outreach yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-auto max-h-[560px]">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">USDOT</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">MC</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">State</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Equipment</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Safety</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.legal_name || "Unknown"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.usdot_number || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.mc_number || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.state || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.equipment_types || "—"}</td>
                  <td className="px-4 py-3 text-center text-slate-700 font-semibold">{c.lead_score || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.safety_qualification || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Sent Emails tab ---------- */
function SentEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await base44.entities.EmailLog.filter({ status: "Sent" }, "-sent_at", 500);
      setEmails(logs);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? emails.filter(e =>
        (e.to_email || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.subject || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.carrier_id || "").toLowerCase().includes(search.toLowerCase())
      )
    : emails;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search recipient, subject..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-72 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} sent emails</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No sent emails yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-auto max-h-[560px]">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Recipient</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Sent At</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Follow-up</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => setSelected(e)}>
                  <td className="px-4 py-3 text-slate-900 font-medium text-xs">{e.to_email}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-md">{e.subject || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {e.sent_at ? new Date(e.sent_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.is_follow_up ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">#{e.follow_up_number || 1}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Initial</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Eye className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email content viewer */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{selected?.subject || "Sent Email"}</DialogTitle>
            <DialogDescription className="text-xs">
              To: {selected?.to_email} · Sent: {selected?.sent_at ? new Date(selected.sent_at).toLocaleString() : "—"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden border border-slate-200 rounded-md bg-slate-50">
            {selected?.body ? (
              <iframe srcDoc={selected.body} title="Email Content"
                className="w-full h-full bg-white" style={{ minHeight: "420px", height: "100%" }} />
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No HTML body stored for this email.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
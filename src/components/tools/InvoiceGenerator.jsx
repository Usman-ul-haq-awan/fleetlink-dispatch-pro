import React, { useState } from "react";
import { FileText, Printer, RotateCcw, Loader2 } from "lucide-react";

const PAY_METHODS = ["Bank Transfer (ACH)", "Wire Transfer", "Check", "Zelle", "PayPal"];

const fieldCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mt-5 mb-3 pb-1 border-b border-slate-200 first:mt-0">
      {children}
    </h3>
  );
}

export default function InvoiceGenerator() {
  const today = new Date();
  const due = new Date();
  due.setDate(due.getDate() + 7);
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");

  const [form, setForm] = useState({
    dispName: "", dispEmail: "", dispPhone: "", dispAddress: "",
    carrierName: "", carrierMc: "", carrierEmail: "", carrierPhone: "",
    invNumber: `INV-${y}${m}-001`, invDate: today.toISOString().split("T")[0], invDue: due.toISOString().split("T")[0],
    loadRef: "", broker: "", origin: "", destination: "", miles: "", loadRate: "",
    commPct: "", payMethod: PAY_METHODS[0], notes: "",
  });
  const [generated, setGenerated] = useState(false);
  const [printing, setPrinting] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const rate = parseFloat(form.loadRate) || 0;
  const pct = parseFloat(form.commPct) || 0;
  const amt = parseFloat((rate * (pct / 100)).toFixed(2));

  const fmt = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const generate = () => {
    setGenerated(true);
    setTimeout(() => document.getElementById("invoice-preview")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const reset = () => {
    setGenerated(false);
    document.getElementById("invoice-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const buildInvoiceHtml = () => {
    const route = `${form.origin || "—"} → ${form.destination || "—"}`;
    const milesStr = form.miles ? `${form.miles} mi` : "—";
    const dispContact = [form.dispEmail, form.dispPhone, form.dispAddress].filter(Boolean).join("<br>");
    const carrierLines = [form.carrierName && `<strong>${form.carrierName}</strong>`, form.carrierMc && `MC: ${form.carrierMc}`, form.carrierEmail, form.carrierPhone].filter(Boolean).join("<br>");
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${form.invNumber || ""}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}
body{background:#fff;padding:20px;}
#invoice-doc{max-width:800px;margin:0 auto;padding:40px;}
.inv-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;flex-wrap:wrap;gap:20px;}
.inv-brand h2{font-size:26px;font-weight:900;color:#0a2a6e;margin-bottom:2px;}
.inv-brand p{font-size:13px;color:#888;}
.inv-badge{background:#cc0000;color:#fff;font-size:22px;font-weight:900;padding:10px 28px;border-radius:8px;letter-spacing:2px;}
.inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;}
.inv-meta-box{background:#f4f6fb;border-radius:10px;padding:16px 20px;}
.inv-meta-box h4{font-size:11px;font-weight:900;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}
.inv-meta-box p{font-size:13px;color:#333;line-height:1.8;}
.inv-meta-box p strong{color:#0a2a6e;}
.inv-table{width:100%;border-collapse:collapse;margin-bottom:22px;}
.inv-table th{background:#0a2a6e;color:#fff;font-size:12px;font-weight:900;padding:10px 14px;text-align:left;}
.inv-table td{padding:11px 14px;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0;}
.inv-totals{margin-left:auto;width:280px;margin-bottom:22px;}
.inv-totals-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;}
.inv-totals-row:last-child{border:none;font-weight:900;font-size:15px;color:#0a2a6e;padding-top:12px;}
.inv-totals-row span:last-child{color:#cc0000;font-weight:900;}
.inv-notes{background:#f4f6fb;border-radius:8px;padding:14px 18px;margin-bottom:22px;}
.inv-notes p{font-size:13px;color:#555;line-height:1.7;}
.inv-notes strong{color:#0a2a6e;}
.inv-footer{text-align:center;padding-top:16px;border-top:2px solid #f0f0f0;}
.inv-footer p{font-size:12px;color:#aaa;}
.inv-footer strong{color:#0a2a6e;}
@media print{body{padding:0;}}
</style></head><body>
<div id="invoice-doc">
<div class="inv-top"><div class="inv-brand"><h2>${form.dispName || "Your Dispatch Company"}</h2><p>${dispContact}</p></div><div class="inv-badge">INVOICE</div></div>
<div class="inv-meta">
<div class="inv-meta-box"><h4>Bill To (Carrier)</h4><p>${carrierLines}</p></div>
<div class="inv-meta-box"><h4>Invoice Details</h4><p><strong>Invoice #:</strong> ${form.invNumber || "—"}<br><strong>Date:</strong> ${form.invDate || "—"}<br><strong>Due:</strong> ${form.invDue || "—"}<br><strong>Payment:</strong> ${form.payMethod}</p></div>
</div>
<table class="inv-table"><thead><tr><th>Description</th><th>Load Ref</th><th>Route</th><th>Miles</th><th>Load Rate</th><th>Commission</th><th>Amount Due</th></tr></thead>
<tbody><tr><td>Dispatch Services — Load ${form.loadRef || "—"}<br><small style="color:#888">Broker: ${form.broker || "—"}</small></td><td>${form.loadRef || "—"}</td><td>${route}</td><td>${milesStr}</td><td>${fmt(rate)}</td><td>${pct}%</td><td style="font-weight:900;color:#0a2a6e;">${fmt(amt)}</td></tr></tbody></table>
<div class="inv-totals"><div class="inv-totals-row"><span>Gross Load Rate</span><span>${fmt(rate)}</span></div><div class="inv-totals-row"><span>Commission Rate</span><span>${pct}%</span></div><div class="inv-totals-row"><span>Total Due</span><span>${fmt(amt)}</span></div></div>
${form.notes ? `<div class="inv-notes"><p><strong>Notes:</strong> ${form.notes}</p></div>` : ""}
<div class="inv-footer"><p>Generated by <strong>Tycoon Dispatch Academy Dispatch Invoice Generator</strong></p></div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
  };

  const printInvoice = () => {
    setPrinting(true);
    try {
      const w = window.open("", "_blank", "width=900,height=700");
      if (!w) {
        alert("Please allow pop-ups to print the invoice.");
        setPrinting(false);
        return;
      }
      w.document.write(buildInvoiceHtml());
      w.document.close();
    } finally {
      setTimeout(() => setPrinting(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      <div id="invoice-form" className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-blue-800 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center gap-3">
          <FileText className="w-7 h-7 text-white" />
          <div>
            <h2 className="text-lg font-bold text-white">Invoice Generator</h2>
            <p className="text-xs text-blue-100">Fill all fields then click Generate Invoice</p>
          </div>
        </div>
        <div className="p-6">
          <SectionTitle>🏢 Your Dispatch Company Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Company / Your Name</label><input className={fieldCls} value={form.dispName} onChange={set("dispName")} placeholder="e.g. Tycoon Dispatch LLC" /></div>
            <div><label className={labelCls}>Your Email</label><input className={fieldCls} value={form.dispEmail} onChange={set("dispEmail")} placeholder="dispatch@example.com" /></div>
            <div><label className={labelCls}>Your Phone</label><input className={fieldCls} value={form.dispPhone} onChange={set("dispPhone")} placeholder="+92 311 4111899" /></div>
            <div><label className={labelCls}>Your Address / City</label><input className={fieldCls} value={form.dispAddress} onChange={set("dispAddress")} placeholder="Lahore, Pakistan" /></div>
          </div>

          <SectionTitle>🚛 Carrier Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Carrier Company Name</label><input className={fieldCls} value={form.carrierName} onChange={set("carrierName")} placeholder="Swift Freight Inc" /></div>
            <div><label className={labelCls}>Carrier MC Number</label><input className={fieldCls} value={form.carrierMc} onChange={set("carrierMc")} placeholder="MC-123456" /></div>
            <div><label className={labelCls}>Carrier Email</label><input className={fieldCls} value={form.carrierEmail} onChange={set("carrierEmail")} placeholder="carrier@example.com" /></div>
            <div><label className={labelCls}>Carrier Phone</label><input className={fieldCls} value={form.carrierPhone} onChange={set("carrierPhone")} placeholder="+1 555 000 0000" /></div>
          </div>

          <SectionTitle>📦 Load Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className={labelCls}>Invoice Number</label><input className={fieldCls} value={form.invNumber} onChange={set("invNumber")} /></div>
            <div><label className={labelCls}>Invoice Date</label><input type="date" className={fieldCls} value={form.invDate} onChange={set("invDate")} /></div>
            <div><label className={labelCls}>Due Date</label><input type="date" className={fieldCls} value={form.invDue} onChange={set("invDue")} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div><label className={labelCls}>Load / Reference Number</label><input className={fieldCls} value={form.loadRef} onChange={set("loadRef")} placeholder="LOAD-20240615" /></div>
            <div><label className={labelCls}>Broker Name</label><input className={fieldCls} value={form.broker} onChange={set("broker")} placeholder="Echo Global Logistics" /></div>
            <div><label className={labelCls}>Origin (Pickup City)</label><input className={fieldCls} value={form.origin} onChange={set("origin")} placeholder="Dallas, TX" /></div>
            <div><label className={labelCls}>Destination (Delivery City)</label><input className={fieldCls} value={form.destination} onChange={set("destination")} placeholder="Chicago, IL" /></div>
            <div><label className={labelCls}>Total Miles</label><input type="number" min="0" className={fieldCls} value={form.miles} onChange={set("miles")} placeholder="920" /></div>
            <div><label className={labelCls}>Gross Load Rate ($)</label><input type="number" min="0" className={fieldCls} value={form.loadRate} onChange={set("loadRate")} placeholder="3200" /></div>
          </div>

          <SectionTitle>💰 Commission Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className={labelCls}>Dispatch Commission (%)</label><input type="number" min="0" max="15" step="0.5" className={fieldCls} value={form.commPct} onChange={set("commPct")} placeholder="7" /></div>
            <div><label className={labelCls}>Commission Amount ($)</label><input readOnly className={`${fieldCls} bg-slate-100 text-blue-800 font-bold`} value={amt > 0 ? fmt(amt) : ""} placeholder="Auto-calculated" /></div>
            <div><label className={labelCls}>Payment Method</label><select className={fieldCls} value={form.payMethod} onChange={set("payMethod")}>{PAY_METHODS.map((p) => <option key={p}>{p}</option>)}</select></div>
          </div>

          <SectionTitle>📝 Notes (Optional)</SectionTitle>
          <div><label className={labelCls}>Additional Notes / Payment Instructions</label><textarea className={fieldCls} rows={3} value={form.notes} onChange={set("notes")} placeholder="Please process payment within 7 days of delivery. Bank details: Account Name: ... | Routing: ... | Account: ..." /></div>

          <button onClick={generate} className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg text-base transition-colors flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" /> Generate Invoice
          </button>
        </div>
      </div>

      {generated && (
        <div id="invoice-preview" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-slate-200">
            <p className="text-sm font-bold text-blue-800">✅ Invoice Ready — Print or Save as PDF</p>
            <div className="flex gap-2">
              <button onClick={printInvoice} disabled={printing} className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-5 py-2 rounded-full disabled:opacity-50">
                {printing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />} Print / Save as PDF
              </button>
              <button onClick={reset} className="flex items-center gap-1.5 bg-white text-red-600 border-2 border-red-600 text-xs font-bold px-5 py-2 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Edit Details
              </button>
            </div>
          </div>
          <div className="p-8">
            <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-blue-800">{form.dispName || "Your Dispatch Company"}</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{[form.dispEmail, form.dispPhone, form.dispAddress].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="bg-red-600 text-white text-xl font-bold px-7 py-2.5 rounded-lg tracking-widest">INVOICE</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">Bill To (Carrier)</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {form.carrierName && <span className="font-bold text-blue-800 block">{form.carrierName}</span>}
                  {form.carrierMc && <span>MC: {form.carrierMc}<br /></span>}
                  {form.carrierEmail && <span>{form.carrierEmail}<br /></span>}
                  {form.carrierPhone}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">Invoice Details</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-blue-800">Invoice #:</span> {form.invNumber || "—"}<br />
                  <span className="font-bold text-blue-800">Date:</span> {form.invDate || "—"}<br />
                  <span className="font-bold text-blue-800">Due:</span> {form.invDue || "—"}<br />
                  <span className="font-bold text-blue-800">Payment:</span> {form.payMethod}
                </p>
              </div>
            </div>
            <table className="w-full border-collapse mb-5">
              <thead>
                <tr>
                  {["Description", "Load Ref", "Route", "Miles", "Load Rate", "Commission", "Amount Due"].map((h) => (
                    <th key={h} className="bg-blue-800 text-white text-xs font-bold px-3.5 py-2.5 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3.5 py-3 text-xs text-slate-600 border-b border-slate-100">Dispatch Services — Load {form.loadRef || "—"}<br /><span className="text-slate-400">Broker: {form.broker || "—"}</span></td>
                  <td className="px-3.5 py-3 text-xs text-slate-600 border-b border-slate-100">{form.loadRef || "—"}</td>
                  <td className="px-3.5 py-3 text-xs text-slate-600 border-b border-slate-100">{form.origin || "—"} → {form.destination || "—"}</td>
                  <td className="px-3.5 py-3 text-xs text-slate-600 border-b border-slate-100">{form.miles ? `${form.miles} mi` : "—"}</td>
                  <td className="px-3.5 py-3 text-xs text-slate-600 border-b border-slate-100">{fmt(rate)}</td>
                  <td className="px-3.5 py-3 text-xs text-slate-600 border-b border-slate-100">{pct}%</td>
                  <td className="px-3.5 py-3 text-xs font-bold text-blue-800 border-b border-slate-100">{fmt(amt)}</td>
                </tr>
              </tbody>
            </table>
            <div className="ml-auto w-72 mb-5">
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs"><span>Gross Load Rate</span><span className="font-bold text-red-600">{fmt(rate)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs"><span>Commission Rate</span><span className="font-bold text-red-600">{pct}%</span></div>
              <div className="flex justify-between pt-3 text-sm font-bold text-blue-800"><span>Total Due</span><span className="text-red-600">{fmt(amt)}</span></div>
            </div>
            {form.notes && (
              <div className="bg-slate-50 rounded-lg p-3.5 mb-5">
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-blue-800">Notes:</span> {form.notes}</p>
              </div>
            )}
            <div className="text-center pt-4 border-t-2 border-slate-100">
              <p className="text-xs text-slate-400">Generated by <span className="font-bold text-blue-800">Tycoon Dispatch Academy Dispatch Invoice Generator</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
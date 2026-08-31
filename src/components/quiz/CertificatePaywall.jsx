import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, CheckCircle, Clock, Printer, Send, AlertCircle } from "lucide-react";

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

// Shown after a student passes a module quiz. Until they pay the certificate
// fee via JazzCash or Easypaisa and an admin verifies the payment, the
// downloadable certificate stays locked.
export default function CertificatePaywall({ quizResultId, module, title, studentName }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("jazzcash");
  const [txnRef, setTxnRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({});

  const load = async () => {
    try {
      const pays = await base44.entities.CertificatePayment.filter({ quiz_result_id: quizResultId });
      // Prefer a "paid" record if one exists, otherwise the most recent
      let best = null;
      pays.forEach((p) => {
        if (!best || p.status === "paid") best = p;
      });
      setPayment(best);
      const all = await base44.entities.AppSetting.list("-setting_key", 200);
      const map = {};
      all.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    } catch (err) {
      console.error("Payment load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizResultId) load();
  }, [quizResultId]);

  const submitPayment = async () => {
    if (!txnRef.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("createCertificatePayment", {
        quiz_result_id: quizResultId,
        provider,
        transaction_ref: txnRef.trim(),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setTxnRef("");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const printCertificate = () => {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) { alert("Please allow popups to print the certificate."); return; }
    const dateStr = new Date(payment?.verified_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const companyName = settings.company_name || "Tycoon Dispatch Academy";
    const companyLogo = settings.company_logo_url || "";
    const companyTagline = settings.company_website || "Dispatching Academy";
    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="logo" style="max-height:60px;max-width:180px;object-fit:contain;margin-bottom:14px;" />`
      : "";
    w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${studentName}</title>
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
    .paid{font-size:11px;color:#16a34a;font-weight:bold;margin-top:12px;}
    @media print{body{padding:0;background:#fff;}.cert{border:4px double #0a2a6e;}}
    </style></head><body>
    <div class="cert">
      ${logoHtml}
      <div class="badge">CERTIFICATE OF COMPLETION</div>
      <h1>${companyName}</h1>
      <div class="sub">This certifies that</div>
      <div class="name">${studentName}</div>
      <div class="sub">has successfully completed</div>
      <div class="module"><strong>Module ${module}: ${title}</strong></div>
      <div class="date">${dateStr}</div>
      <div class="brand">${companyName} · ${companyTagline}</div>
      <div class="paid">✓ Payment Verified</div>
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    w.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  // PAID → certificate unlocked
  if (payment?.status === "paid") {
    return (
      <div>
        <div className="border-2 border-green-500 rounded-lg p-5 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold text-green-700">Payment Verified — Certificate Unlocked</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1 text-center">Certificate of Completion</p>
          <p className="text-lg font-bold text-blue-800 text-center">{studentName}</p>
          <p className="text-xs text-slate-600 mt-1 text-center">has successfully completed</p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5 text-center">Module {module}: {title}</p>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Issued: {new Date(payment.verified_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-[10px] text-slate-400 mt-3 text-center">{settings.company_name || "Tycoon Dispatch Academy"} · {settings.company_website || "Dispatching Academy"}</p>
        </div>
        <button onClick={printCertificate}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-full transition-colors">
          <Printer className="w-4 h-4" /> Download / Print Certificate
        </button>
      </div>
    );
  }

  // PENDING VERIFICATION
  if (payment?.status === "pending_verification") {
    return (
      <div className="border-2 border-amber-300 rounded-lg p-5 bg-amber-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">Payment Submitted — Awaiting Verification</span>
        </div>
        <p className="text-xs text-amber-700 text-center">
          Your payment via <strong className="capitalize">{payment.provider}</strong> (Ref: {payment.transaction_ref}) is being verified by our admin.
          Your certificate will unlock here once verified — usually within a few hours.
        </p>
      </div>
    );
  }

  // NO PAYMENT or REJECTED → show paywall
  const fee = settings.certificate_fee || "5";
  const currency = settings.certificate_fee_currency || "USD";
  const jazzNumber = settings.jazzcash_account_number || "";
  const jazzTitle = settings.jazzcash_account_title || "";
  const easypaisaNumber = settings.easypaisa_account_number || "";
  const easypaisaTitle = settings.easypaisa_account_title || "";

  return (
    <div className="border-2 border-blue-800 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-blue-800" />
        <span className="text-sm font-bold text-blue-800">Unlock Your Certificate — {currency} {fee}</span>
      </div>
      <p className="text-xs text-slate-600 text-center mb-4">
        You passed Module {module}! Pay {currency} {fee} via JazzCash or Easypaisa to unlock your downloadable certificate.
      </p>

      {payment?.status === "rejected" && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Your previous payment was rejected. {payment.notes ? `Reason: ${payment.notes}. ` : ""}Please submit a new payment.</span>
        </div>
      )}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => setProvider("jazzcash")}
          className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${provider === "jazzcash" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
          <span className="block text-lg mb-1">📱</span>JazzCash
        </button>
        <button onClick={() => setProvider("easypaisa")}
          className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${provider === "easypaisa" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
          <span className="block text-lg mb-1">💚</span>Easypaisa
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs">
        <p className="font-bold text-slate-700 mb-2">📋 Send {currency} {fee} to:</p>
        {provider === "jazzcash" ? (
          <div className="space-y-1">
            <p className="text-slate-600">JazzCash Number: <strong className="text-slate-900">{jazzNumber || "Not configured yet"}</strong></p>
            <p className="text-slate-600">Account Title: <strong className="text-slate-900">{jazzTitle || "Not configured yet"}</strong></p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-slate-600">Easypaisa Number: <strong className="text-slate-900">{easypaisaNumber || "Not configured yet"}</strong></p>
            <p className="text-slate-600">Account Title: <strong className="text-slate-900">{easypaisaTitle || "Not configured yet"}</strong></p>
          </div>
        )}
        <p className="text-slate-500 mt-2">After sending, enter your transaction reference below.</p>
      </div>

      <div className="mb-3">
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Transaction Reference / TID</label>
        <input className={inputCls} value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="e.g. JC123456789 or EP987654321" />
      </div>

      <button onClick={submitPayment} disabled={submitting || !txnRef.trim()}
        className="w-full bg-blue-800 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Payment for Verification</>}
      </button>
      <p className="text-center text-[10px] text-slate-400 mt-2">Your certificate unlocks after admin verifies your payment.</p>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Phone, Upload, KeyRound, AlertCircle, LogOut, IdCard, Clock, ShieldCheck } from "lucide-react";

const SESSION_KEY = "fleetlink_session_authenticated";

export default function SecurityGate({ children }) {
  const [screen, setScreen] = useState("loading"); // loading, not_registered, pending, profile, code, app
  const [phone, setPhone] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("staffAuthGate", { action: "status" });
      const s = res.data;
      // Admins bypass all gates.
      if (s.role === "admin") {
        sessionStorage.setItem(SESSION_KEY, "true");
        setScreen("app");
        return;
      }
      if (!s.has_staff_record) { setScreen("not_registered"); return; }
      if (!s.approved) { setScreen("pending"); return; }
      if (!s.has_phone || !s.has_id) { setScreen("profile"); return; }
      setScreen("code");
    } catch (err) {
      setError(err.message || "Failed to check auth status");
      setScreen("error");
    }
  }, []);

  useEffect(() => {
    // Already passed the gate this browser session — go straight to the app.
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setScreen("app");
      return;
    }
    fetchStatus();
  }, [fetchStatus]);

  const handleProfileSubmit = async () => {
    setError("");
    if (!phone.trim()) { setError("Phone number is required"); return; }
    if (!idFile) { setError("ID document is required"); return; }
    setSubmitting(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: idFile });
      await base44.functions.invoke("staffAuthGate", {
        action: "update_profile",
        phone: phone.trim(),
        identity_document_url: uploadRes.file_url,
        identity_document_name: idFile.name,
      });
      setPhone("");
      setIdFile(null);
      await fetchStatus(); // re-check → should advance to code screen
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async () => {
    setError("");
    if (code.length !== 4) { setError("Enter the 4-digit code"); return; }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("staffAuthGate", { action: "verify_code", code });
      if (res.data.valid) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setScreen("app");
      } else {
        setError("Invalid code. Contact your administrator for the correct code.");
        setCode("");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    base44.auth.logout(window.location.origin + "/login");
  };

  if (screen === "app") return children;
  if (screen === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        {screen === "not_registered" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Not Registered</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              You don't have a staff record in this system. Contact your administrator to be added.
            </p>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        )}

        {screen === "pending" && (
          <>
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Pending Admin Approval</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Your account is awaiting administrator approval. You'll be able to log in once an admin approves you and shares your login code.
            </p>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        )}

        {screen === "profile" && (
          <>
            <IdCard className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Complete Your Profile</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              A phone number and ID document are required before you can access the app.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">ID Document *</label>
                <label className="flex items-center gap-2 px-3 py-2.5 text-sm border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 truncate">{idFile ? idFile.name : "Click to upload ID (PDF, image)"}</span>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={handleProfileSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Submit & Continue
              </button>
            </div>
          </>
        )}

        {screen === "code" && (
          <>
            <KeyRound className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Enter Login Code</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Enter the 4-digit code provided by your administrator to complete login.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter" && code.length === 4) handleCodeSubmit(); }}
                placeholder="• • • •"
                autoFocus
                className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <button onClick={handleCodeSubmit} disabled={submitting || code.length !== 4}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Verify & Enter App
              </button>
              <button onClick={handleLogout} className="w-full text-xs text-slate-400 hover:text-slate-600">Logout</button>
            </div>
          </>
        )}

        {screen === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 text-center mb-6">{error}</p>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
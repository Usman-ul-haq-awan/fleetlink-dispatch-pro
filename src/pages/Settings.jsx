import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, Phone, UserCog, Loader2, Mail } from "lucide-react";
import StaffManagement from "@/components/StaffManagement";
import CompanyLogoSection from "@/components/CompanyLogoSection";
import CashPaymentPanel from "@/components/CashPaymentPanel";

const SETTING_GROUPS = [
  {
    category: "company",
    label: "Company Information",
    settings: [
      { key: "company_name", label: "Company Name", type: "string" },
      { key: "company_email", label: "Company Email", type: "string" },
      { key: "company_phone", label: "Company Phone", type: "string" },
      { key: "company_address", label: "Company Address", type: "string" },
      { key: "company_website", label: "Company Website", type: "string" },
      { key: "corporate_caller_id", label: "Corporate Caller ID (for voice calls)", type: "string" },
      { key: "dispatch_service_description", label: "Dispatch Service Description", type: "text" },
      { key: "email_signature", label: "Email Signature", type: "text" },
    ],
  },
  {
    category: "smtp",
    label: "SMTP Email Server (Outgoing)",
    icon: "mail",
    settings: [
      { key: "smtp_host", label: "SMTP Host", type: "string" },
      { key: "smtp_port", label: "SMTP Port", type: "number" },
      { key: "smtp_encryption", label: "Encryption", type: "select", options: [
        { value: "SSL", label: "SSL/TLS (port 465)" },
        { value: "STARTTLS", label: "STARTTLS (port 587)" },
        { value: "None", label: "None" },
      ]},
      { key: "smtp_username", label: "SMTP Username", type: "string" },
      { key: "smtp_password", label: "SMTP Password", type: "password" },
      { key: "smtp_from_email", label: "From Email Address", type: "string" },
      { key: "smtp_from_name", label: "From Name", type: "string" },
    ],
  },
  {
    category: "email",
    label: "Email Campaign Settings",
    settings: [
      { key: "email_daily_limit", label: "Daily Email Send Limit", type: "number" },
      { key: "email_follow_up_delay", label: "Follow-up Delay (days)", type: "number" },
      { key: "email_max_follow_ups", label: "Max Follow-ups", type: "number" },
    ],
  },
  {
    category: "lead_score",
    label: "Lead Score Thresholds",
    settings: [
      { key: "lead_score_ready_threshold", label: "Ready for Outreach (min score)", type: "number" },
      { key: "lead_score_qualified_threshold", label: "Qualified (min score)", type: "number" },
    ],
  },
  {
    category: "safety",
    label: "Safety Qualification Thresholds",
    settings: [
      { key: "safety_oos_rate_threshold", label: "OOS Rate Threshold (%)", type: "number" },
      { key: "safety_data_completeness_min", label: "Min Data Completeness (%)", type: "number" },
    ],
  },
  {
    category: "batch",
    label: "Batch Processing",
    settings: [
      { key: "batch_size", label: "Batch Size (carriers per batch)", type: "number" },
      { key: "automation_paused", label: "Automation Paused", type: "boolean" },
    ],
  },
  {
    category: "calling",
    label: "AI Calling Settings",
    settings: [
      { key: "call_script", label: "Call Script", type: "text" },
      { key: "voice_provider", label: "Voice Provider (not yet connected)", type: "string" },
    ],
  },
  {
    category: "payment",
    label: "Certificate Payment Gateway (JazzCash / Easypaisa)",
    settings: [
      { key: "certificate_fee", label: "Certificate Fee (amount)", type: "string" },
      { key: "certificate_fee_currency", label: "Certificate Fee Currency", type: "string" },
      { key: "jazzcash_account_number", label: "JazzCash Account Number (mobile)", type: "string" },
      { key: "jazzcash_account_title", label: "JazzCash Account Title (name)", type: "string" },
      { key: "easypaisa_account_number", label: "Easypaisa Account Number (mobile)", type: "string" },
      { key: "easypaisa_account_title", label: "Easypaisa Account Title (name)", type: "string" },
      { key: "jazzcash_merchant_id", label: "JazzCash Merchant ID (for API — later)", type: "string" },
      { key: "jazzcash_secure_hash", label: "JazzCash Secure Hash (for API — later)", type: "password" },
      { key: "easypaisa_merchant_id", label: "Easypaisa Merchant ID (for API — later)", type: "string" },
      { key: "easypaisa_api_key", label: "Easypaisa API Key (for API — later)", type: "password" },
    ],
  },
  {
    category: "staff_sales",
    label: "Staff Sales Email (staff-only toggle)",
    settings: [
      { key: "staff_sales_enabled", label: "Enable Staff Sales Email", type: "boolean" },
      { key: "staff_sales_cc", label: "Default CC (comma-separated, optional)", type: "string" },
    ],
  },
  {
    category: "staff_smtp",
    label: "Staff SMTP Email Server (Manual — staff only)",
    icon: "mail",
    settings: [
      { key: "staff_smtp_host", label: "SMTP Host", type: "string" },
      { key: "staff_smtp_port", label: "SMTP Port", type: "number" },
      { key: "staff_smtp_encryption", label: "Encryption", type: "select", options: [
        { value: "SSL", label: "SSL/TLS (port 465)" },
        { value: "STARTTLS", label: "STARTTLS (port 587)" },
        { value: "None", label: "None" },
      ]},
      { key: "staff_smtp_username", label: "SMTP Username", type: "string" },
      { key: "staff_smtp_password", label: "SMTP Password", type: "password" },
      { key: "staff_smtp_from_email", label: "From Email Address", type: "string" },
      { key: "staff_smtp_from_name", label: "From Name", type: "string" },
    ],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [outreachEnabled, setOutreachEnabled] = useState(false);
  const [togglingOutreach, setTogglingOutreach] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    base44.auth.me()
      .then(u => { setCurrentUser(u); setUserLoading(false); })
      .catch(() => setUserLoading(false));
  }, []);

  const loadSettings = async () => {
    try {
      const all = await base44.entities.AppSetting.list("-setting_key", 100);
      const map = {};
      all.forEach(s => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
      const outreach = all.find(s => s.setting_key === "outreach_enabled");
      setOutreachEnabled(outreach ? outreach.setting_value === "true" : false);
    } catch (err) {
      console.error("Settings load error:", err);
    }
  };

  const toggleOutreach = async () => {
    setTogglingOutreach(true);
    try {
      const newValue = !outreachEnabled;
      const all = await base44.entities.AppSetting.list("-setting_key", 100);
      const existing = all.find(s => s.setting_key === "outreach_enabled");
      if (existing) {
        await base44.entities.AppSetting.update(existing.id, { setting_value: String(newValue) });
      } else {
        await base44.entities.AppSetting.create({
          setting_key: "outreach_enabled",
          setting_value: String(newValue),
          setting_category: "feature",
          setting_type: "boolean",
          description: "Enable Email Campaigns and Calling Queue",
        });
      }
      setOutreachEnabled(newValue);
    } catch (err) {
      alert("Toggle failed: " + err.message);
    } finally {
      setTogglingOutreach(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const all = await base44.entities.AppSetting.list("-setting_key", 100);
      const existingMap = {};
      all.forEach(s => { existingMap[s.setting_key] = s; });

      // Build the full list of create/update operations, then run them in
      // small sequential batches. Firing ~40 concurrent entity writes at once
      // overwhelms the origin and Cloudflare returns a parse error (empty/
      // malformed response), so we throttle to 5 at a time.
      const ops = [];
      for (const group of SETTING_GROUPS) {
        for (const setting of group.settings) {
          const value = settings[setting.key] || "";
          if (existingMap[setting.key]) {
            ops.push(base44.entities.AppSetting.update(existingMap[setting.key].id, { setting_value: value }));
          } else {
            ops.push(base44.entities.AppSetting.create({
              setting_key: setting.key,
              setting_value: value,
              setting_category: group.category,
              setting_type: setting.type,
              description: setting.label,
            }));
          }
        }
      }
      const BATCH = 5;
      for (let i = 0; i < ops.length; i += BATCH) {
        await Promise.all(ops.slice(i, i + BATCH));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting) => {
    const value = settings[setting.key] || "";
    if (setting.type === "text") {
      return <textarea value={value} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
        rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />;
    }
    if (setting.type === "boolean") {
      return <select value={value || "false"} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>;
    }
    if (setting.type === "number") {
      return <input type="number" value={value} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
        className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />;
    }
    if (setting.type === "password") {
      return <input type="password" value={value} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />;
    }
    if (setting.type === "select") {
      return <select value={value} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select...</option>
        {setting.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>;
    }
    return <input type="text" value={value} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />;
  };

  // Settings panel is admin-only. Staff members are shown an access-denied view.
  if (userLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }
  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure your dispatch CRM</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          <Save className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Outreach Features (Email & Calling)</h2>
            <p className="text-sm text-slate-500 mt-1">
              {outreachEnabled
                ? "Email Campaigns and Calling Queue are enabled in the sidebar."
                : "Currently held. Focus on scraping carrier data first — flip this on when you're ready to reach out."}
            </p>
          </div>
          <button
            onClick={toggleOutreach}
            disabled={togglingOutreach}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${outreachEnabled ? "bg-blue-600" : "bg-slate-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${outreachEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <CompanyLogoSection />

      <CashPaymentPanel />

      <StaffManagement />

      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <UserCog className="w-5 h-5 text-slate-600" />
          Project Administrators
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold shrink-0">UH</div>
            <div>
              <p className="font-medium text-slate-900">Usman UL Haq</p>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                03114111899
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {SETTING_GROUPS.map(group => (
        <div key={group.category} className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            {group.icon === "mail" && <Mail className="w-5 h-5 text-blue-600" />}
            {group.label}
          </h2>
          <div className="space-y-4">
            {group.settings.map(setting => (
              <div key={setting.key}>
                <label className="text-sm text-slate-600 block mb-1">{setting.label}</label>
                {renderInput(setting)}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-amber-800 text-sm mb-1">Email Sending</h3>
        <p className="text-xs text-amber-700">
          Configure your company SMTP server above to send outgoing emails to carriers. When SMTP is configured,
          all emails (test and campaign) route through your SMTP server via the browser worker. If left blank,
          the built-in email service is used, which only reaches registered app users without a connected custom domain.
        </p>
        <p className="text-xs text-amber-700 mt-2">
          <strong>Note:</strong> After adding the SMTP fields, redeploy the browser worker
          (<code className="bg-amber-100 px-1 rounded">npm install</code> then restart) so it picks up the new
          <code className="bg-amber-100 px-1 rounded mx-1">nodemailer</code> dependency and the /send-email endpoint.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 text-sm mb-1">AI Voice Calling</h3>
        <p className="text-xs text-blue-700">
          The calling queue and data model are ready. Actual outbound calling requires connecting a voice provider
          integration (e.g., Retell AI, Vapi, Twilio). The system will use your corporate business number as caller ID
          (subject to provider verification). The AI will identify itself as an AI assistant and will not misrepresent
          itself as a human.
        </p>
      </div>
    </div>
  );
}
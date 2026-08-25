import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save } from "lucide-react";

const SETTING_GROUPS = [
  {
    category: "company",
    label: "Company Information",
    settings: [
      { key: "company_name", label: "Company Name", type: "string" },
      { key: "company_email", label: "Company Email", type: "string" },
      { key: "company_phone", label: "Company Phone", type: "string" },
      { key: "corporate_caller_id", label: "Corporate Caller ID (for voice calls)", type: "string" },
      { key: "dispatch_service_description", label: "Dispatch Service Description", type: "text" },
      { key: "email_signature", label: "Email Signature", type: "text" },
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
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const all = await base44.entities.AppSetting.list("-setting_key", 100);
      const map = {};
      all.forEach(s => { map[s.setting_key] = s.setting_value; });
      setSettings(map);
    } catch (err) {
      console.error("Settings load error:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const all = await base44.entities.AppSetting.list("-setting_key", 100);
      const existingMap = {};
      all.forEach(s => { existingMap[s.setting_key] = s; });

      const updates = [];
      for (const group of SETTING_GROUPS) {
        for (const setting of group.settings) {
          const value = settings[setting.key] || "";
          if (existingMap[setting.key]) {
            updates.push(base44.entities.AppSetting.update(existingMap[setting.key].id, { setting_value: value }));
          } else {
            updates.push(base44.entities.AppSetting.create({
              setting_key: setting.key,
              setting_value: value,
              setting_category: group.category,
              setting_type: setting.type,
              description: setting.label,
            }));
          }
        }
      }
      await Promise.all(updates);
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
    return <input type="text" value={value} onChange={e => setSettings({...settings, [setting.key]: e.target.value})}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />;
  };

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

      {SETTING_GROUPS.map(group => (
        <div key={group.category} className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">{group.label}</h2>
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
          Emails are sent using the platform's built-in email service. To reach external carrier email addresses,
          a paid plan with a custom domain may be required. Alternatively, connect an external email API provider
          (Resend, SendGrid, Postmark) via the Settings → Environment Variables in your dashboard.
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
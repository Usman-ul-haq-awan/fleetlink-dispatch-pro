import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';

const SETTING_GROUPS = [
  {
    category: 'company',
    label: 'Company Information',
    settings: [
      { key: 'company_name', label: 'Company Name', type: 'string', desc: 'Your dispatch company name' },
      { key: 'company_email', label: 'Company Email', type: 'string', desc: 'General contact email' },
      { key: 'company_phone', label: 'Company Phone', type: 'string', desc: 'General contact phone' },
      { key: 'corporate_caller_id', label: 'Corporate Caller ID', type: 'string', desc: 'Phone number for AI calling (requires voice provider verification)' },
      { key: 'dispatch_service_description', label: 'Dispatch Service Description', type: 'text', desc: 'Used in email personalization' },
      { key: 'email_signature', label: 'Email Signature', type: 'text', desc: 'Appended to outbound emails' },
    ],
  },
  {
    category: 'email',
    label: 'Email Campaign Settings',
    settings: [
      { key: 'email_daily_limit', label: 'Daily Send Limit', type: 'number', desc: 'Max emails per day' },
      { key: 'email_follow_up_delay', label: 'Follow-up Delay (days)', type: 'number', desc: 'Days before sending follow-up' },
      { key: 'email_max_follow_ups', label: 'Max Follow-ups', type: 'number', desc: 'Maximum follow-up emails per carrier' },
    ],
  },
  {
    category: 'calling',
    label: 'Calling Settings',
    settings: [
      { key: 'call_script', label: 'AI Call Script', type: 'text', desc: 'Script for AI voice calls (requires voice provider integration)' },
      { key: 'call_voice', label: 'AI Voice', type: 'string', desc: 'Voice type for AI calls (e.g. female)' },
    ],
  },
  {
    category: 'lead_score',
    label: 'Lead Score Thresholds',
    settings: [
      { key: 'lead_score_qualified', label: 'Qualified Threshold', type: 'number', desc: 'Minimum score to be "Qualified"' },
      { key: 'lead_score_review', label: 'Review Threshold', type: 'number', desc: 'Minimum score for "Needs Review"' },
    ],
  },
  {
    category: 'safety',
    label: 'Safety Qualification Thresholds',
    settings: [
      { key: 'safety_max_basic_alerts', label: 'Max BASIC Alerts', type: 'number', desc: 'Alerts before High Risk' },
      { key: 'safety_max_crashes', label: 'Max Crashes (review)', type: 'number', desc: 'Crashes before Review Required' },
    ],
  },
  {
    category: 'batch',
    label: 'Batch Processing',
    settings: [
      { key: 'batch_size', label: 'Batch Size', type: 'number', desc: 'Carriers per batch (recommended: 200/day)' },
      { key: 'automation_paused', label: 'Automation Paused', type: 'string', desc: 'Set to "true" to pause all automation' },
    ],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await base44.entities.AppSetting.list('-created_date', 200);
      const map = {};
      allSettings.forEach(s => { map[s.setting_key] = s; });
      setSettings(map);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      for (const group of SETTING_GROUPS) {
        for (const s of group.settings) {
          const existing = settings[s.key];
          const value = existing?.setting_value || '';
          if (existing && existing.id) {
            if (existing.setting_value !== value) {
              await base44.entities.AppSetting.update(existing.id, { setting_value: value });
            }
          } else if (value) {
            const created = await base44.entities.AppSetting.create({
              setting_key: s.key,
              setting_value: value,
              setting_category: group.category,
              setting_type: s.type,
              description: s.desc,
            });
            settings[s.key] = created;
          }
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], setting_value: value },
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your dispatch CRM</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save All
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {saved && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />Settings saved successfully</div>}

      {/* Credentials info */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader><CardTitle className="text-base text-amber-800">Required External Credentials</CardTitle></CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p><strong>FMCSA API Key</strong> — Request a free webkey at <a href="https://mobile.fmcsa.dot.gov/QCDevsite/" target="_blank" rel="noopener noreferrer" className="underline">FMCSA Developer Portal</a>. Add it as <code className="bg-amber-100 px-1 rounded">FMCSA_API_KEY</code> in Environment Variables. Required for all carrier research.</p>
          <p><strong>SMTP Credentials</strong> — Configure <code className="bg-amber-100 px-1 rounded">SMTP_HOST</code>, <code className="bg-amber-100 px-1 rounded">SMTP_PORT</code>, <code className="bg-amber-100 px-1 rounded">SMTP_USER</code>, <code className="bg-amber-100 px-1 rounded">SMTP_PASS</code>, <code className="bg-amber-100 px-1 rounded">SMTP_FROM</code> in Environment Variables. Required for email campaigns. Uses your corporate email account securely.</p>
          <p><strong>Voice Provider</strong> — AI calling requires a voice provider integration (e.g. Retell, Vapi, or Twilio). Not yet connected. Calling queue is ready; outbound calls will activate after provider setup.</p>
        </CardContent>
      </Card>

      {SETTING_GROUPS.map(group => (
        <Card key={group.category}>
          <CardHeader><CardTitle className="text-base">{group.label}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {group.settings.map(s => (
              <div key={s.key}>
                <Label className="text-sm">{s.label}</Label>
                {s.type === 'text' ? (
                  <Textarea
                    value={settings[s.key]?.setting_value || ''}
                    onChange={e => updateSetting(s.key, e.target.value)}
                    className="mt-1"
                    placeholder={s.desc}
                  />
                ) : (
                  <Input
                    type={s.type === 'number' ? 'number' : 'text'}
                    value={settings[s.key]?.setting_value || ''}
                    onChange={e => updateSetting(s.key, e.target.value)}
                    className="mt-1"
                    placeholder={s.desc}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
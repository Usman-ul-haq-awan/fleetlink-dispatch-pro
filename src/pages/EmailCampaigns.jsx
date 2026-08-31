import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Plus, Send, Eye, Loader2, Pause, Play } from "lucide-react";
import { useEntity } from "@/lib/entityContext";
import VisitorEmptyState from "@/components/VisitorEmptyState";

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ campaign_name: "", template_subject: "", template_body: "", daily_send_limit: 50, follow_up_delay_days: 3, max_follow_ups: 2 });
  const [previewCarrier, setPreviewCarrier] = useState(null);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const { isVisitor } = useEntity();

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.EmailCampaign.list("-created_at", 50);
      setCampaigns(all);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!isVisitor) load(); }, [isVisitor]);

  const createCampaign = async () => {
    try {
      await base44.entities.EmailCampaign.create({
        ...newCampaign,
        daily_send_limit: parseInt(newCampaign.daily_send_limit) || 50,
        follow_up_delay_days: parseInt(newCampaign.follow_up_delay_days) || 3,
        max_follow_ups: parseInt(newCampaign.max_follow_ups) || 2,
        status: "Draft",
        created_at: new Date().toISOString(),
      });
      setShowCreate(false);
      setNewCampaign({ campaign_name: "", template_subject: "", template_body: "", daily_send_limit: 50, follow_up_delay_days: 3, max_follow_ups: 2 });
      load();
    } catch (err) { alert("Create failed: " + err.message); }
  };

  const toggleCampaignStatus = async (campaign) => {
    const newStatus = campaign.status === "Active" ? "Paused" : "Active";
    await base44.entities.EmailCampaign.update(campaign.id, { status: newStatus });
    load();
  };

  const generatePreview = async (carrierId) => {
    setGenerating(true);
    setPreviewCarrier(carrierId);
    setPreviewEmail(null);
    try {
      const res = await base44.functions.invoke("generateEmailContent", { carrier_id: carrierId });
      setPreviewEmail(res.data);
    } catch (err) {
      setPreviewEmail({ error: err.response?.data?.error || err.message });
    } finally {
      setGenerating(false);
    }
  };

  const sendTestEmail = async (carrierId, emailData) => {
    setSending(true);
    try {
      await base44.functions.invoke("sendCampaignEmail", {
        carrier_id: carrierId,
        subject: emailData.subject,
        body: emailData.body,
      });
      alert("Test email sent successfully");
    } catch (err) {
      alert("Send failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  if (isVisitor) return <VisitorEmptyState title="Email Campaigns" message="Campaigns are hidden for visitors and cannot be run." />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4 space-y-3">
          <h2 className="font-semibold text-slate-900">Create Campaign</h2>
          <input type="text" placeholder="Campaign Name" value={newCampaign.campaign_name}
            onChange={e => setNewCampaign({...newCampaign, campaign_name: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          <input type="text" placeholder="Email Subject Template (use {{company_name}}, {{owner_name}})" value={newCampaign.template_subject}
            onChange={e => setNewCampaign({...newCampaign, template_subject: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          <textarea placeholder="Email Body Template" value={newCampaign.template_body}
            onChange={e => setNewCampaign({...newCampaign, template_body: e.target.value})}
            rows={5} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">Daily Send Limit</label>
              <input type="number" value={newCampaign.daily_send_limit}
                onChange={e => setNewCampaign({...newCampaign, daily_send_limit: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Follow-up Delay (days)</label>
              <input type="number" value={newCampaign.follow_up_delay_days}
                onChange={e => setNewCampaign({...newCampaign, follow_up_delay_days: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Max Follow-ups</label>
              <input type="number" value={newCampaign.max_follow_ups}
                onChange={e => setNewCampaign({...newCampaign, max_follow_ups: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <button onClick={createCampaign} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Create Campaign</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No campaigns yet. Create one to start outreach.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.campaign_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Subject: {c.template_subject || "(no template)"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === "Active" ? "bg-green-100 text-green-700" :
                    c.status === "Paused" ? "bg-amber-100 text-amber-700" :
                    c.status === "Completed" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>{c.status}</span>
                  <button onClick={() => toggleCampaignStatus(c)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                    {c.status === "Active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center bg-slate-50 rounded p-2">
                  <p className="text-lg font-bold text-slate-700">{c.total_queued || 0}</p>
                  <p className="text-xs text-slate-400">Queued</p>
                </div>
                <div className="text-center bg-green-50 rounded p-2">
                  <p className="text-lg font-bold text-green-700">{c.total_sent || 0}</p>
                  <p className="text-xs text-slate-400">Sent</p>
                </div>
                <div className="text-center bg-blue-50 rounded p-2">
                  <p className="text-lg font-bold text-blue-700">{c.total_replied || 0}</p>
                  <p className="text-xs text-slate-400">Replied</p>
                </div>
                <div className="text-center bg-red-50 rounded p-2">
                  <p className="text-lg font-bold text-red-700">{c.total_bounced || 0}</p>
                  <p className="text-xs text-slate-400">Bounced</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Preview Section */}
      <div className="mt-6 bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Personalization Preview</h2>
        <p className="text-sm text-slate-500 mb-3">Generate a personalized email preview for a specific carrier using AI.</p>
        <PreviewGenerator carriers={[]} onGenerate={generatePreview} generating={generating} previewCarrier={previewCarrier} previewEmail={previewEmail} onSend={sendTestEmail} sending={sending} />
      </div>
    </div>
  );
}

function PreviewGenerator({ onGenerate, generating, previewEmail, onSend, sending }) {
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState("");

  useEffect(() => {
    base44.entities.Carrier.filter({ lead_status: "Ready for Outreach" }, "-lead_score", 20)
      .then(c => { setCarriers(c); }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg">
          <option value="">Select a carrier...</option>
          {carriers.map(c => <option key={c.id} value={c.id}>{c.legal_name} (USDOT: {c.usdot_number})</option>)}
        </select>
        <button onClick={() => onGenerate(selectedCarrier)} disabled={!selectedCarrier || generating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {generating ? "Generating..." : "Preview"}
        </button>
      </div>

      {previewEmail && !previewEmail.error && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <div className="mb-2">
            <label className="text-xs text-slate-500">Subject:</label>
            <p className="text-sm font-medium text-slate-900">{previewEmail.subject}</p>
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-500">Body:</label>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans mt-1">{previewEmail.body}</pre>
          </div>
          <button onClick={() => onSend(selectedCarrier, previewEmail)} disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : "Send Test Email"}
          </button>
        </div>
      )}

      {previewEmail?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{previewEmail.error}</p>
        </div>
      )}
    </div>
  );
}
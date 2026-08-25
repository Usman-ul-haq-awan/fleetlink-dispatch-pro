import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { Mail, Loader2, Plus, Send, Eye, Pause, Play, AlertCircle, X } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [error, setError] = useState('');
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '', template_subject: '', template_body: '',
    daily_send_limit: 50, follow_up_delay_days: 3, max_follow_ups: 2,
  });

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.EmailCampaign.list('-created_date', 100);
      setCampaigns(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await base44.entities.EmailCampaign.create({
        ...newCampaign,
        status: 'Draft',
        total_queued: 0, total_sent: 0, total_replied: 0, total_bounced: 0,
        created_at: new Date().toISOString(),
      });
      setShowCreate(false);
      setNewCampaign({ campaign_name: '', template_subject: '', template_body: '', daily_send_limit: 50, follow_up_delay_days: 3, max_follow_ups: 2 });
      loadCampaigns();
    } catch (e) { setError(e.message); }
  };

  const toggleStatus = async (c) => {
    try {
      const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
      await base44.entities.EmailCampaign.update(c.id, { status: newStatus });
      loadCampaigns();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage personalized outreach campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4 mr-2" />New Campaign</Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {showCreate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Create Campaign</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Campaign Name</Label><Input value={newCampaign.campaign_name} onChange={e => setNewCampaign({...newCampaign, campaign_name: e.target.value})} className="mt-1" /></div>
            <div><Label>Subject Template</Label><Input value={newCampaign.template_subject} onChange={e => setNewCampaign({...newCampaign, template_subject: e.target.value})} className="mt-1" placeholder="Dispatch Services Available for {{company_name}}" /></div>
            <div>
              <Label>Body Template</Label>
              <Textarea value={newCampaign.template_body} onChange={e => setNewCampaign({...newCampaign, template_body: e.target.value})} className="mt-1" rows={6} placeholder="Hi {{contact_first}}, ..." />
              <p className="text-xs text-muted-foreground mt-1">Available placeholders: {'{{company_name}}, {{contact_first}}, {{contact_name}}, {{equipment}}, {{state}}, {{usdot}}, {{mc}}'}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Daily Limit</Label><Input type="number" value={newCampaign.daily_send_limit} onChange={e => setNewCampaign({...newCampaign, daily_send_limit: parseInt(e.target.value)})} className="mt-1" /></div>
              <div><Label>Follow-up Delay (days)</Label><Input type="number" value={newCampaign.follow_up_delay_days} onChange={e => setNewCampaign({...newCampaign, follow_up_delay_days: parseInt(e.target.value)})} className="mt-1" /></div>
              <div><Label>Max Follow-ups</Label><Input type="number" value={newCampaign.max_follow_ups} onChange={e => setNewCampaign({...newCampaign, max_follow_ups: parseInt(e.target.value)})} className="mt-1" /></div>
            </div>
            <Button onClick={handleCreate}>Create Campaign</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><Mail className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No campaigns yet. Create one to get started.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{c.campaign_name}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Sent: {c.total_sent || 0}</span>
                      <span>Replied: {c.total_replied || 0}</span>
                      <span>Bounced: {c.total_bounced || 0}</span>
                      <span>Daily limit: {c.daily_send_limit || 50}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedCampaign(c)}><Eye className="w-4 h-4 mr-1" />Details</Button>
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(c)}>
                      {c.status === 'Active' ? <><Pause className="w-4 h-4 mr-1" />Pause</> : <><Play className="w-4 h-4 mr-1" />Activate</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCampaign && <CampaignDetail campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />}
    </div>
  );
}

function CampaignDetail({ campaign, onClose }) {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(null);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    loadEligibleCarriers();
  }, []);

  const loadEligibleCarriers = async () => {
    try {
      setLoading(true);
      // Get carriers that are Ready for Outreach or Qualified and have email
      const all = await base44.entities.Carrier.filter({ lead_status: 'Ready for Outreach' }, '-lead_score', 200);
      const qualified = await base44.entities.Carrier.filter({ lead_status: 'Qualified' }, '-lead_score', 200);
      const combined = [...all, ...qualified].filter(c => c.email && !c.do_not_contact);
      setCarriers(combined);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePreview = async (carrier) => {
    try {
      setPreviewing(carrier.carrier_id);
      const resp = await base44.functions.invoke('generateEmailContent', { carrier_id: carrier.carrier_id, campaign_id: campaign.id });
      const emailData = resp.data || resp;
      setPreviewing({ ...carrier, preview: emailData });
    } catch (e) {
      console.error(e);
      setPreviewing(null);
    }
  };

  const handleSend = async (carrier, emailContent) => {
    try {
      setSending(carrier.carrier_id);
      await base44.functions.invoke('sendCampaignEmail', {
        carrier_id: carrier.carrier_id,
        campaign_id: campaign.id,
        to_email: carrier.email,
        subject: emailContent.subject,
        body: emailContent.body,
      });
      // Update carrier status
      await base44.entities.Carrier.update(carrier.id, { lead_status: 'Contacted' });
      loadEligibleCarriers();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(null);
    }
  };

  return (
    <Card className="fixed inset-4 lg:inset-8 z-50 overflow-y-auto bg-card shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10">
        <CardTitle className="text-base">{campaign.campaign_name} — Eligible Carriers</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : carriers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No eligible carriers with email addresses. Research carriers first, then mark as Ready for Outreach.</p>
        ) : (
          carriers.map(c => (
            <div key={c.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{c.legal_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{c.email} • Score: {c.lead_score} • {c.state}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handlePreview(c)} disabled={previewing === c.carrier_id}>
                    {previewing?.carrier_id === c.carrier_id ? 'Hide' : 'Preview'}
                  </Button>
                </div>
              </div>
              {previewing?.carrier_id === c.carrier_id && previewing.preview && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Subject:</p>
                    <p className="text-sm">{previewing.preview.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Body:</p>
                    <pre className="text-sm whitespace-pre-wrap font-sans">{previewing.preview.body}</pre>
                  </div>
                  <Button size="sm" onClick={() => handleSend(c, previewing.preview)} disabled={sending === c.carrier_id}>
                    {sending === c.carrier_id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    Send Email
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { Phone, Loader2, AlertCircle, PhoneCall, Plus } from 'lucide-react';

const OUTCOMES = ['No Answer', 'Voicemail', 'Interested', 'Very Interested', 'Callback Requested', 'Not Interested', 'Already Has Dispatcher', 'Wrong Number', 'Do Not Contact', 'Human Handoff', 'Converted'];

export default function Calling() {
  const [calls, setCalls] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ carrier_id: '', phone_number: '', outcome: 'No Answer', notes: '', next_action: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const callData = await base44.entities.CallLog.list('-call_date', 200);
      setCalls(callData);
      // Get carriers ready for calling
      const ready = await base44.entities.Carrier.filter({ lead_status: 'Ready for Outreach' }, '-lead_score', 200);
      const contacted = await base44.entities.Carrier.filter({ lead_status: 'Contacted' }, '-lead_score', 200);
      setCarriers([...ready, ...contacted].filter(c => c.phone));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleLogCall = async () => {
    try {
      if (!logForm.carrier_id || !logForm.outcome) return;
      await base44.entities.CallLog.create({
        ...logForm,
        call_date: new Date().toISOString(),
        status: 'Completed',
        direction: 'Outbound',
        is_ai_call: false,
      });

      // Update carrier status based on outcome
      const carrier = carriers.find(c => c.carrier_id === logForm.carrier_id);
      if (carrier) {
        let newStatus = carrier.lead_status;
        if (['Interested', 'Very Interested', 'Callback Requested', 'Human Handoff'].includes(logForm.outcome)) {
          newStatus = logForm.outcome === 'Human Handoff' ? 'Human Handoff' : 'Interested';
        } else if (logForm.outcome === 'Do Not Contact') {
          newStatus = 'Do Not Contact';
          await base44.entities.Carrier.update(carrier.id, { do_not_contact: true, dnc_reason: 'Call DNC request' });
        } else if (logForm.outcome === 'Converted') {
          newStatus = 'Onboarding';
        }

        await base44.entities.Carrier.update(carrier.id, { lead_status: newStatus });

        // Create handoff for interested carriers
        if (['Interested', 'Very Interested', 'Human Handoff', 'Callback Requested'].includes(logForm.outcome)) {
          await base44.entities.Handoff.create({
            carrier_id: carrier.carrier_id,
            contact_name: carrier.contact_name || carrier.owner_name || '',
            phone: carrier.phone || '',
            email: carrier.email || '',
            mc_number: carrier.mc_number || '',
            usdot_number: carrier.usdot_number || '',
            equipment: carrier.equipment_types || '',
            lead_score: carrier.lead_score || 0,
            safety_qualification: carrier.safety_qualification || '',
            trigger_source: 'Call',
            trigger_outcome: logForm.outcome,
            notes: logForm.notes,
            next_action: logForm.next_action || 'Back office to contact for onboarding',
            status: 'New',
            is_hot_lead: true,
            created_at: new Date().toISOString(),
          });
        }
      }

      setShowLog(false);
      setLogForm({ carrier_id: '', phone_number: '', outcome: 'No Answer', notes: '', next_action: '' });
      loadData();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Calling Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage outbound calls to carriers</p>
        </div>
        <Button onClick={() => setShowLog(!showLog)}><Plus className="w-4 h-4 mr-2" />Log Call</Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {/* Voice provider notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2"><PhoneCall className="w-4 h-4" /><strong>AI Calling Not Yet Active</strong></p>
          <p className="mt-1">The calling queue and data model are ready. AI outbound calling requires a voice provider integration (e.g. Retell, Vapi, Twilio). Manual call logging is available now. AI calls will activate after provider setup.</p>
        </CardContent>
      </Card>

      {showLog && (
        <Card>
          <CardHeader><CardTitle className="text-base">Log a Call</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Select Carrier</Label>
              <select className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm" value={logForm.carrier_id} onChange={e => {
                const c = carriers.find(c => c.carrier_id === e.target.value);
                setLogForm({ ...logForm, carrier_id: e.target.value, phone_number: c?.phone || '' });
              }}>
                <option value="">-- Select --</option>
                {carriers.map(c => <option key={c.carrier_id} value={c.carrier_id}>{c.legal_name} ({c.usdot_number})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={logForm.phone_number} onChange={e => setLogForm({...logForm, phone_number: e.target.value})} className="mt-1" /></div>
              <div>
                <Label>Outcome</Label>
                <select className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm" value={logForm.outcome} onChange={e => setLogForm({...logForm, outcome: e.target.value})}>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} className="mt-1" rows={2} /></div>
            <div><Label>Next Action</Label><Input value={logForm.next_action} onChange={e => setLogForm({...logForm, next_action: e.target.value})} className="mt-1" /></div>
            <Button onClick={handleLogCall}>Save Call Log</Button>
          </CardContent>
        </Card>
      )}

      {/* Queue */}
      <Card>
        <CardHeader><CardTitle className="text-base">Call Queue ({carriers.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto my-8" /> : carriers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No carriers ready for calling. Research and qualify carriers first.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3">Company</th><th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Score</th><th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.legal_name || 'Unknown'}</td>
                    <td className="px-4 py-3">{c.phone || '-'}</td>
                    <td className="px-4 py-3">{c.lead_score || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.lead_status} /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => { setShowLog(true); setLogForm({...logForm, carrier_id: c.carrier_id, phone_number: c.phone || ''}); }}>
                        <Phone className="w-3 h-3 mr-1" />Log Call
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent calls */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Calls</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {calls.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No calls logged yet.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Outcome</th><th className="text-left px-4 py-3">Notes</th>
                  <th className="text-left px-4 py-3">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(c => (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-4 py-3 text-xs">{c.call_date ? new Date(c.call_date).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3">{c.phone_number || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.outcome} /></td>
                    <td className="px-4 py-3 text-xs">{c.notes || '-'}</td>
                    <td className="px-4 py-3 text-xs">{c.next_action || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { ClipboardList, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

const CHECKLIST = ['dispatch_agreement', 'carrier_documents', 'w9_received', 'insurance_verified', 'operating_authority_verified', 'equipment_confirmed'];

export default function Onboarding() {
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = 'All';

  useEffect(() => { loadOnboardings(); }, []);

  const loadOnboardings = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.Onboarding.list('-created_at', 200);
      // Enrich with carrier info
      const enriched = await Promise.all(data.map(async (o) => {
        const carriers = await base44.entities.Carrier.filter({ carrier_id: o.carrier_id });
        return { ...o, carrier: carriers[0] || null };
      }));
      setOnboardings(enriched);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (o, updates) => {
    try {
      await base44.entities.Onboarding.update(o.id, updates);
      loadOnboardings();
    } catch (e) { setError(e.message); }
  };

  const handleToggle = async (o, field) => {
    handleUpdate(o, { [field]: !o[field] });
  };

  const filtered = filter === 'All' ? onboardings : onboardings.filter(o => o.onboarding_status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-1">Track carrier onboarding progress to active dispatch</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="flex flex-wrap gap-2">
        {['All', 'New', 'Contacted', 'Documents Requested', 'Documents Received', 'Under Review', 'Ready for Dispatch', 'Active Client', 'Lost'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</button>
        ))}
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No onboarding records. Handoffs from interested carriers will appear here.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {o.carrier && <Link to={`/carriers/${o.carrier_id}`} className="font-medium hover:underline">{o.carrier.legal_name || 'Unknown'}</Link>}
                    <p className="text-xs text-muted-foreground">USDOT: {o.carrier?.usdot_number || '-'} • MC: {o.carrier?.mc_number || '-'}</p>
                  </div>
                  <StatusBadge status={o.onboarding_status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {CHECKLIST.map(item => (
                    <button key={item} onClick={() => handleToggle(o, item)} className="flex items-center gap-2 text-sm border border-border rounded-lg p-2 hover:bg-muted/50">
                      {o[item] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                      <span className="capitalize text-xs">{item.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-3">
                  <div><p className="text-xs text-muted-foreground">Preferred Lanes</p><p className="text-xs">{o.preferred_lanes || '-'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rate Preferences</p><p className="text-xs">{o.rate_preferences || '-'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Dispatch Start</p><p className="text-xs">{o.dispatch_start_date || '-'}</p></div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Status</Label>
                    <select className="h-8 px-2 mt-1 rounded-lg border border-input bg-background text-sm" value={o.onboarding_status} onChange={e => handleUpdate(o, { onboarding_status: e.target.value })}>
                      {['New', 'Contacted', 'Documents Requested', 'Documents Received', 'Under Review', 'Ready for Dispatch', 'Active Client', 'Lost'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Notes</Label>
                    <Input value={o.checklist_notes || ''} onChange={e => handleUpdate(o, { checklist_notes: e.target.value })} className="h-8 text-sm mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
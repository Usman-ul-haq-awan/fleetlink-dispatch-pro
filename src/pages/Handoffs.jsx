import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { UserCheck, Loader2, AlertCircle, Flame } from 'lucide-react';

export default function Handoffs() {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('New');

  useEffect(() => { loadHandoffs(); }, []);

  const loadHandoffs = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.Handoff.list('-created_at', 200);
      setHandoffs(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (h, field, value) => {
    try {
      await base44.entities.Handoff.update(h.id, { [field]: value });
      loadHandoffs();
    } catch (e) { setError(e.message); }
  };

  const filtered = filter === 'All' ? handoffs : handoffs.filter(h => h.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Human Handoff</h1>
        <p className="text-sm text-muted-foreground mt-1">Hot leads ready for back office onboarding</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="flex gap-2">
        {['New', 'Assigned', 'Contacted', 'Completed', 'Lost', 'All'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</button>
        ))}
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No handoffs in this category.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(h => (
            <Card key={h.id} className={h.is_hot_lead ? 'border-orange-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {h.is_hot_lead && <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"><Flame className="w-3 h-3" />HOT LEAD</span>}
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="font-medium">{h.contact_name || 'Unknown contact'}</p>
                    <p className="text-xs text-muted-foreground">USDOT: {h.usdot_number} • MC: {h.mc_number}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Score: <strong>{h.lead_score || '-'}</strong></p>
                    <p className="text-xs">{h.safety_qualification || ''}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                  <div><p className="text-xs text-muted-foreground">Phone</p><p>{h.phone || '-'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="text-xs truncate">{h.email || '-'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Equipment</p><p className="text-xs">{h.equipment || '-'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Trigger</p><p className="text-xs">{h.trigger_source} • {h.trigger_outcome}</p></div>
                </div>

                {h.notes && <p className="text-sm bg-muted/50 p-2 rounded mb-3">{h.notes}</p>}

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Next Action</Label>
                    <Input value={h.next_action || ''} onChange={e => handleUpdate(h, 'next_action', e.target.value)} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <select className="h-8 px-2 mt-1 rounded-lg border border-input bg-background text-sm" value={h.status} onChange={e => handleUpdate(h, 'status', e.target.value)}>
                      {['New', 'Assigned', 'Contacted', 'Completed', 'Lost'].map(s => <option key={s}>{s}</option>)}
                    </select>
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
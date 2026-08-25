import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Activity, Loader2, AlertCircle, Search } from 'lucide-react';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.ActivityLog.list('-timestamp', 500);
      setLogs(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const filtered = logs.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.action || '').toLowerCase().includes(s) || (l.details || '').toLowerCase().includes(s) || (l.carrier_id || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Activity / Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">All automated and manual actions across the system</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search actions, details, carrier ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select className="h-10 px-3 rounded-lg border border-input bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="Success">Success</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto my-8" /> : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Activity className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No activity logs found.</p></div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {filtered.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-4 hover:bg-muted/30">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${l.status === 'Error' ? 'bg-red-500' : l.status === 'Success' ? 'bg-green-500' : l.status === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{l.action}</p>
                      {l.status && l.status !== 'Info' && <span className={`text-xs px-1.5 py-0.5 rounded ${l.status === 'Error' ? 'bg-red-100 text-red-700' : l.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>}
                    </div>
                    {l.details && <p className="text-xs text-muted-foreground mt-0.5">{l.details}</p>}
                    {l.workflow && <p className="text-xs text-muted-foreground mt-0.5">Workflow: {l.workflow}</p>}
                    {l.source_url && <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 block truncate">{l.source_url}</a>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</p>
                    {l.carrier_id && <p className="text-xs text-muted-foreground font-mono">{l.carrier_id.slice(0, 12)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import { Search, Loader2, Truck, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

export default function Carriers() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('');
  const [researching, setResearching] = useState(null);
  const [error, setError] = useState('');

  const statusOptions = ['', 'Imported', 'Queued', 'Researching', 'Qualified', 'Needs Review', 'Failed', 'Ready for Outreach', 'Contacted', 'Interested', 'Human Handoff', 'Onboarding', 'Active Client', 'Do Not Contact'];
  const safetyOptions = ['', 'Not Assessed', 'Qualified', 'Review Required', 'High Risk', 'Insufficient Data'];

  const loadCarriers = useCallback(async () => {
    try {
      setLoading(true);
      const query = {};
      if (statusFilter) query.lead_status = statusFilter;
      if (safetyFilter) query.safety_qualification = safetyFilter;
      const data = await base44.entities.Carrier.filter(query, '-created_date', 500);
      setCarriers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, safetyFilter]);

  useEffect(() => {
    loadCarriers();
  }, [loadCarriers]);

  const handleResearch = async (carrier) => {
    try {
      setResearching(carrier.carrier_id);
      await base44.functions.invoke('researchCarrier', { carrier_id: carrier.carrier_id });
      await loadCarriers();
    } catch (e) {
      setError(e.message || 'Research failed. Check if FMCSA API key is configured in Settings.');
    } finally {
      setResearching(null);
    }
  };

  const filtered = carriers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.legal_name || '').toLowerCase().includes(s) ||
      (c.dba_name || '').toLowerCase().includes(s) ||
      (c.usdot_number || '').includes(s) ||
      (c.mc_number || '').includes(s) ||
      (c.state || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Carrier Database</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} carriers</p>
        </div>
        <Link to="/import">
          <Button>Import Carriers</Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, USDOT, MC, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
          value={safetyFilter}
          onChange={(e) => setSafetyFilter(e.target.value)}
        >
          {safetyOptions.map(s => <option key={s} value={s}>{s || 'All Safety'}</option>)}
        </select>
        <Button variant="outline" onClick={loadCarriers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Truck className="w-12 h-12 mb-3 opacity-50" />
              <p>No carriers found. Import carriers to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Company</th>
                  <th className="text-left px-4 py-3 font-medium">USDOT</th>
                  <th className="text-left px-4 py-3 font-medium">MC</th>
                  <th className="text-left px-4 py-3 font-medium">State</th>
                  <th className="text-left px-4 py-3 font-medium">Power Units</th>
                  <th className="text-left px-4 py-3 font-medium">Safety</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/carriers/${c.carrier_id}`} className="font-medium hover:underline">
                        {c.legal_name || c.dba_name || 'Unknown'}
                      </Link>
                      {c.dba_name && c.dba_name !== c.legal_name && (
                        <p className="text-xs text-muted-foreground">DBA: {c.dba_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c.usdot_number || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.mc_number || '-'}</td>
                    <td className="px-4 py-3">{c.state || '-'}</td>
                    <td className="px-4 py-3">{c.power_units || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.safety_qualification} /></td>
                    <td className="px-4 py-3">
                      {c.lead_score ? (
                        <span className="font-medium">{c.lead_score}</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.lead_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResearch(c)}
                          disabled={researching === c.carrier_id}
                        >
                          {researching === c.carrier_id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : null}
                          Research
                        </Button>
                        {c.safer_url && (
                          <a href={c.safer_url} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
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
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';

export default function Export() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const carriers = await base44.entities.Carrier.list('-created_date', 2000);
      setStats({
        total: carriers.length,
        byStatus: carriers.reduce((acc, c) => {
          acc[c.lead_status || 'Unknown'] = (acc[c.lead_status || 'Unknown'] || 0) + 1;
          return acc;
        }, {}),
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleExport = async (statusFilter) => {
    try {
      setExporting(true);
      setError('');
      const csv = await base44.functions.invoke('exportCarriers', { status: statusFilter || '', format: 'csv' });
      const csvText = typeof csv === 'string' ? csv : (csv?.data || csv);
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carriers_export_${statusFilter || 'all'}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Export Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Export carrier database to CSV with all fields as separate columns</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {stats && (
        <Card>
          <CardHeader><CardTitle className="text-base">Export Summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm mb-3">Total carriers: <strong>{stats.total}</strong></p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <span key={status} className="text-xs bg-muted px-2 py-1 rounded">{status}: {count}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Export Options</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">CSV export includes all fields as separate columns: Carrier Name, DBA, USDOT, MC, MX, Status, Address, Phone, Fax, Email, Owner, Contact, Power Units, Drivers, Cargo, Equipment, Safety Qualification, Lead Score, Source URLs, and more.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleExport('')} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export All Carriers
            </Button>
            <Button onClick={() => handleExport('Qualified')} variant="outline" disabled={exporting}>
              Export Qualified Only
            </Button>
            <Button onClick={() => handleExport('Ready for Outreach')} variant="outline" disabled={exporting}>
              Export Ready for Outreach
            </Button>
            <Button onClick={() => handleExport('Active Client')} variant="outline" disabled={exporting}>
              Export Active Clients
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
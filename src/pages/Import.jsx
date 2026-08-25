import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';

export default function Import() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [manualEntry, setManualEntry] = useState({ usdot: '', mc: '', name: '' });
  const [manualCarriers, setManualCarriers] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setError('');
    setImportResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      const result = await base44.functions.invoke('extractCarrierFile', { file_url });
      const data = result.data || result;
      if (data.status === 'success' && data.output) {
        const carriers = Array.isArray(data.output) ? data.output : (data.output.carriers || []);
        setParsedData(carriers);
        // Auto-map columns
        const mapping = {};
        carriers.forEach((c, i) => {
          if (i === 0) {
            Object.keys(c).forEach(key => {
              const lower = key.toLowerCase();
              if (lower.includes('dot') || lower.includes('usdot')) mapping[key] = 'usdot_number';
              else if (lower.includes('mc') || lower.includes('docket')) mapping[key] = 'mc_number';
              else if (lower.includes('name') || lower.includes('company')) mapping[key] = 'legal_name';
              else if (lower.includes('phone')) mapping[key] = 'phone';
              else if (lower.includes('state')) mapping[key] = 'state';
              else if (lower.includes('email')) mapping[key] = 'email';
            });
          }
        });
        setColumnMapping(mapping);
      }
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) onDrop([f]);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setError('');

      // Combine file carriers and manual entries
      const allCarriers = [...(parsedData || []), ...manualCarriers];
      if (allCarriers.length === 0) {
        setError('No carriers to import');
        return;
      }

      // Check for duplicates
      const existingCarriers = await base44.entities.Carrier.list('-created_date', 2000);
      const existingUsdots = new Set(existingCarriers.map(c => c.usdot_number).filter(Boolean));
      const existingMcs = new Set(existingCarriers.map(c => c.mc_number).filter(Boolean));

      let imported = 0, duplicates = 0, missingUsdot = 0, missingMc = 0, invalid = 0;
      const records = [];

      for (const c of allCarriers) {
        // Map fields using column mapping
        const mapped = {};
        Object.entries(c).forEach(([key, value]) => {
          const targetField = columnMapping[key];
          if (targetField) mapped[targetField] = value;
        });

        // Also check manual entry fields
        if (c.usdot) mapped.usdot_number = mapped.usdot_number || c.usdot;
        if (c.mc) mapped.mc_number = mapped.mc_number || c.mc;
        if (c.name) mapped.legal_name = mapped.legal_name || c.name;

        const usdot = mapped.usdot_number?.toString().trim();
        const mc = mapped.mc_number?.toString().trim();

        if (!usdot && !mc && !mapped.legal_name) {
          invalid++;
          continue;
        }
        if (!usdot) missingUsdot++;
        if (!mc) missingMc++;

        // Duplicate check
        if (usdot && existingUsdots.has(usdot)) { duplicates++; continue; }
        if (mc && existingMcs.has(mc)) { duplicates++; continue; }

        const carrierId = 'CAR-' + Date.now() + '-' + imported;
        records.push({
          carrier_id: carrierId,
          legal_name: mapped.legal_name || '',
          usdot_number: usdot || '',
          mc_number: mc || '',
          phone: mapped.phone || '',
          state: mapped.state || '',
          email: mapped.email || '',
          lead_status: 'Imported',
          research_status: 'Not started',
          safety_qualification: 'Not Assessed',
          lead_score: 0,
          do_not_contact: false,
        });
        if (usdot) existingUsdots.add(usdot);
        if (mc) existingMcs.add(mc);
        imported++;
      }

      if (records.length > 0) {
        await base44.entities.Carrier.bulkCreate(records);
      }

      // Create import batch record
      await base44.entities.ImportBatch.create({
        batch_name: file?.name || 'Manual Entry',
        file_name: file?.name || '',
        total_records: allCarriers.length,
        duplicates_found: duplicates,
        missing_usdot: missingUsdot,
        missing_mc: missingMc,
        invalid_records: invalid,
        imported_count: imported,
        status: 'Completed',
        column_mapping: JSON.stringify(columnMapping),
      });

      setImportResult({ imported, duplicates, missingUsdot, missingMc, invalid, total: allCarriers.length });
      setParsedData(null);
      setFile(null);
      setManualCarriers([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const addManualCarrier = () => {
    if (!manualEntry.usdot && !manualEntry.mc && !manualEntry.name) return;
    setManualCarriers([...manualCarriers, { ...manualEntry }]);
    setManualEntry({ usdot: '', mc: '', name: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Import Carriers</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a CSV/Excel file or add carriers manually</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {importResult && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5" /><span className="font-medium">Import Complete</span></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div><p className="font-bold text-lg">{importResult.imported}</p><p>Imported</p></div>
            <div><p className="font-bold text-lg">{importResult.duplicates}</p><p>Duplicates</p></div>
            <div><p className="font-bold text-lg">{importResult.missingUsdot}</p><p>Missing USDOT</p></div>
            <div><p className="font-bold text-lg">{importResult.missingMc}</p><p>Missing MC</p></div>
            <div><p className="font-bold text-lg">{importResult.invalid}</p><p>Invalid</p></div>
          </div>
        </div>
      )}

      {/* File upload */}
      <Card>
        <CardHeader><CardTitle className="text-base">Upload File</CardTitle></CardHeader>
        <CardContent>
          <label className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-border hover:border-primary/50 block">
            <input type="file" accept=".csv,.xls,.xlsx" onChange={handleFileSelect} className="hidden" />
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Click to select CSV or Excel file</p>
                <p className="text-sm text-muted-foreground mt-1">Supports CSV, XLS, XLSX with USDOT, MC, or company name columns</p>
              </div>
            )}
          </label>
        </CardContent>
      </Card>

      {/* Column mapping */}
      {parsedData && parsedData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Column Mapping ({parsedData.length} carriers found)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(parsedData[0]).map(key => (
                <div key={key}>
                  <Label className="text-xs">"{key}" maps to:</Label>
                  <select
                    className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm"
                    value={columnMapping[key] || ''}
                    onChange={e => setColumnMapping({ ...columnMapping, [key]: e.target.value })}
                  >
                    <option value="">-- Skip --</option>
                    <option value="usdot_number">USDOT Number</option>
                    <option value="mc_number">MC Number</option>
                    <option value="legal_name">Legal Name</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="state">State</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Preview (first 3 rows):</p>
              {parsedData.slice(0, 3).map((c, i) => (
                <p key={i} className="text-xs text-muted-foreground">{JSON.stringify(c)}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual entry */}
      <Card>
        <CardHeader><CardTitle className="text-base">Manual Entry</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div><Label className="text-xs">USDOT</Label><Input value={manualEntry.usdot} onChange={e => setManualEntry({...manualEntry, usdot: e.target.value})} className="mt-1" /></div>
            <div><Label className="text-xs">MC</Label><Input value={manualEntry.mc} onChange={e => setManualEntry({...manualEntry, mc: e.target.value})} className="mt-1" /></div>
            <div><Label className="text-xs">Company Name</Label><Input value={manualEntry.name} onChange={e => setManualEntry({...manualEntry, name: e.target.value})} className="mt-1" /></div>
            <Button onClick={addManualCarrier} variant="outline"><Plus className="w-4 h-4 mr-2" />Add</Button>
          </div>
          {manualCarriers.length > 0 && (
            <div className="mt-3 space-y-1">
              {manualCarriers.map((c, i) => (
                <div key={i} className="text-sm flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <span>{c.name || '-'}</span>
                  <span className="text-muted-foreground">USDOT: {c.usdot || '-'}</span>
                  <span className="text-muted-foreground">MC: {c.mc || '-'}</span>
                  <button onClick={() => setManualCarriers(manualCarriers.filter((_, idx) => idx !== i))} className="text-red-500 text-xs ml-auto">Remove</button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import button */}
      <Button onClick={handleImport} disabled={importing || (!parsedData && manualCarriers.length === 0)} size="lg" className="w-full">
        {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {importing ? 'Importing...' : `Import ${((parsedData?.length || 0) + manualCarriers.length)} Carriers`}
      </Button>
    </div>
  );
}
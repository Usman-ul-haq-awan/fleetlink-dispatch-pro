import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { Loader2, ArrowLeft, RefreshCw, ExternalLink, AlertCircle, Mail, Phone, UserCheck } from 'lucide-react';

const TABS = [
  'Overview', 'SAFER', 'SMS / CSA', 'Registration', 'Inspections',
  'Crashes', 'Insurance', 'Equipment', 'Contacts', 'Sales',
  'Calls', 'Emails', 'Onboarding', 'Evidence / Sources', 'Activity Log'
];

export default function CarrierDetail() {
  const { id } = useParams();
  const [carrier, setCarrier] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [tabData, setTabData] = useState({});
  const [error, setError] = useState('');

  const loadCarrier = useCallback(async () => {
    try {
      setLoading(true);
      const carriers = await base44.entities.Carrier.filter({ carrier_id: id });
      if (!carriers.length) {
        setError('Carrier not found');
        return;
      }
      setCarrier(carriers[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCarrier();
  }, [loadCarrier]);

  const loadTabData = async (tab) => {
    if (!carrier) return;
    const cid = carrier.carrier_id;
    try {
      const data = {};
      if (tab === 'SMS / CSA') {
        data.basics = await base44.entities.SafetyBasic.filter({ carrier_id: cid });
      } else if (tab === 'Registration') {
        data.registration = await base44.entities.RegistrationDetail.filter({ carrier_id: cid });
      } else if (tab === 'Insurance') {
        data.insurance = await base44.entities.InsuranceRecord.filter({ carrier_id: cid });
      } else if (tab === 'Inspections') {
        data.inspections = await base44.entities.InspectionRecord.filter({ carrier_id: cid });
      } else if (tab === 'Crashes') {
        data.crashes = await base44.entities.CrashRecord.filter({ carrier_id: cid });
      } else if (tab === 'Equipment') {
        data.equipment = await base44.entities.Equipment.filter({ carrier_id: cid });
      } else if (tab === 'Evidence / Sources') {
        data.evidence = await base44.entities.Evidence.filter({ carrier_id: cid }, '-retrieval_date', 200);
      } else if (tab === 'Activity Log') {
        data.activity = await base44.entities.ActivityLog.filter({ carrier_id: cid }, '-timestamp', 100);
      } else if (tab === 'Calls') {
        data.calls = await base44.entities.CallLog.filter({ carrier_id: cid }, '-call_date', 100);
      } else if (tab === 'Emails') {
        data.emails = await base44.entities.EmailLog.filter({ carrier_id: cid }, '-sent_at', 100);
      } else if (tab === 'Onboarding') {
        const onboardings = await base44.entities.Onboarding.filter({ carrier_id: cid });
        data.onboarding = onboardings[0] || null;
      } else if (tab === 'Sales') {
        data.handoffs = await base44.entities.Handoff.filter({ carrier_id: cid });
      }
      setTabData(prev => ({ ...prev, [tab]: data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (carrier) loadTabData(activeTab);
  }, [activeTab, carrier]);

  const handleResearch = async () => {
    try {
      setResearching(true);
      await base44.functions.invoke('researchCarrier', { carrier_id: id });
      await loadCarrier();
    } catch (e) {
      setError(e.message || 'Research failed. Ensure FMCSA API key is configured.');
    } finally {
      setResearching(false);
    }
  };

  const handleStatusChange = async (field, value) => {
    try {
      await base44.entities.Carrier.update(carrier.id, { [field]: value });
      setCarrier({ ...carrier, [field]: value });
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error && !carrier) {
    return (
      <div className="space-y-4">
        <Link to="/carriers"><Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Back to Carriers</Button></Link>
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!carrier) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/carriers"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">{carrier.legal_name || 'Unknown Carrier'}</h1>
          {carrier.dba_name && <p className="text-sm text-muted-foreground">DBA: {carrier.dba_name}</p>}
        </div>
        <Button onClick={handleResearch} disabled={researching}>
          {researching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {researching ? 'Researching...' : 'Re-Research'}
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {/* Summary bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">USDOT</p><p className="font-mono font-medium">{carrier.usdot_number || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">MC</p><p className="font-mono font-medium">{carrier.mc_number || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Op Status</p><p className="font-medium">{carrier.operating_status || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Equipment</p><p className="font-medium text-xs">{carrier.equipment_types || 'Unknown'}</p></div>
            <div><p className="text-xs text-muted-foreground">Safety</p><div className="mt-0.5"><StatusBadge status={carrier.safety_qualification} /></div></div>
            <div><p className="text-xs text-muted-foreground">Lead Score</p><p className="font-medium">{carrier.lead_score || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Lead Status</p><div className="mt-0.5"><StatusBadge status={carrier.lead_status} /></div></div>
            <div><p className="text-xs text-muted-foreground">Data Complete</p><p className="font-medium text-xs">{carrier.data_completeness || '-'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <TabContent tab={activeTab} carrier={carrier} tabData={tabData[activeTab] || {}} onStatusChange={handleStatusChange} onReload={() => loadTabData(activeTab)} />
    </div>
  );
}

function TabContent({ tab, carrier, tabData, onStatusChange, onReload }) {
  if (tab === 'Overview') return <OverviewTab carrier={carrier} onStatusChange={onStatusChange} />;
  if (tab === 'SAFER') return <SaferTab carrier={carrier} />;
  if (tab === 'SMS / CSA') return <SmsTab data={tabData} />;
  if (tab === 'Registration') return <RegistrationTab data={tabData} />;
  if (tab === 'Inspections') return <InspectionsTab data={tabData} />;
  if (tab === 'Crashes') return <CrashesTab data={tabData} />;
  if (tab === 'Insurance') return <InsuranceTab data={tabData} />;
  if (tab === 'Equipment') return <EquipmentTab carrier={carrier} data={tabData} onReload={onReload} />;
  if (tab === 'Contacts') return <ContactsTab carrier={carrier} onStatusChange={onStatusChange} />;
  if (tab === 'Sales') return <SalesTab carrier={carrier} data={tabData} />;
  if (tab === 'Calls') return <CallsTab carrier={carrier} data={tabData} />;
  if (tab === 'Emails') return <EmailsTab carrier={carrier} data={tabData} />;
  if (tab === 'Onboarding') return <OnboardingTab carrier={carrier} data={tabData} onReload={onReload} />;
  if (tab === 'Evidence / Sources') return <EvidenceTab data={tabData} />;
  if (tab === 'Activity Log') return <ActivityTab data={tabData} />;
  return null;
}

function FieldRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value || 'Not Found'}</span>
    </div>
  );
}

function OverviewTab({ carrier, onStatusChange }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Company Information</CardTitle></CardHeader>
        <CardContent>
          <FieldRow label="Legal Name" value={carrier.legal_name} />
          <FieldRow label="DBA" value={carrier.dba_name} />
          <FieldRow label="USDOT" value={carrier.usdot_number} />
          <FieldRow label="MC" value={carrier.mc_number} />
          <FieldRow label="MX" value={carrier.mx_number} />
          <FieldRow label="Operating Status" value={carrier.operating_status} />
          <FieldRow label="Carrier Type" value={carrier.carrier_type} />
          <FieldRow label="Entity Type" value={carrier.entity_type} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Location & Fleet</CardTitle></CardHeader>
        <CardContent>
          <FieldRow label="Address" value={carrier.address} />
          <FieldRow label="City" value={carrier.city} />
          <FieldRow label="State" value={carrier.state} />
          <FieldRow label="ZIP" value={carrier.zip} />
          <FieldRow label="Country" value={carrier.country} />
          <FieldRow label="Power Units" value={carrier.power_units} />
          <FieldRow label="Drivers" value={carrier.drivers} />
          <FieldRow label="Cargo Types" value={carrier.cargo_types} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Safety Qualification</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3"><StatusBadge status={carrier.safety_qualification} /></div>
          {carrier.safety_reasons && <p className="text-sm mb-2"><span className="font-medium">Reasons:</span> {carrier.safety_reasons}</p>}
          {carrier.safety_positive_indicators && <p className="text-sm mb-2 text-green-700"><span className="font-medium">Positive:</span> {carrier.safety_positive_indicators}</p>}
          {carrier.safety_risk_flags && <p className="text-sm mb-2 text-red-700"><span className="font-medium">Risk Flags:</span> {carrier.safety_risk_flags}</p>}
          <p className="text-xs text-muted-foreground mt-3 italic">
            Disclaimer: FMCSA/SMS data should not be treated as an absolute guarantee of safety. Data reflects reviewed periods only.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Lead Score & Status</CardTitle></CardHeader>
        <CardContent>
          <FieldRow label="Lead Score" value={carrier.lead_score} />
          {carrier.lead_score_reasons && <p className="text-sm mt-2"><span className="font-medium">Reasons:</span> {carrier.lead_score_reasons}</p>}
          <div className="mt-3">
            <Label className="text-xs">Lead Status</Label>
            <select
              className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm"
              value={carrier.lead_status || ''}
              onChange={(e) => onStatusChange('lead_status', e.target.value)}
            >
              {['Imported','Queued','Researching','Qualified','Needs Review','Failed','Ready for Outreach','Contacted','Interested','Human Handoff','Onboarding','Active Client','Do Not Contact'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <Label className="text-xs">Do Not Contact</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={carrier.do_not_contact || false} onChange={(e) => onStatusChange('do_not_contact', e.target.checked)} />
              <span className="text-sm">{carrier.dnc_reason || 'Flag as Do Not Contact'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SaferTab({ carrier }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">SAFER Company Snapshot</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {carrier.safer_url && (
          <a href={carrier.safer_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ExternalLink className="w-4 h-4" /> View on FMCSA SAFER
          </a>
        )}
        <div className="grid md:grid-cols-2 gap-x-8">
          <FieldRow label="Legal Name" value={carrier.legal_name} />
          <FieldRow label="DBA" value={carrier.dba_name} />
          <FieldRow label="USDOT" value={carrier.usdot_number} />
          <FieldRow label="MC/MX" value={carrier.mc_number} />
          <FieldRow label="Operating Status" value={carrier.operating_status} />
          <FieldRow label="Phone" value={carrier.phone} />
          <FieldRow label="Power Units" value={carrier.power_units} />
          <FieldRow label="Drivers" value={carrier.drivers} />
          <FieldRow label="Address" value={`${carrier.address || ''}, ${carrier.city || ''}, ${carrier.state || ''} ${carrier.zip || ''}`} />
          <FieldRow label="Cargo Types" value={carrier.cargo_types} />
          <FieldRow label="Carrier Type" value={carrier.carrier_type} />
          <FieldRow label="Safety Rating" value={carrier.safety_rating} />
        </div>
        <FieldRow label="Last Researched" value={carrier.last_researched_at ? new Date(carrier.last_researched_at).toLocaleString() : 'Not researched'} />
      </CardContent>
    </Card>
  );
}

function SmsTab({ data }) {
  const basics = data.basics || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">SMS / CSA BASIC Data</CardTitle></CardHeader>
      <CardContent>
        {basics.length === 0 ? (
          <p className="text-sm text-muted-foreground">No SMS/BASIC data available. Run research to retrieve.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">BASIC Category</th>
                <th className="text-left px-3 py-2">Percentile</th>
                <th className="text-left px-3 py-2">Violations</th>
                <th className="text-left px-3 py-2">Indicator</th>
                <th className="text-left px-3 py-2">Data Date</th>
              </tr>
            </thead>
            <tbody>
              {basics.map(b => (
                <tr key={b.id} className="border-b border-border">
                  <td className="px-3 py-2">{b.basic_category}</td>
                  <td className="px-3 py-2">{b.on_road_percentile || '-'}</td>
                  <td className="px-3 py-2">{b.violation_count || 0}</td>
                  <td className="px-3 py-2"><StatusBadge status={b.deficiency_indicator} /></td>
                  <td className="px-3 py-2 text-xs">{b.data_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-muted-foreground mt-4 italic">
          Note: "No crashes identified in reviewed data" is not equivalent to "never had an accident."
        </p>
      </CardContent>
    </Card>
  );
}

function RegistrationTab({ data }) {
  const reg = data.registration || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Registration Details</CardTitle></CardHeader>
      <CardContent>
        {reg.length === 0 ? (
          <p className="text-sm text-muted-foreground">No registration details available.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="text-left px-3 py-2">Field</th><th className="text-left px-3 py-2">Value</th><th className="text-left px-3 py-2">Source</th></tr>
            </thead>
            <tbody>
              {reg.map(r => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-3 py-2 font-medium">{r.field_label}</td>
                  <td className="px-3 py-2">{r.field_value}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function InspectionsTab({ data }) {
  const insp = data.inspections || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Inspection Records</CardTitle></CardHeader>
      <CardContent>
        {insp.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inspection data available. Run research to retrieve from FMCSA.</p>
        ) : (
          insp.map(i => (
            <div key={i.id} className="border-b border-border py-3 last:border-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <FieldRow label="Type" value={i.inspection_type} />
                <FieldRow label="Total" value={i.total_inspections} />
                <FieldRow label="With Violations" value={i.inspections_with_violations} />
                <FieldRow label="OOS" value={i.out_of_service_count} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CrashesTab({ data }) {
  const crashes = data.crashes || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Crash Records</CardTitle></CardHeader>
      <CardContent>
        {crashes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No crash data retrieved. This means "No crashes identified in reviewed data" — not "never had an accident."</p>
        ) : (
          crashes.map(c => (
            <div key={c.id} className="border-b border-border py-3 last:border-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <FieldRow label="Total Crashes" value={c.total_crashes} />
                <FieldRow label="Fatal" value={c.fatal_crashes} />
                <FieldRow label="Injury" value={c.injury_crashes} />
                <FieldRow label="Towaway" value={c.towaway_crashes} />
              </div>
              {c.data_period && <p className="text-xs text-muted-foreground mt-1">Period: {c.data_period}</p>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function InsuranceTab({ data }) {
  const ins = data.insurance || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Licensing & Insurance</CardTitle></CardHeader>
      <CardContent>
        {ins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insurance records available. Run research to retrieve from FMCSA.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Company</th>
                <th className="text-left px-3 py-2">Policy #</th>
                <th className="text-left px-3 py-2">Coverage</th>
                <th className="text-left px-3 py-2">Effective</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {ins.map(i => (
                <tr key={i.id} className="border-b border-border">
                  <td className="px-3 py-2">{i.insurance_type || '-'}</td>
                  <td className="px-3 py-2">{i.insurance_company || '-'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{i.policy_number || '-'}</td>
                  <td className="px-3 py-2">{i.coverage_amount || '-'}</td>
                  <td className="px-3 py-2 text-xs">{i.effective_date || '-'}</td>
                  <td className="px-3 py-2">{i.authority_status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function EquipmentTab({ carrier, data, onReload }) {
  const equipment = data.equipment || [];
  const [newEquip, setNewEquip] = useState({ equipment_type: 'Dry Van', quantity: 1, evidence: '', evidence_url: '', confidence: 'Medium' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    try {
      setSaving(true);
      await base44.entities.Equipment.create({
        carrier_id: carrier.carrier_id,
        ...newEquip,
        quantity: parseInt(newEquip.quantity) || 1,
        source: 'Manual entry',
        date_verified: new Date().toISOString(),
      });
      setNewEquip({ equipment_type: 'Dry Van', quantity: 1, evidence: '', evidence_url: '', confidence: 'Medium' });
      onReload();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Equipment Intelligence</CardTitle></CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">No equipment records. Add equipment with evidence below.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Qty</th>
                  <th className="text-left px-3 py-2">Evidence</th>
                  <th className="text-left px-3 py-2">Confidence</th>
                  <th className="text-left px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map(e => (
                  <tr key={e.id} className="border-b border-border">
                    <td className="px-3 py-2 font-medium">{e.equipment_type}</td>
                    <td className="px-3 py-2">{e.quantity || '-'}</td>
                    <td className="px-3 py-2 text-xs">{e.evidence || '-'}</td>
                    <td className="px-3 py-2"><StatusBadge status={e.confidence} /></td>
                    <td className="px-3 py-2 text-xs">
                      {e.evidence_url ? <a href={e.evidence_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a> : e.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground mt-3 italic">
            Never infer equipment type solely from cargo type. Equipment must have evidence.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Equipment Record</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Equipment Type</Label>
              <select className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm" value={newEquip.equipment_type} onChange={e => setNewEquip({...newEquip, equipment_type: e.target.value})}>
                {['Dry Van','Reefer','Flatbed','Step Deck','Conestoga','Power Only','Hotshot','Box Truck','Straight Truck','Tanker','Car Hauler','Dump','Specialized','Other','Unknown'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input type="number" value={newEquip.quantity} onChange={e => setNewEquip({...newEquip, quantity: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Confidence</Label>
              <select className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm" value={newEquip.confidence} onChange={e => setNewEquip({...newEquip, confidence: e.target.value})}>
                {['High','Medium','Low','Unknown'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Evidence Description</Label>
              <Input value={newEquip.evidence} onChange={e => setNewEquip({...newEquip, evidence: e.target.value})} placeholder="e.g. Carrier website fleet page lists 5 dry vans" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Evidence URL</Label>
              <Input value={newEquip.evidence_url} onChange={e => setNewEquip({...newEquip, evidence_url: e.target.value})} placeholder="https://..." className="mt-1" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving} className="mt-3">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Add Equipment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactsTab({ carrier, onStatusChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    owner_name: carrier.owner_name || '',
    contact_name: carrier.contact_name || '',
    contact_title: carrier.contact_title || '',
    phone: carrier.phone || '',
    fax: carrier.fax || '',
    email: carrier.email || '',
    website: carrier.website || '',
  });

  const handleSave = async () => {
    try {
      await base44.entities.Carrier.update(carrier.id, form);
      Object.entries(form).forEach(([k, v]) => onStatusChange(k, v));
      setEditing(false);
    } catch (e) { console.error(e); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contact Intelligence</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-x-8">
          {['owner_name','contact_name','contact_title','phone','fax','email','website'].map(f => (
            <div key={f} className="py-2 border-b border-border last:border-0">
              <p className="text-xs text-muted-foreground capitalize">{f.replace(/_/g, ' ')}</p>
              {editing ? (
                <Input value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})} className="mt-1 h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{carrier[f] || 'Not Found'}</p>
              )}
            </div>
          ))}
        </div>
        {editing && <Button onClick={handleSave} className="mt-3">Save Changes</Button>}
      </CardContent>
    </Card>
  );
}

function SalesTab({ carrier, data }) {
  const handoffs = data.handoffs || [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Sales Lead Score</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl font-bold">{carrier.lead_score || 0}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          {carrier.lead_score_reasons && (
            <div className="text-sm space-y-1">
              {carrier.lead_score_reasons.split(';').map((r, i) => <p key={i}>• {r}</p>)}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Handoff Records</CardTitle></CardHeader>
        <CardContent>
          {handoffs.length === 0 ? <p className="text-sm text-muted-foreground">No handoffs yet.</p> : (
            handoffs.map(h => (
              <div key={h.id} className="border-b border-border py-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={h.status} />
                  {h.is_hot_lead && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">HOT LEAD</span>}
                </div>
                <p className="text-sm">{h.notes}</p>
                <p className="text-xs text-muted-foreground">Next action: {h.next_action || 'None'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CallsTab({ carrier, data }) {
  const calls = data.calls || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Call History</CardTitle></CardHeader>
      <CardContent>
        {calls.length === 0 ? <p className="text-sm text-muted-foreground">No calls logged.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Phone</th><th className="text-left px-3 py-2">Outcome</th><th className="text-left px-3 py-2">Notes</th></tr>
            </thead>
            <tbody>
              {calls.map(c => (
                <tr key={c.id} className="border-b border-border">
                  <td className="px-3 py-2 text-xs">{c.call_date ? new Date(c.call_date).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">{c.phone_number || '-'}</td>
                  <td className="px-3 py-2"><StatusBadge status={c.outcome} /></td>
                  <td className="px-3 py-2 text-xs">{c.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function EmailsTab({ carrier, data }) {
  const emails = data.emails || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Email History</CardTitle></CardHeader>
      <CardContent>
        {emails.length === 0 ? <p className="text-sm text-muted-foreground">No emails logged.</p> : (
          <div className="space-y-3">
            {emails.map(e => (
              <div key={e.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={e.status} />
                  {e.is_follow_up && <span className="text-xs text-muted-foreground">Follow-up #{e.follow_up_number}</span>}
                </div>
                <p className="text-sm font-medium">{e.subject}</p>
                <p className="text-xs text-muted-foreground">To: {e.to_email} • {e.sent_at ? new Date(e.sent_at).toLocaleString() : 'Queued'}</p>
                {e.error_message && <p className="text-xs text-red-600 mt-1">{e.error_message}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OnboardingTab({ carrier, data, onReload }) {
  const onboarding = data.onboarding;
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (onboarding) setForm(onboarding);
  }, [onboarding]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await base44.entities.Onboarding.create({
        carrier_id: carrier.carrier_id,
        onboarding_status: 'New',
        dispatch_agreement: false, carrier_documents: false, w9_received: false,
        insurance_verified: false, operating_authority_verified: false, equipment_confirmed: false,
      });
      onReload();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = { ...form };
      delete updates.id; delete updates.created_at; delete updates.updated_date;
      await base44.entities.Onboarding.update(onboarding.id, updates);
      onReload();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (!onboarding) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">No onboarding record yet.</p>
          <Button onClick={handleCreate} disabled={saving}>Start Onboarding</Button>
        </CardContent>
      </Card>
    );
  }

  if (!form) return null;

  const checklistItems = ['dispatch_agreement','carrier_documents','w9_received','insurance_verified','operating_authority_verified','equipment_confirmed'];

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Onboarding Checklist</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Onboarding Status</Label>
          <select className="w-full h-9 px-3 mt-1 rounded-lg border border-input bg-background text-sm" value={form.onboarding_status || 'New'} onChange={e => setForm({...form, onboarding_status: e.target.value})}>
            {['New','Contacted','Documents Requested','Documents Received','Under Review','Ready for Dispatch','Active Client','Lost'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {checklistItems.map(item => (
            <label key={item} className="flex items-center gap-2 text-sm border border-border rounded-lg p-3">
              <input type="checkbox" checked={form[item] || false} onChange={e => setForm({...form, [item]: e.target.checked})} />
              <span className="capitalize">{item.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Preferred Lanes</Label><Input value={form.preferred_lanes || ''} onChange={e => setForm({...form, preferred_lanes: e.target.value})} className="mt-1" /></div>
          <div><Label className="text-xs">Home Time</Label><Input value={form.home_time || ''} onChange={e => setForm({...form, home_time: e.target.value})} className="mt-1" /></div>
          <div><Label className="text-xs">Rate Preferences</Label><Input value={form.rate_preferences || ''} onChange={e => setForm({...form, rate_preferences: e.target.value})} className="mt-1" /></div>
          <div><Label className="text-xs">Factoring Info</Label><Input value={form.factoring_info || ''} onChange={e => setForm({...form, factoring_info: e.target.value})} className="mt-1" /></div>
          <div><Label className="text-xs">Broker Requirements</Label><Input value={form.broker_requirements || ''} onChange={e => setForm({...form, broker_requirements: e.target.value})} className="mt-1" /></div>
          <div><Label className="text-xs">Dispatch Start Date</Label><Input type="date" value={form.dispatch_start_date || ''} onChange={e => setForm({...form, dispatch_start_date: e.target.value})} className="mt-1" /></div>
        </div>
        <Textarea placeholder="Checklist notes..." value={form.checklist_notes || ''} onChange={e => setForm({...form, checklist_notes: e.target.value})} />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Onboarding
        </Button>
      </CardContent>
    </Card>
  );
}

function EvidenceTab({ data }) {
  const evidence = data.evidence || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Evidence / Sources ({evidence.length})</CardTitle></CardHeader>
      <CardContent>
        {evidence.length === 0 ? <p className="text-sm text-muted-foreground">No evidence records.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Field</th>
                <th className="text-left px-3 py-2">Value</th>
                <th className="text-left px-3 py-2">Source</th>
                <th className="text-left px-3 py-2">Confidence</th>
                <th className="text-left px-3 py-2">Retrieved</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map(ev => (
                <tr key={ev.id} className="border-b border-border">
                  <td className="px-3 py-2 font-medium">{ev.field_name}</td>
                  <td className="px-3 py-2 text-xs max-w-xs truncate">{ev.field_value}</td>
                  <td className="px-3 py-2 text-xs">
                    {ev.source_name}
                    {ev.source_url && <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline truncate">{ev.source_page}</a>}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={ev.confidence} /></td>
                  <td className="px-3 py-2 text-xs">{ev.retrieval_date ? new Date(ev.retrieval_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityTab({ data }) {
  const activity = data.activity || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
      <CardContent>
        {activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded.</p> : (
          <div className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 text-sm py-2 border-b border-border last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.status === 'Error' ? 'bg-red-500' : a.status === 'Success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.action}</p>
                  {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
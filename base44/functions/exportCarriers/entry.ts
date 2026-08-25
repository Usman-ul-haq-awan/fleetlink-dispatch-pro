import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let statusFilter = '';
    try {
      const body = await req.json();
      statusFilter = body.status || '';
    } catch {
      const url = new URL(req.url);
      statusFilter = url.searchParams.get('status') || '';
    }

    const db = base44.asServiceRole;
    const query: any = {};
    if (statusFilter) query.lead_status = statusFilter;

    const carriers = await db.entities.Carrier.filter(query, '-created_date', 2000);

    // Get evidence for source URLs
    const allEvidence = await db.entities.Evidence.filter({}, '-retrieval_date', 5000);
    const evidenceByCarrier: Record<string, string> = {};
    for (const ev of allEvidence) {
      if (!evidenceByCarrier[ev.carrier_id]) {
        evidenceByCarrier[ev.carrier_id] = ev.source_url || '';
      } else {
        evidenceByCarrier[ev.carrier_id] += ' | ' + (ev.source_url || '');
      }
    }

    const headers = [
      'Carrier Name', 'DBA', 'USDOT', 'MC', 'MX', 'Status', 'Address',
      'City', 'State', 'Zip', 'Phone', 'Fax', 'Email', 'Owner', 'Contact',
      'Power Units', 'Drivers', 'Cargo', 'Carrier Segment', 'Equipment Type',
      'Equipment Confidence', 'Safety Qualification', 'Safety Rating',
      'Total Crashes', 'Fatal Crashes', 'Injury Crashes', 'Towaway Crashes',
      'Insurance Company', 'Lead Score', 'Lead Status', 'Source URLs', 'Last Verified',
    ];

    function csvEscape(val: any): string {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }

    const rows: string[] = [];
    rows.push(headers.join(','));

    for (const c of carriers) {
      const row = [
        c.legal_name, c.dba_name, c.usdot_number, c.mc_number, c.mx_number,
        c.operating_status, c.address, c.city, c.state, c.zip,
        c.phone, c.fax, c.email, c.owner_name, c.contact_name,
        c.power_units, c.drivers, c.cargo_types, c.carrier_segment,
        c.equipment_types, '', c.safety_qualification, c.safety_rating,
        '', '', '', '', '',
        c.lead_score, c.lead_status,
        evidenceByCarrier[c.carrier_id] || c.safer_url || '',
        c.last_researched_at || '',
      ].map(csvEscape).join(',');
      rows.push(row);
    }

    const csv = rows.join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=carriers_export_${Date.now()}.csv`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
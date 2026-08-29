import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || "";
    const minScore = url.searchParams.get("min_score") || "";

    // Query carriers
    let carriers;
    if (statusFilter) {
      carriers = await base44.entities.Carrier.filter({ lead_status: statusFilter }, "-updated_date", 500);
    } else {
      carriers = await base44.entities.Carrier.list("-updated_date", 500);
    }

    // Filter by min score if provided
    if (minScore) {
      const min = parseInt(minScore, 10);
      carriers = carriers.filter(c => (c.lead_score || 0) >= min);
    }

    // Get evidence records for source URLs
    const carrierIds = carriers.map(c => c.id);
    const allEvidence = await base44.entities.Evidence.list("-retrieval_date", 500);
    const evidenceByCarrier: Record<string, string[]> = {};
    allEvidence.forEach(e => {
      if (carrierIds.includes(e.carrier_id) && e.source_url) {
        if (!evidenceByCarrier[e.carrier_id]) evidenceByCarrier[e.carrier_id] = [];
        if (!evidenceByCarrier[e.carrier_id].includes(e.source_url)) {
          evidenceByCarrier[e.carrier_id].push(e.source_url);
        }
      }
    });

    // Build CSV
    const headers = [
      "Staff Lead Status", "Staff Comment", "Allocated On",
      "Carrier Name", "DBA", "USDOT", "MC", "MX", "Status", "Operating Status",
      "Address", "City", "State", "ZIP", "Phone", "Fax", "Email", "Owner", "Contact",
      "Power Units", "Drivers", "Cargo", "Carrier Segment",
      "Equipment Type", "Safety Qualification", "Safety Rating",
      "Total Inspections", "OOS Info", "Total Crashes", "Fatal Crashes", "Injury Crashes", "Towaway Crashes",
      "Lead Score", "Lead Status", "Source URLs", "Last Verified",
    ];

    const rows = carriers.map(c => [
      Array.isArray(c.staff_lead_status) ? c.staff_lead_status.join(" | ") : (c.staff_lead_status || ""), c.staff_comment || "", c.assigned_date || "",
      c.legal_name || "", c.dba_name || "", c.usdot_number || "", c.mc_number || "", c.mx_number || "",
      c.lead_status || "", c.operating_status || "",
      c.address || "", c.city || "", c.state || "", c.zip || "",
      c.phone || "", c.fax || "", c.email || "", c.owner_name || "", c.contact_name || "",
      c.power_units ?? "", c.drivers ?? "", c.cargo_types || "", c.carrier_segment || "",
      c.equipment_types || "", c.safety_qualification || "", c.safety_rating || "",
      "", "", "", "", "", "", // Inspection/crash data would be joined from related entities
      c.lead_score ?? "", c.lead_status || "",
      (evidenceByCarrier[c.id] || []).join(" | "),
      c.last_researched_at || "",
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(csvEscape).join(","))
      .join("\n");

    await base44.entities.ActivityLog.create({
      action: "Carrier data exported",
      workflow: "exportCarriers",
      details: `Exported ${carriers.length} carriers to CSV`,
      status: "Success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      csv,
      filename: `carriers_export_${new Date().toISOString().split("T")[0]}.csv`,
      count: carriers.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
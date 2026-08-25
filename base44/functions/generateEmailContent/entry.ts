import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { carrier_id, campaign_id } = body;

    if (!carrier_id) return Response.json({ error: "carrier_id is required" }, { status: 400 });

    const carrier = await base44.entities.Carrier.get(carrier_id);
    if (!carrier) return Response.json({ error: "Carrier not found" }, { status: 404 });

    // Get company settings for personalization
    const settings = await base44.entities.AppSetting.filter({});
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

    const companyName = settingsMap["company_name"] || "Our Dispatch Team";
    const serviceDescription = settingsMap["dispatch_service_description"] || "professional dispatch services";
    const emailSignature = settingsMap["email_signature"] || `Best regards,\n${companyName}`;

    // Build the LLM prompt with carrier data
    const prompt = `You are writing a personalized B2B sales email from a truck dispatching company to a trucking carrier.

COMPANY (sender): ${companyName}
SERVICE: ${serviceDescription}

CARRIER INFORMATION:
- Legal Name: ${carrier.legal_name || "Unknown"}
- DBA: ${carrier.dba_name || "None"}
- USDOT: ${carrier.usdot_number || "Unknown"}
- MC: ${carrier.mc_number || "Unknown"}
- Location: ${[carrier.city, carrier.state].filter(Boolean).join(", ") || "Unknown"}
- Owner: ${carrier.owner_name || "Unknown"}
- Contact: ${carrier.contact_name || "Unknown"}
- Equipment: ${carrier.equipment_types || "Unknown"}
- Power Units: ${carrier.power_units || "Unknown"}
- Cargo Types: ${carrier.cargo_types || "Unknown"}
- Safety Qualification: ${carrier.safety_qualification || "Not Assessed"}

RULES:
1. Do NOT claim we personally verified any information we did not verify.
2. Do NOT make safety claims about the carrier.
3. Keep the email concise (150-250 words).
4. Be professional and respectful.
5. Address the owner or contact by name if available.
6. Reference their equipment type and location if available.
7. Explain how our dispatch service can help them find more loads.
8. Include a clear call to action (reply or call).
9. End with the signature provided below.

SIGNATURE:
${emailSignature}

Generate a JSON object with:
{
  "subject": "Email subject line (personalized, under 60 characters)",
  "body": "Full email body text (plain text, with line breaks, including the signature)"
}`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["subject", "body"],
      },
    });

    await base44.entities.ActivityLog.create({
      carrier_id: carrier_id,
      action: "Email content generated",
      workflow: "generateEmailContent",
      details: `Subject: ${(llmResult as any).subject || ""}`,
      status: "Success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      subject: (llmResult as any).subject || "",
      body: (llmResult as any).body || "",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
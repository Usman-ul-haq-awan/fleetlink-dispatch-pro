import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { carrier_id, campaign_id } = body;

    if (!carrier_id) return Response.json({ error: 'carrier_id required' }, { status: 400 });

    const db = base44.asServiceRole;
    const carriers = await db.entities.Carrier.filter({ carrier_id });
    if (!carriers.length) return Response.json({ error: 'Carrier not found' }, { status: 404 });
    const carrier = carriers[0];

    // Get settings
    const settings = await db.entities.AppSetting.filter({});
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.setting_key] = s.setting_value;

    const companyName = settingsMap['company_name'] || 'Your Dispatch Co';
    const serviceDesc = settingsMap['dispatch_service_description'] || 'professional dispatch services';
    const emailSig = settingsMap['email_signature'] || `Best regards,\n${companyName}`;

    // Get campaign template if specified
    let templateSubject = "Dispatch Services Available for {{company_name}}";
    let templateBody = `Hi {{contact_first}},

I hope this message finds you well. I'm reaching out from ${companyName} regarding dispatch services for your fleet.

We specialize in ${serviceDesc}, and based on your operation ({{equipment}}, {{state}}), I believe we could help keep your trucks loaded and on the road.

Would you be open to a brief conversation about how we can support {{company_name}}?

${emailSig}`;

    if (campaign_id) {
      const campaigns = await db.entities.EmailCampaign.filter({ _id: campaign_id });
      if (campaigns.length) {
        templateSubject = campaigns[0].template_subject || templateSubject;
        templateBody = campaigns[0].template_body || templateBody;
      }
    }

    // Build context for LLM
    const contactFirst = carrier.contact_name?.split(' ')[0] || carrier.owner_name?.split(' ')[0] || 'there';
    const context = {
      company_name: carrier.legal_name || carrier.dba_name || 'your company',
      contact_first: contactFirst,
      contact_name: carrier.contact_name || carrier.owner_name || '',
      equipment: carrier.equipment_types || 'your equipment',
      state: carrier.state || '',
      city: carrier.city || '',
      power_units: carrier.power_units || '',
      usdot: carrier.usdot_number || '',
      mc: carrier.mc_number || '',
      cargo: carrier.cargo_types || '',
    };

    // Generate personalized email using LLM
    const prompt = `You are a professional dispatch sales representative. Write a personalized outreach email to a truck carrier.

Carrier details:
- Company: ${context.company_name}
- Contact: ${context.contact_name || context.contact_first}
- Location: ${context.city}, ${context.state}
- Equipment: ${context.equipment}
- Power Units: ${context.power_units}
- Cargo Types: ${context.cargo}
- USDOT: ${context.usdot}
- MC: ${context.mc}

Our company: ${companyName}
Our service: ${serviceDesc}

Rules:
- Be professional, concise, and genuine
- Do NOT claim we verified their safety record or inspected their equipment
- Do NOT make safety claims
- Reference their specific equipment and location naturally
- Keep it under 150 words
- End with: ${emailSig}

Return JSON with "subject" and "body" fields.`;

    const llmResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['subject', 'body'],
      },
    });

    const emailContent = llmResp as any;

    return Response.json({
      subject: emailContent.subject || templateSubject,
      body: emailContent.body || templateBody,
      carrier_id,
      context,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
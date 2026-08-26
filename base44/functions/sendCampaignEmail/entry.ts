import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { sendEmail } from "../../shared/emailSender.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { carrier_id, campaign_id, subject, body: emailBody, to_email } = body;

    if (!carrier_id) return Response.json({ error: "carrier_id is required" }, { status: 400 });

    const carrier = await base44.entities.Carrier.get(carrier_id);
    if (!carrier) return Response.json({ error: "Carrier not found" }, { status: 404 });

    const recipientEmail = to_email || carrier.email;
    if (!recipientEmail) return Response.json({ error: "No email address available for this carrier" }, { status: 400 });

    if (carrier.do_not_contact) {
      return Response.json({ error: "Carrier is marked Do Not Contact" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Get campaign settings if available
    let fromName = "Dispatch Team";
    if (campaign_id) {
      const campaign = await base44.entities.EmailCampaign.get(campaign_id);
      if (campaign) {
        // Use campaign template if subject/body not provided
        const settings = await base44.entities.AppSetting.filter({ setting_key: "company_name" });
        if (settings.length > 0) fromName = settings[0].setting_value;
      }
    }

    // Send via company SMTP only — never fall back to the built-in email service
    const sendResult = await sendEmail(base44, {
      to: recipientEmail,
      subject: subject || `Dispatch Services for ${carrier.legal_name || carrier.dba_name || "your company"}`,
      body: emailBody || "",
      fromName,
      requireSmtp: true,
    });

    // Create email log
    await base44.entities.EmailLog.create({
      carrier_id: carrier_id,
      campaign_id: campaign_id || "",
      to_email: recipientEmail,
      subject: subject || "",
      body: emailBody || "",
      direction: "Outbound",
      status: "Sent",
      sent_at: now,
    });

    // Update carrier status
    await base44.entities.Carrier.update(carrier_id, {
      lead_status: "Contacted",
    });

    // Update campaign stats if applicable
    if (campaign_id) {
      const campaign = await base44.entities.EmailCampaign.get(campaign_id);
      if (campaign) {
        await base44.entities.EmailCampaign.update(campaign_id, {
          total_sent: (campaign.total_sent || 0) + 1,
        });
      }
    }

    // Create activity log
    await base44.entities.ActivityLog.create({
      carrier_id: carrier_id,
      action: "Email sent",
      workflow: "sendCampaignEmail",
      details: `Subject: ${subject || ""}. To: ${recipientEmail}`,
      status: "Success",
      timestamp: now,
    });

    return Response.json({ success: true, message: "Email sent", to: recipientEmail });
  } catch (error) {
    // Log the failure
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.json().catch(() => ({}));
      if (body.carrier_id) {
        await base44.entities.EmailLog.create({
          carrier_id: body.carrier_id,
          campaign_id: body.campaign_id || "",
          to_email: body.to_email || "",
          subject: body.subject || "",
          body: body.body || "",
          status: "Failed",
          error_message: error.message,
        });
        await base44.entities.ActivityLog.create({
          carrier_id: body.carrier_id,
          action: "Email send failed",
          workflow: "sendCampaignEmail",
          details: error.message,
          status: "Error",
          timestamp: new Date().toISOString(),
        });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}
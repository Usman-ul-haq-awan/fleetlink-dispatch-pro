import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { sendEmail } from "../../shared/emailSender.ts";

// Test email protocol — sends to ANY address (your own inbox) to verify the
// email pipeline works. Does NOT require a carrier and does NOT change any
// carrier's lead_status, so it's safe to use while validating deliverability
// before pointing campaigns at real scraped carrier emails.
export default async function sendTestEmail(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { to_email, subject, body: emailBody, carrier_id } = body;

    if (!to_email) return Response.json({ error: "to_email is required" }, { status: 400 });
    if (!subject) return Response.json({ error: "subject is required" }, { status: 400 });

    // Use company name as sender if configured
    const settings = await base44.entities.AppSetting.filter({ setting_key: "company_name" });
    const fromName = settings.length > 0 && settings[0].setting_value
      ? settings[0].setting_value
      : "Dispatch Team";

    const now = new Date().toISOString();

    const sendResult = await sendEmail(base44, {
      to: to_email,
      subject,
      body: emailBody || "",
      fromName,
      requireSmtp: true,
    });

    // Log the test send (carrier_id optional, only for traceability)
    await base44.entities.EmailLog.create({
      carrier_id: carrier_id || "",
      to_email,
      subject,
      body: emailBody || "",
      direction: "Outbound",
      status: "Sent",
      sent_at: now,
    });

    await base44.entities.ActivityLog.create({
      carrier_id: carrier_id || "",
      action: "Test email sent",
      workflow: "sendTestEmail",
      details: `To: ${to_email} · Subject: ${subject}`,
      status: "Success",
      timestamp: now,
    });

    return Response.json({ success: true, message: "Test email sent", to: to_email });
  } catch (error) {
    // Record the failure so it shows in the delivery log
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.json().catch(() => ({}));
      if (body.to_email) {
        await base44.entities.EmailLog.create({
          carrier_id: body.carrier_id || "",
          to_email: body.to_email,
          subject: body.subject || "",
          body: body.body || "",
          direction: "Outbound",
          status: "Failed",
          error_message: error.message,
        });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}
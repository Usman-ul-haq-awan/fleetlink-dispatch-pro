import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { wrapBodyAsHtml } from "../../shared/emailHtmlWrapper.ts";

// Staff Sales Email — lets any staff member send a sales email to a carrier
// from the company sales address (e.g. sales@tycoonlogistics.online). The sender
// identity + CC are read from the "Staff Sales Email" settings group configured
// by admins in Settings. Staff sending can be disabled by the admin.
export default async function sendStaffSalesEmail(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { to_email, subject, body: emailBody, carrier_id, cc, bcc, branded } = body;

    if (!to_email) return Response.json({ error: "to_email is required" }, { status: 400 });
    if (!subject) return Response.json({ error: "subject is required" }, { status: 400 });

    // Read staff sales email configuration (admin-managed in Settings).
    const staffSettings = await base44.entities.AppSetting.filter({ setting_category: "staff_sales" });
    const map: Record<string, string> = {};
    staffSettings.forEach((s: any) => { map[s.setting_key] = s.setting_value; });

    const enabled = map.staff_sales_enabled !== "false";
    if (!enabled) {
      return Response.json({ error: "Staff sales email is disabled by the admin." }, { status: 403 });
    }

    // CC: explicit caller CC wins; otherwise the staff sales CC setting; else none.
    const toArr = (v: any) =>
      Array.isArray(v) ? v.map((s: string) => s.trim()).filter(Boolean)
      : (typeof v === "string" && v.trim() ? v.split(",").map((s: string) => s.trim()).filter(Boolean) : []);

    let ccEmails = toArr(cc);
    if (ccEmails.length === 0 && map.staff_sales_cc) {
      ccEmails = map.staff_sales_cc.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const plainBody = emailBody || "";
    const htmlBody = branded ? wrapBodyAsHtml(subject, plainBody) : undefined;
    const now = new Date().toISOString();

    // Sender identity comes from the staff_smtp settings group (staff's own
    // from_email / from_name), but DELIVERY goes through Resend — the same
    // provider admin emails use. Resend signs DKIM and sends from authorized
    // IPs already covered by the domain's SPF record, so staff sales emails
    // pass authentication and land in the inbox instead of spam. Manual SMTP
    // was bypassing both SPF and DKIM, which is why Gmail flagged it.
    const smtpSettings = await base44.entities.AppSetting.filter({ setting_category: "staff_smtp" });
    const smtpMap: Record<string, string> = {};
    smtpSettings.forEach((s: any) => { smtpMap[s.setting_key] = s.setting_value; });

    const fromEmail = smtpMap.staff_smtp_from_email || "";
    const fromName = smtpMap.staff_smtp_from_name || "Sales Team";
    if (!fromEmail) {
      return Response.json({ error: "Staff sender email not configured. Set staff_smtp_from_email in Settings → Staff SMTP Email Server." }, { status: 400 });
    }

    const apiKey = secrets.get("RESEND_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "RESEND_API_KEY secret is not configured." }, { status: 500 });
    }

    const fromAddr = `${fromName} <${fromEmail}>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [to_email],
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        bcc: toArr(bcc).length > 0 ? toArr(bcc) : undefined,
        reply_to: fromEmail,
        subject,
        text: plainBody,
        ...(htmlBody ? { html: htmlBody } : {}),
        headers: {
          "List-Unsubscribe": `mailto:${fromEmail}?subject=unsubscribe`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Auto-Response-Suppress": "All",
          "Auto-Submitted": "no",
        },
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || `Resend API returned ${res.status}`;
      throw new Error(`Resend error: ${msg}`);
    }

    const sendResult = { provider: "resend", messageId: data.id };

    // Log the staff sales send.
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
      action: "Staff sales email sent",
      workflow: "sendStaffSalesEmail",
      details: `By ${user.full_name || user.email} → ${to_email} · ${subject}`,
      status: "Success",
      timestamp: now,
    });

    return Response.json({ success: true, message: "Sales email sent", to: to_email, messageId: sendResult.messageId });
  } catch (error) {
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
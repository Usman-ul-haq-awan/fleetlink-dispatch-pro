import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";
import { wrapBodyAsHtml } from "../../shared/emailHtmlWrapper.ts";

// Send or queue a cold outreach email. Enforces the global 50/day cold-email
// limit server-side. Uses the existing Resend integration for delivery.
// action: "queue" = add to queue without sending; "send" = attempt to send now
// (still obeys the 50/day limit — if exhausted, the email is queued instead).
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      carrier_id,
      to_email,
      subject,
      email_body,
      scenario,
      comment,
      queue_id,
      action,
    } = body;

    if (!carrier_id) return Response.json({ error: "carrier_id is required" }, { status: 400 });
    if (!subject || !email_body) return Response.json({ error: "subject and email_body are required" }, { status: 400 });

    // --- Retrieve the staff member's SUDO server-side (never trust client) ---
    const staffMembers = await base44.asServiceRole.entities.StaffMember.filter(
      { email: (user.email || "").toLowerCase() },
      "-created_date",
      5
    );
    const staffRecord = staffMembers[0];
    let sudo = staffRecord?.sales_sudo || "";
    if (!sudo || !staffRecord?.sales_sudo_enabled) {
      sudo = (user.full_name || "SALES").split(" ")[0].toUpperCase();
    }

    const carrier = await base44.entities.Carrier.get(carrier_id);
    const recipientEmail = to_email || carrier?.email || "";
    if (!recipientEmail) {
      return Response.json({ error: "No recipient email — add an email address to this carrier first." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const today = now.split("T")[0];

    // --- Duplicate outreach check ---
    const recentColdEmails = await base44.asServiceRole.entities.EmailLog.filter(
      { carrier_id, email_type: "cold_outreach", status: "Sent" },
      "-sent_at",
      10
    );
    const duplicateWarning =
      recentColdEmails.length > 0
        ? `This carrier received a cold outreach email ${recentColdEmails[0].sent_at ? new Date(recentColdEmails[0].sent_at).toLocaleDateString() : "recently"}. Sending again may be seen as spam.`
        : "";

    // --- Daily limit (global, server-side) ---
    const limitSetting = await base44.asServiceRole.entities.AppSetting.filter(
      { setting_key: "cold_email_daily_limit" }
    );
    const dailyLimit = parseInt(limitSetting[0]?.setting_value || "50", 10);

    // Count today's successful cold outreach sends (global across all staff)
    const todaySent = await base44.asServiceRole.entities.EmailLog.filter(
      { email_type: "cold_outreach", status: "Sent" },
      "-sent_at",
      200
    );
    const sentToday = todaySent.filter((e: any) => e.sent_at && e.sent_at.startsWith(today)).length;

    // --- Build queue record data ---
    const queueData = {
      carrier_id,
      carrier_name: carrier?.legal_name || carrier?.dba_name || "",
      to_email: recipientEmail,
      staff_id: user.id,
      staff_name: user.full_name || user.email,
      staff_sudo: sudo,
      scenario: scenario || "General Dispatch Introduction",
      original_comment: comment || "",
      ai_subject: subject,
      ai_body: email_body,
      final_subject: subject,
      final_body: email_body,
      duplicate_warning: duplicateWarning,
    };

    // --- Action: queue only (no send) ---
    if (action === "queue") {
      let queueRecord;
      if (queue_id) {
        queueRecord = await base44.asServiceRole.entities.ColdEmailQueue.update(queue_id, {
          ...queueData,
          status: "Queued",
          scheduled_at: now,
        });
      } else {
        queueRecord = await base44.asServiceRole.entities.ColdEmailQueue.create({
          ...queueData,
          status: "Queued",
          scheduled_at: now,
        });
      }
      return Response.json({
        success: true,
        status: "Queued",
        queue_id: queueRecord.id,
        sent_today: sentToday,
        limit: dailyLimit,
      });
    }

    // --- Action: send now (enforce 50/day) ---
    if (sentToday >= dailyLimit) {
      let queueRecord;
      if (queue_id) {
        queueRecord = await base44.asServiceRole.entities.ColdEmailQueue.update(queue_id, {
          ...queueData,
          status: "Waiting",
          scheduled_at: now,
        });
      } else {
        queueRecord = await base44.asServiceRole.entities.ColdEmailQueue.create({
          ...queueData,
          status: "Waiting",
          scheduled_at: now,
        });
      }
      return Response.json({
        success: true,
        status: "Waiting",
        queue_id: queueRecord.id,
        message: `Daily cold email limit (${dailyLimit}) reached. Email queued — it will send when the next day's allowance opens.`,
        sent_today: sentToday,
        limit: dailyLimit,
      });
    }

    // Reserve a slot by marking the queue record as Processing
    let queueRecord;
    if (queue_id) {
      queueRecord = await base44.asServiceRole.entities.ColdEmailQueue.update(queue_id, {
        ...queueData,
        status: "Processing",
      });
    } else {
      queueRecord = await base44.asServiceRole.entities.ColdEmailQueue.create({
        ...queueData,
        status: "Processing",
      });
    }

    // --- Send via Resend (reuses the existing integration) ---
    try {
      const smtpSettings = await base44.asServiceRole.entities.AppSetting.filter(
        { setting_category: "staff_smtp" }
      );
      const smtpMap: Record<string, string> = {};
      smtpSettings.forEach((s: any) => { smtpMap[s.setting_key] = s.setting_value; });
      const fromEmail = smtpMap.staff_smtp_from_email || "";
      const fromName = smtpMap.staff_smtp_from_name || "Sales Team";
      if (!fromEmail) {
        throw new Error("Staff sender email not configured. Set staff_smtp_from_email in Settings → Staff SMTP Email Server.");
      }

      const apiKey = secrets.get("RESEND_API_KEY");
      if (!apiKey) throw new Error("RESEND_API_KEY secret is not configured.");

      const htmlBody = wrapBodyAsHtml(subject, email_body);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [recipientEmail],
          reply_to: fromEmail,
          subject,
          text: email_body,
          html: htmlBody,
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
        throw new Error(`Resend error: ${data?.message || data?.error || `status ${res.status}`}`);
      }

      const messageId = data.id;

      // Log the successful cold email send (email_type = cold_outreach)
      await base44.asServiceRole.entities.EmailLog.create({
        carrier_id,
        to_email: recipientEmail,
        subject,
        body: email_body,
        direction: "Outbound",
        status: "Sent",
        sent_at: now,
        email_type: "cold_outreach",
        message_id: messageId,
      });

      // Update queue record to Sent
      await base44.asServiceRole.entities.ColdEmailQueue.update(queueRecord.id, {
        status: "Sent",
        sent_at: now,
        resend_message_id: messageId,
      });

      // Audit trail
      await base44.asServiceRole.entities.ActivityLog.create({
        carrier_id,
        action: "Cold email sent",
        workflow: "sendColdEmail",
        details: `By ${user.full_name || user.email} (SUDO: ${sudo}) → ${recipientEmail} · ${subject}`,
        status: "Success",
        timestamp: now,
      });

      return Response.json({
        success: true,
        status: "Sent",
        queue_id: queueRecord.id,
        message_id: messageId,
        sent_today: sentToday + 1,
        limit: dailyLimit,
      });
    } catch (sendError: any) {
      // Send failed — mark as Failed, do NOT count as sent
      await base44.asServiceRole.entities.ColdEmailQueue.update(queueRecord.id, {
        status: "Failed",
        error_message: sendError.message,
      });
      await base44.asServiceRole.entities.EmailLog.create({
        carrier_id,
        to_email: recipientEmail,
        subject,
        body: email_body,
        direction: "Outbound",
        status: "Failed",
        error_message: sendError.message,
        email_type: "cold_outreach",
      });
      return Response.json({
        success: false,
        status: "Failed",
        error: sendError.message,
        queue_id: queueRecord.id,
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
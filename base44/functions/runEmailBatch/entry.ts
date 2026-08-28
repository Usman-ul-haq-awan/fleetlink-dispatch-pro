// Server-side email engine — invoked by the "Daily Email Engine" workflow
// every day at 9 AM. Runs as the service role (no user session needed), so
// it keeps working even when no one has the app open or the laptop is shut.
//
// For each carrier in the database with an email address that is not DNC,
// not already fully sequenced, and whose next email is due today:
//   1. Auto-assigns the best funnel if none assigned yet
//   2. Sends the next email in the sequence (personalized with carrier data)
//   3. Wraps the email in branded HTML with the Tycoon Logistics logo
//   4. Sends via Resend, logs to EmailLog, updates carrier tracking fields
// Respects a daily send cap to protect deliverability.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { sendEmail } from "../../shared/emailSender.ts";
import { getSequence, SEQUENCE_SPACING, COMPANY_PROFILE } from "../../shared/emailTemplates.ts";
import { selectFunnel } from "../../shared/funnelSelector.ts";
import { wrapBodyAsHtml } from "../../shared/emailHtmlWrapper.ts";

const DAILY_CAP = 50;

// Replaces all [Placeholder] tokens with actual carrier data.
function personalize(text: string, carrier: any): string {
  const firstName = (carrier.contact_name || carrier.owner_name || "").split(" ")[0] || "there";
  const companyName = carrier.legal_name || carrier.dba_name || "your company";
  const mcNumber = carrier.mc_number || "";
  const equipmentType = carrier.equipment_types || "your equipment";
  const fleetSize = String(carrier.power_units || 1);

  return text
    .replace(/\[First Name\]/g, firstName)
    .replace(/\[Company Name\]/g, companyName)
    .replace(/\[MC Number\]/g, mcNumber)
    .replace(/\[Equipment Type\]/g, equipmentType)
    .replace(/\[Fleet Size\]/g, fleetSize)
    .replace(/\[Preferred Lanes\]/g, "your preferred lanes");
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date();
    const nowIso = now.toISOString();

    // Check if automation is paused
    const pauseSetting = await svc.entities.AppSetting.filter({ setting_key: "automation_paused" });
    if (pauseSetting.length > 0 && pauseSetting[0].setting_value === "true") {
      return Response.json({ success: true, skipped: true, message: "Automation is paused in Settings." });
    }

    // Load all carriers (paginated to bypass the 500 cap)
    const allCarriers: any[] = [];
    let offset = 0;
    const PAGE = 500;
    while (true) {
      const page = await svc.entities.Carrier.list("-updated_date", PAGE, offset);
      allCarriers.push(...page);
      if (page.length < PAGE) break;
      offset += PAGE;
    }

    // Eligible: has email, not DNC, not completed sequence, not in a terminal lead_status
    const terminalStatuses = ["Active Client", "Do Not Contact", "Onboarding", "Human Handoff", "Interested"];
    const eligible = allCarriers.filter(
      (c) =>
        c.email &&
        !c.do_not_contact &&
        !c.email_sequence_complete &&
        !terminalStatuses.includes(c.lead_status)
    );

    // Among eligible, find those whose next email is due now (or initial with no funnel yet)
    const dueNow = eligible.filter((c) => {
      if (!c.email_funnel) return true; // needs initial assignment + first email
      if (!c.email_next_send_at) return true; // ready for next step
      return new Date(c.email_next_send_at) <= now;
    });

    if (dueNow.length === 0) {
      return Response.json({
        success: true,
        total_carriers: allCarriers.length,
        eligible: eligible.length,
        sent: 0,
        message: "No emails due today.",
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const assigned: string[] = [];

    for (const carrier of dueNow) {
      if (sent >= DAILY_CAP) break;

      try {
        // Assign funnel if not yet assigned
        let sequenceId = carrier.email_funnel;
        if (!sequenceId) {
          const assignment = selectFunnel(carrier);
          sequenceId = assignment.sequenceId;
          await svc.entities.Carrier.update(carrier.id, {
            email_funnel: sequenceId,
            email_funnel_reason: assignment.reason,
          });
          assigned.push(`${carrier.legal_name || carrier.email} → ${assignment.sequenceName}`);
        }

        const sequence = getSequence(sequenceId);
        if (!sequence) {
          errors.push(`${carrier.id}: sequence ${sequenceId} not found`);
          failed++;
          continue;
        }

        // Determine current step (0-indexed: 0=initial, 1-3=follow-ups, 4=breakup)
        const currentStep = carrier.email_sequence_step || 0;
        if (currentStep >= sequence.emails.length) {
          // Already completed
          await svc.entities.Carrier.update(carrier.id, { email_sequence_complete: true });
          continue;
        }

        const emailTemplate = sequence.emails[currentStep];
        const subject = personalize(emailTemplate.subject, carrier);
        const plainBody = personalize(emailTemplate.body, carrier);
        const htmlBody = wrapBodyAsHtml(subject, plainBody);

        // Send via Resend
        const sendResult = await sendEmail(svc, {
          to: carrier.email,
          subject,
          body: plainBody,
          html: htmlBody,
          fromName: COMPANY_PROFILE.short_name,
          requireSmtp: true,
        });

        // Log the email
        await svc.entities.EmailLog.create({
          carrier_id: carrier.id,
          to_email: carrier.email,
          subject,
          body: plainBody,
          direction: "Outbound",
          status: "Sent",
          is_follow_up: currentStep > 0,
          follow_up_number: currentStep,
          sent_at: nowIso,
          message_id: sendResult.messageId || "",
        });

        // Compute next send time
        const nextStep = currentStep + 1;
        const isComplete = nextStep >= sequence.emails.length;
        const nextDay = isComplete ? null : SEQUENCE_SPACING[nextStep];
        const nextSendAt = isComplete
          ? null
          : new Date(now.getTime() + nextDay * 24 * 60 * 60 * 1000).toISOString();

        await svc.entities.Carrier.update(carrier.id, {
          email_sequence_step: nextStep,
          email_next_send_at: nextSendAt,
          email_sequence_complete: isComplete,
          email_first_sent_at: currentStep === 0 ? nowIso : carrier.email_first_sent_at,
          lead_status: currentStep === 0 ? "Contacted" : carrier.lead_status,
        });

        await svc.entities.ActivityLog.create({
          carrier_id: carrier.id,
          action: isComplete ? "Email sequence completed" : `Email sent (step ${currentStep + 1}/${sequence.emails.length})`,
          workflow: "runEmailBatch",
          details: `Sequence: ${sequence.name} · Subject: ${subject}`,
          status: "Success",
          timestamp: nowIso,
        });

        sent++;
      } catch (err: any) {
        failed++;
        errors.push(`${carrier.legal_name || carrier.email}: ${err.message}`);
        try {
          await svc.entities.EmailLog.create({
            carrier_id: carrier.id,
            to_email: carrier.email || "",
            subject: "",
            body: "",
            status: "Failed",
            error_message: err.message,
          });
        } catch {}
      }
    }

    return Response.json({
      success: true,
      total_carriers: allCarriers.length,
      eligible: eligible.length,
      due: dueNow.length,
      sent,
      failed,
      assigned_count: assigned.length,
      assigned,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
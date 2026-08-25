import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import nodemailer from 'npm:nodemailer@6.9.14';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { email_log_id, carrier_id, to_email, subject, body: emailBody, campaign_id, is_test } = body;

    if (!to_email || !subject || !emailBody) {
      return Response.json({ error: 'to_email, subject, and body are required' }, { status: 400 });
    }

    // Check SMTP config
    const smtpHost = secrets.get('SMTP_HOST');
    const smtpPort = secrets.get('SMTP_PORT');
    const smtpUser = secrets.get('SMTP_USER');
    const smtpPass = secrets.get('SMTP_PASS');
    const smtpFrom = secrets.get('SMTP_FROM');

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return Response.json({
        error: 'SMTP not configured',
        message: 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in Settings → Environment Variables. Use your corporate email SMTP credentials.',
      }, { status: 503 });
    }

    const db = base44.asServiceRole;
    const now = new Date().toISOString();

    // Check DNC
    if (carrier_id) {
      const carriers = await db.entities.Carrier.filter({ carrier_id });
      if (carriers.length && carriers[0].do_not_contact) {
        return Response.json({ error: 'Carrier is on Do Not Contact list', carrier_id }, { status: 403 });
      }
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: parseInt(smtpPort || '587') === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Send
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: to_email,
      subject,
      text: emailBody,
    });

    // Log the email
    let logId = email_log_id;
    if (!logId) {
      const log = await db.entities.EmailLog.create({
        carrier_id: carrier_id || '',
        campaign_id: campaign_id || '',
        to_email,
        subject,
        body: emailBody,
        direction: 'Outbound',
        status: 'Sent',
        is_follow_up: false,
        follow_up_number: 0,
        sent_at: now,
        message_id: info.messageId || '',
      });
      logId = log.id;
    } else {
      await db.entities.EmailLog.update(logId, {
        status: 'Sent',
        sent_at: now,
        message_id: info.messageId || '',
      });
    }

    // Activity log
    if (carrier_id) {
      await db.entities.ActivityLog.create({
        carrier_id,
        action: is_test ? 'Test email sent' : 'Email sent',
        workflow: 'sendCampaignEmail',
        details: `To: ${to_email}, Subject: ${subject}`,
        status: 'Success',
        timestamp: now,
      });
    }

    return Response.json({
      success: true,
      message_id: info.messageId,
      log_id: logId,
    });
  } catch (error) {
    // Update log as failed if we have a log_id
    try {
      const body = await req.clone().json();
      if (body.email_log_id) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.EmailLog.update(body.email_log_id, {
          status: 'Failed',
          error_message: error.message,
        });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}
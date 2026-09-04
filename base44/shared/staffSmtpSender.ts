import nodemailer from "npm:nodemailer@6.9.15";

// Staff-only SMTP sender — completely independent of the admin email worker
// and Resend. Reads its own "staff_smtp" settings group configured by the
// admin in Settings → Staff SMTP Email Server. Staff sales emails go out
// through this manual SMTP connection directly from the Base44 backend.
export async function sendStaffSmtpEmail(
  base44: any,
  opts: { to: string; subject: string; body: string; html?: string; fromName?: string; fromEmail?: string; cc?: string[]; bcc?: string[] }
): Promise<{ provider: string; messageId?: string }> {
  const { to, subject, body, html } = opts;

  const settings = await base44.entities.AppSetting.filter({ setting_category: "staff_smtp" });
  const map: Record<string, string> = {};
  settings.forEach((s: any) => { map[s.setting_key] = s.setting_value; });

  const host = map.staff_smtp_host || "";
  const port = parseInt(map.staff_smtp_port || "587", 10);
  const encryption = map.staff_smtp_encryption || "STARTTLS";
  const user = map.staff_smtp_username || "";
  const pass = map.staff_smtp_password || "";
  const fromEmail = opts.fromEmail || map.staff_smtp_from_email || "";
  const fromName = opts.fromName || map.staff_smtp_from_name || "Sales Team";

  if (!host) throw new Error("Staff SMTP host not configured. Set it in Settings → Staff SMTP Email Server.");
  if (!user) throw new Error("Staff SMTP username not configured.");
  if (!pass) throw new Error("Staff SMTP password not configured.");
  if (!fromEmail) throw new Error("Staff SMTP from email not configured.");

  const secure = port === 465 || encryption === "SSL";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(encryption === "STARTTLS" ? { requireTLS: true } : {}),
  });

  // Always provide a plain-text alternative. Spam filters heavily penalize
  // HTML-only messages; a multipart/alternative with a real text part is one
  // of the strongest inbox-placement signals. If the caller passed HTML but
  // no text, strip tags from the HTML as a fallback text body.
  const textPart = (body && body.trim().length > 0)
    ? body
    : (html ? html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

  // Deliverability headers that mailbox providers (Gmail, Outlook, Apple)
  // check when deciding inbox vs. spam. These signal that the message is a
  // legitimate, human-written sales email — not bulk/automated spam.
  const listUnsubscribe = `mailto:${fromEmail}?subject=unsubscribe`;

  const info: any = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    cc: opts.cc && opts.cc.length > 0 ? opts.cc.join(", ") : undefined,
    bcc: opts.bcc && opts.bcc.length > 0 ? opts.bcc.join(", ") : undefined,
    replyTo: fromEmail,
    subject,
    text: textPart,
    ...(html ? { html } : {}),
    headers: {
      "Reply-To": fromEmail,
      "List-Unsubscribe": listUnsubscribe,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      // Suppress auto-responders (out-of-office, read-receipts) which can
      // trigger spam loops and hurt sender reputation.
      "X-Auto-Response-Suppress": "All",
      "Auto-Submitted": "no",
      // Normal priority — high-priority flags are a spam-filter red flag.
      "Priority": "normal",
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      // Discourage automated classification as bulk mail.
      "Precedence": "normal",
    },
  });

  return { provider: "staff-smtp", messageId: info.messageId };
}
import { secrets } from "base44:runtime";

// Direct Resend integration — no external worker required.
// Calls Resend's HTTPS API (port 443) directly from the Base44 backend.
//
// Requires the RESEND_API_KEY app secret, plus a Resend-verified sender
// identity. The sender identity (from_email / from_name) is read from
// AppSetting (setting_category: "smtp") so it stays configurable in
// Settings → SMTP Email Server.
// Every outbound email CCs this address so the owner always has a copy.
const OWNER_CC_EMAIL = "tycoon.tours.business@gmail.com";

export async function sendEmail(
  base44: any,
  opts: { to: string; subject: string; body: string; html?: string; fromName?: string; requireSmtp?: boolean; cc?: string[] }
): Promise<{ provider: string; messageId?: string }> {
  const { to, subject, body, html, fromName } = opts;

  const apiKey = secrets.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY secret is not configured. Add your Resend API key in the app secrets."
    );
  }

  // Sender identity from AppSetting (reuses the existing Settings fields).
  const settings = await base44.entities.AppSetting.filter({ setting_category: "smtp" });
  const map: Record<string, string> = {};
  settings.forEach((s: any) => { map[s.setting_key] = s.setting_value; });

  const fromEmail = map.smtp_from_email || "";
  const fromNameResolved = map.smtp_from_name || fromName || "Dispatch Team";
  if (!fromEmail) {
    throw new Error("Sender email not configured. Set smtp_from_email in Settings → SMTP Email Server to a Resend-verified address.");
  }
  const fromAddr = `${fromNameResolved} <${fromEmail}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddr,
      to: [to],
      cc: [OWNER_CC_EMAIL, ...(opts.cc || [])],
      subject,
      text: body || "",
      ...(html ? { html } : {}),
    }),
  });

  const data: any = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || data?.error || `Resend API returned ${res.status}`;
    throw new Error(`Resend error: ${msg}`);
  }

  return { provider: "resend", messageId: data.id };
}
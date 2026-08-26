import { secrets } from "base44:runtime";

// Shared email sender. Routes outbound email through the dedicated email
// worker, which forwards to Resend's HTTPS API (port 443 — works on any host,
// no SMTP egress required).
//
// Requires the EMAIL_WORKER_URL and EMAIL_WORKER_API_KEY app secrets, plus a
// Resend-verified sender identity. The sender identity (from_email / from_name)
// is read from AppSetting (setting_category: "smtp") so it stays configurable
// in Settings → SMTP Email Server; the SMTP host/port/username/password fields
// are no longer used for sending.
export async function sendEmail(
  base44: any,
  opts: { to: string; subject: string; body: string; fromName?: string; requireSmtp?: boolean }
): Promise<{ provider: string; messageId?: string }> {
  const { to, subject, body, fromName } = opts;

  const workerUrl = secrets.get("EMAIL_WORKER_URL");
  const workerKey = secrets.get("EMAIL_WORKER_API_KEY");
  if (!workerUrl) {
    throw new Error(
      "EMAIL_WORKER_URL secret is not configured. Deploy the email worker and add its URL + API key as app secrets (EMAIL_WORKER_URL, EMAIL_WORKER_API_KEY)."
    );
  }

  // Sender identity from AppSetting (reuses the existing Settings fields).
  const settings = await base44.entities.AppSetting.filter({ setting_category: "smtp" });
  const map: Record<string, string> = {};
  settings.forEach((s: any) => { map[s.setting_key] = s.setting_value; });

  const fromEmail = map.smtp_from_email || "";
  const fromNameResolved = map.smtp_from_name || fromName || "Dispatch Team";

  const res = await fetch(`${workerUrl.replace(/\/$/, "")}/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-api-key": workerKey || "",
    },
    body: JSON.stringify({
      to,
      subject,
      body,
      from_email: fromEmail,
      from_name: fromNameResolved,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as any).error || `Email worker returned ${res.status}`);
  }

  const data: any = await res.json();
  return { provider: "resend", messageId: data.messageId };
}
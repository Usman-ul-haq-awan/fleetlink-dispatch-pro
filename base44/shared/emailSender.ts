import { secrets } from "base44:runtime";

// Shared email sender. Routes through the company SMTP server (via the browser
// worker, which runs full Node.js and can open SMTP TCP connections) when SMTP
// settings are configured. Falls back to the built-in email service otherwise
// (which only reaches registered app users without a connected custom domain).
export async function sendEmail(
  base44: any,
  opts: { to: string; subject: string; body: string; fromName?: string; requireSmtp?: boolean }
): Promise<{ provider: string; messageId?: string }> {
  const { to, subject, body, fromName, requireSmtp } = opts;

  const settings = await base44.entities.AppSetting.filter({ setting_category: "smtp" });
  const map: Record<string, string> = {};
  settings.forEach((s: any) => { map[s.setting_key] = s.setting_value; });

  if (map.smtp_host) {
    const workerUrl = secrets.get("WORKER_URL");
    const workerKey = secrets.get("WORKER_API_KEY");
    if (!workerUrl) throw new Error("WORKER_URL secret not configured — required for SMTP sending");

    const res = await fetch(`${workerUrl.replace(/\/$/, "")}/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-api-key": workerKey || "",
      },
      body: JSON.stringify({
        smtp: {
          host: map.smtp_host,
          port: parseInt(map.smtp_port, 10) || 587,
          encryption: map.smtp_encryption || "STARTTLS",
          username: map.smtp_username || "",
          password: map.smtp_password || "",
        },
        from_email: map.smtp_from_email || "",
        from_name: map.smtp_from_name || fromName || "Dispatch Team",
        to,
        subject,
        body,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as any).error || `SMTP worker returned ${res.status}`);
    }
    const data: any = await res.json();
    return { provider: "smtp", messageId: data.messageId };
  }

  // Fallback: built-in email service
  if (requireSmtp) {
    throw new Error("SMTP server is not configured. Add your SMTP host, port, username, password, and from-email in Settings → SMTP Email Server before sending test emails.");
  }
  await base44.asServiceRole.integrations.Core.SendEmail({
    to,
    subject,
    body,
    from_name: fromName || "Dispatch Team",
  });
  return { provider: "builtin" };
}
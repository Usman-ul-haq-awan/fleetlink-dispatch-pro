// Wraps a plain-text email body in a branded HTML template with the Tycoon
// Logistics logo, company details, and admin phone number in the footer.
// Used by the email engine for all outbound emails.

import { COMPANY_PROFILE } from "./emailTemplates.ts";

export function wrapBodyAsHtml(subject: string, plainBody: string): string {
  // Convert plain text to HTML-safe paragraphs
  const escaped = plainBody
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const bodyHtml = escaped
    .split(/\n\n+/)
    .map((para) => `<p style="margin:0 0 14px 0;line-height:1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header with logo -->
          <tr>
            <td style="background-color:#003366;padding:20px 32px;text-align:left;">
              <img src="${COMPANY_PROFILE.logo_url}" alt="Tycoon Logistics LLC" width="180" style="display:inline-block;border:0;outline:none;text-decoration:none;max-width:180px;height:auto;"/>
            </td>
          </tr>
          <!-- Subject line -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#003366;">${subject}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 24px 32px;font-size:14px;color:#1a1a1a;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:0;border-top:1px solid #e0e0e0;margin:0;"/>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px 32px;background-color:#f9fafb;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:bold;color:#003366;">${COMPANY_PROFILE.legal_name}</p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#666;line-height:1.5;">
                ${COMPANY_PROFILE.address}<br/>
                Phone: <a href="tel:${COMPANY_PROFILE.phone}" style="color:#003366;text-decoration:none;">${COMPANY_PROFILE.phone}</a> &nbsp;|&nbsp;
                Email: <a href="mailto:${COMPANY_PROFILE.email}" style="color:#003366;text-decoration:none;">${COMPANY_PROFILE.email}</a><br/>
                Web: <a href="https://${COMPANY_PROFILE.website}" style="color:#003366;text-decoration:none;">${COMPANY_PROFILE.website}</a>
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#999;line-height:1.4;">
                Fee structure: ${COMPANY_PROFILE.fee_flat} flat for the first ${COMPANY_PROFILE.fee_first_threshold} weekly gross · ${COMPANY_PROFILE.fee_percentage} on revenue above. No forced dispatch. No long-term contracts.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:11px;color:#999;">You received this email because we identified your company as a motor carrier. If you'd like to opt out, reply with "unsubscribe".</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
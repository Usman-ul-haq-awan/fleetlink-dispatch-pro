import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Detect whether a staff comment explicitly requests an email send.
// Must contain an explicit "send email" / "email" instruction — not just
// any note that happens to contain the word "email".
function isEmailRequested(comment: string): boolean {
  if (!comment) return false;
  const c = comment.toLowerCase().trim();
  const patterns = [
    /^send\s+email/,
    /^please\s+send\s+email/,
    /^can\s+you\s+send\s+email/,
    /^email\s+-/,
    /^send\s+mail/,
    /send\s+.*\bemail\b/,
  ];
  return patterns.some((p) => p.test(c));
}

// Extract the email scenario from a staff comment.
function detectScenario(comment: string): string {
  if (!comment) return "General Dispatch Introduction";
  const c = comment.toLowerCase();
  if (c.includes("trial") || c.includes("complimentary") || c.includes("free")) return "Complimentary Trial";
  if (c.includes("backup") || c.includes("back-up") || c.includes("back up")) return "Backup Dispatcher Offer";
  if (c.includes("follow up") || c.includes("follow-up") || c.includes("following up")) return "Follow-Up";
  if (c.includes("re-engage") || c.includes("reengage") || c.includes("touch base") || c.includes("reach out again")) return "Re-Engagement";
  if (c.includes("load") || c.includes("freight") || c.includes("paying") || c.includes("rpm") || c.includes("rate")) return "High-Paying Load Opportunity";
  if (c.includes("carrier") && (c.includes("truck") || c.includes("dispatch") || c.includes("needs"))) return "Carrier-Specific Opportunity";
  return "Custom Staff Instruction";
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { carrier_id, comment, scenario } = body;
    if (!carrier_id) return Response.json({ error: "carrier_id is required" }, { status: 400 });

    const carrier = await base44.entities.Carrier.get(carrier_id);
    if (!carrier) return Response.json({ error: "Carrier not found" }, { status: 404 });

    // Retrieve the staff member's Sales SUDO (service role — StaffMember RLS
    // is admin-only, but the backend needs the SUDO for the email signature).
    const staffMembers = await base44.asServiceRole.entities.StaffMember.filter(
      { email: (user.email || "").toLowerCase() },
      "-created_date",
      5
    );
    const staffRecord = staffMembers[0];
    let sudo = staffRecord?.sales_sudo || "";
    if (!sudo || !staffRecord?.sales_sudo_enabled) {
      // Fallback: first name uppercased — still unique enough for a signature
      sudo = (user.full_name || "SALES").split(" ")[0].toUpperCase();
    }

    const emailRequested = isEmailRequested(comment);
    const detectedScenario =
      scenario && scenario !== "Custom" ? scenario : detectScenario(comment);

    // Recent email/contact history for this carrier
    const recentEmails = await base44.entities.EmailLog.filter(
      { carrier_id },
      "-sent_at",
      10
    );
    const sentEmails = recentEmails.filter((e: any) => e.status === "Sent");
    const hasRecentOutreach = sentEmails.length > 0;

    // Company settings for personalization
    const settings = await base44.entities.AppSetting.filter({});
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });
    const companyName = settingsMap["company_name"] || "Tycoon Logistics";
    const serviceDescription = settingsMap["dispatch_service_description"] || "professional truck dispatch services";

    const historyText =
      sentEmails.length > 0
        ? sentEmails
            .map(
              (e: any) =>
                `- "${e.subject || "(no subject)"}" (${e.sent_at ? new Date(e.sent_at).toLocaleDateString() : "pending"})`
            )
            .join("\n")
        : "No previous outreach.";

    const prompt = `You are writing a personalized B2B cold email from a truck dispatching company to a trucking carrier.

SENDER COMPANY: ${companyName}
SERVICE: ${serviceDescription}
STAFF SIGN-OFF NAME (SUDO): ${sudo}

SCENARIO: ${detectedScenario}
STAFF INSTRUCTION: ${comment || "(none provided — use the scenario default approach)"}

CARRIER INFORMATION (use ONLY these facts — do NOT invent anything):
- Legal Name: ${carrier.legal_name || "Unknown"}
- DBA: ${carrier.dba_name || "None"}
- USDOT: ${carrier.usdot_number || "Unknown"}
- MC: ${carrier.mc_number || "Unknown"}
- Location: ${[carrier.city, carrier.state].filter(Boolean).join(", ") || "Unknown"}
- Owner: ${carrier.owner_name || "Unknown"}
- Contact: ${carrier.contact_name || "Unknown"}
- Equipment: ${carrier.equipment_types || "Unknown"}
- Power Units: ${carrier.power_units || "Unknown"}
- Drivers: ${carrier.drivers || "Unknown"}
- Cargo Types: ${carrier.cargo_types || "Unknown"}
- Phone: ${carrier.phone || "Unknown"}
- Email: ${carrier.email || "Unknown"}

PREVIOUS OUTREACH HISTORY:
${historyText}

STRICT RULES:
1. Do NOT invent carrier information, truck counts, equipment, lanes, rates, load details, broker details, previous conversations, or relationships.
2. If information is unavailable, OMIT it — do not guess or fill gaps.
3. For load opportunities, only reference load details if they appear in the staff instruction. NEVER fabricate a load.
4. Keep the email concise (150-250 words).
5. Be professional, respectful, and specific to the carrier's known details.
6. Address the owner or contact by name if available.
7. Reference their equipment type and location if available.
8. Tailor the email to the scenario above.
9. Include a clear call to action (reply or call).
10. End with this exact signature format:

Best regards,

${sudo}
${companyName}
USA Truck Dispatching

Generate a JSON object with:
{
  "subject": "Email subject line (personalized, under 60 characters)",
  "body": "Full email body text (plain text, with line breaks, including the signature above)"
}`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["subject", "body"],
      },
    });

    return Response.json({
      success: true,
      subject: (llmResult as any).subject || "",
      body: (llmResult as any).body || "",
      scenario: detectedScenario,
      email_requested: emailRequested,
      staff_sudo: sudo,
      has_recent_outreach: hasRecentOutreach,
      recent_outreach_count: sentEmails.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
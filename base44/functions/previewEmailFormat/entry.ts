// Returns a sample branded email HTML so the user can preview the exact
// format being sent to carriers. Does NOT send any email.
import { getSequence, COMPANY_PROFILE } from "../../shared/emailTemplates.ts";
import { wrapBodyAsHtml } from "../../shared/emailHtmlWrapper.ts";

function personalize(text: string, carrier: any): string {
  return text
    .replace(/\[First Name\]/g, (carrier.contact_name || "John").split(" ")[0])
    .replace(/\[Company Name\]/g, carrier.legal_name || "your company")
    .replace(/\[MC Number\]/g, carrier.mc_number || "")
    .replace(/\[Equipment Type\]/g, carrier.equipment_types || "your equipment")
    .replace(/\[Fleet Size\]/g, String(carrier.power_units || 1))
    .replace(/\[Preferred Lanes\]/g, "your preferred lanes");
}

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const sequenceId = body.sequence_id || "seq_1";
    const step = Math.max(0, Math.min(4, body.step || 0));

    const sequence = getSequence(sequenceId);
    if (!sequence) return Response.json({ error: "Sequence not found" }, { status: 404 });

    const email = sequence.emails[step];
    const sampleCarrier = {
      contact_name: "John Smith",
      legal_name: "Acme Trucking LLC",
      mc_number: "123456",
      equipment_types: "Dry Van, Reefer",
      power_units: 5,
    };

    const subject = personalize(email.subject, sampleCarrier);
    const plainBody = personalize(email.body, sampleCarrier);
    const html = wrapBodyAsHtml(subject, plainBody);

    return Response.json({
      subject,
      html,
      plain_body: plainBody,
      sequence_name: sequence.name,
      step,
      total_steps: sequence.emails.length,
      cc_email: "tycoon.tours.business@gmail.com",
      from_name: COMPANY_PROFILE.short_name,
      from_email: "admin@tycoonlogistics.online",
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
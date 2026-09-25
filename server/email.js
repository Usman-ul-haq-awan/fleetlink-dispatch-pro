import nodemailer from "nodemailer";
import { db, genId, nowISO } from "./db.js";

// --- SMTP Transport ---
const smtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: (process.env.SMTP_SECURE || "true") === "true",
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || "" }
    : undefined,
};

let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport(smtpConfig);
  }
  return _transporter;
}

export function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
}

export function getFromEmail() {
  return process.env.SMTP_USER || "noreply@fleetlink.local";
}

// --- Email log helper (stored in generic_entities) ---
function logEmail({ to, subject, status, direction = "Outbound", carrierId = "", createdBy = "" }) {
  const id = genId();
  const ts = nowISO();
  const data = JSON.stringify({
    to_email: to,
    subject: subject || "",
    status,
    direction,
    carrier_id: carrierId,
    sent_at: ts,
    created_by_id: createdBy,
  });
  db.prepare(
    "INSERT INTO generic_entities (id, entity_name, data, created_date, updated_date, owner) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, "EmailLog", data, ts, ts, createdBy);
  return id;
}

// --- Core send function ---
export async function sendEmail({ to, subject, body, cc, bcc, html }) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD.");
  }
  const transporter = getTransporter();
  const mailOptions = {
    from: getFromEmail(),
    to,
    subject,
    cc: cc || undefined,
    bcc: bcc || undefined,
    text: body || undefined,
    html: html || undefined,
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
}

// --- Helper: get carrier by id or carrier_id ---
function getCarrier(carrierId) {
  // Try by id first, then by carrier_id field
  let row = db.prepare("SELECT * FROM carriers WHERE id = ?").get(carrierId);
  if (!row) {
    row = db.prepare("SELECT * FROM carriers WHERE carrier_id = ?").get(carrierId);
  }
  return row;
}

// --- Helper: get AppSetting value ---
function getSetting(key) {
  const rows = db.prepare(
    "SELECT * FROM generic_entities WHERE entity_name = 'AppSetting' AND json_extract(data, '$.setting_key') = ?"
  ).all(key);
  if (rows.length === 0) return null;
  const data = JSON.parse(rows[0].data);
  return data.setting_value;
}

// --- Helper: count recent outbound emails for a carrier ---
function countRecentOutreach(carrierId) {
  const rows = db.prepare(
    "SELECT * FROM generic_entities WHERE entity_name = 'EmailLog' AND json_extract(data, '$.carrier_id') = ? AND json_extract(data, '$.direction') = 'Outbound'"
  ).all(carrierId);
  return rows.length;
}

// --- Template substitution ---
function fillTemplate(text, carrier) {
  if (!carrier) return text || "";
  const company = carrier.legal_name || carrier.dba_name || "[Company Name]";
  const firstName = (carrier.contact_name || carrier.owner_name || company).split(" ")[0];
  const fullName = carrier.contact_name || carrier.owner_name || company;
  const equipment = carrier.equipment_types || carrier.lead_equipment_type || "";
  const state = carrier.state || "";
  const usdot = carrier.usdot_number || "";
  const mc = carrier.mc_number || "";
  return (text || "")
    .replace(/\{\{company_name\}\}/g, company)
    .replace(/\{\{contact_first\}\}/g, firstName)
    .replace(/\{\{contact_name\}\}/g, fullName)
    .replace(/\{\{owner_name\}\}/g, carrier.owner_name || fullName)
    .replace(/\{\{equipment\}\}/g, equipment)
    .replace(/\{\{state\}\}/g, state)
    .replace(/\{\{usdot\}\}/g, usdot)
    .replace(/\{\{mc\}\}/g, mc);
}

// --- Default email templates ---
const DEFAULT_TEMPLATES = {
  subject: "Dispatch Services Available for {{company_name}} — Let's Talk",
  body: `Hi {{contact_first}},

I hope this message finds you well. I came across {{company_name}} and wanted to reach out regarding our dispatch services.

We help carriers like yours maximize load opportunities, reduce deadhead miles, and handle the back-office load so you can focus on driving. Here's what we offer:

• 24/7/365 back-office support
• No forced dispatch — you choose your loads
• Transparent financial structure
• Access to premium freight and better rates

I'd love to learn more about your current operations and see if there's a fit. Are you available for a quick call this week?

Best regards,
Tycoon Logistics Team`,
};

// --- Cold email scenario templates ---
const COLD_EMAIL_SCENARIOS = {
  "General Dispatch Introduction": {
    subject: "Dispatch Services for {{company_name}} — Let's Connect",
    body: `Hi {{contact_first}},

I'm reaching out from Tycoon Logistics. We provide dedicated dispatch services for carriers like {{company_name}} and I'd love to see if we'd be a good fit.

We offer:
• 24/7 dispatch support — never miss a load
• No forced dispatch — you pick your freight
• Competitive rates and premium loads
• Full back-office handling (billing, paperwork, rate confirmation)

Would you be open to a quick call this week to discuss how we can help keep your trucks loaded?

Best regards,
Tycoon Logistics Team`,
  },
  "High-Paying Load Opportunity": {
    subject: "High-Paying Loads Available in {{state}} — {{company_name}}",
    body: `Hi {{contact_first}},

I have access to some high-paying freight routes that would be a great match for {{company_name}}'s equipment type ({{equipment}}).

These loads are currently available and paying above market rate. If you have trucks available, I'd love to connect you with these opportunities.

Can we schedule a 5-minute call to discuss the details?

Best regards,
Tycoon Logistics Team`,
  },
  "Complimentary Trial": {
    subject: "Free Dispatch Trial for {{company_name}}",
    body: `Hi {{contact_first}},

I'd like to offer {{company_name}} a complimentary trial of our dispatch services — no commitment, no upfront cost.

We'll find and book loads for your trucks for one full week so you can experience our service firsthand. If you like what you see, we can discuss a longer partnership.

Interested? Just reply to this email and I'll set everything up.

Best regards,
Tycoon Logistics Team`,
  },
  "Backup Dispatcher Offer": {
    subject: "Backup Dispatch Support for {{company_name}}",
    body: `Hi {{contact_first}},

Even if you already have a dispatcher, having a backup can keep your trucks moving during slow periods or when your primary dispatcher is unavailable.

Tycoon Logistics offers flexible backup dispatch — you only use us when you need us. No contracts, no minimums.

Would this be valuable for {{company_name}}? Let me know and I can share more details.

Best regards,
Tycoon Logistics Team`,
  },
  "Follow-Up": {
    subject: "Following Up — Dispatch Services for {{company_name}}",
    body: `Hi {{contact_first}},

I reached out a few days ago about dispatch services for {{company_name}} and wanted to follow up.

We specialize in keeping trucks loaded with premium freight and handling all the back-office work so you can focus on driving. Our carriers see fewer deadhead miles and higher weekly earnings.

Is this something you'd be open to exploring? A quick call is all it takes.

Best regards,
Tycoon Logistics Team`,
  },
  "Carrier-Specific Opportunity": {
    subject: "Specific Opportunity for {{company_name}} — {{equipment}} in {{state}}",
    body: `Hi {{contact_first}},

I have a specific freight opportunity that matches {{company_name}}'s profile — {{equipment}} routes out of {{state}}.

This is a recurring lane with consistent volume and above-market rates. I think it could be a strong addition to your weekly rotation.

Can we talk this week? I'd like to share the lane details with you.

Best regards,
Tycoon Logistics Team`,
  },
  "Re-Engagement": {
    subject: "Let's Get {{company_name}} Back on the Road — With Better Loads",
    body: `Hi {{contact_first}},

It's been a while since we last connected about dispatch services for {{company_name}}.

The freight market has shifted and we're seeing some excellent opportunities right now — especially for carriers with your equipment type. I'd love to reconnect and share what's available.

Are you currently looking for dispatch support? Even part-time or as a backup?

Best regards,
Tycoon Logistics Team`,
  },
  "Custom Staff Instruction": {
    subject: "Personalized Dispatch Proposal for {{company_name}}",
    body: `Hi {{contact_first}},

I'm reaching out with a tailored proposal for {{company_name}} based on what I know about your operations.

Our team at Tycoon Logistics can provide the dispatch support you need, whether it's finding better loads, reducing paperwork, or keeping your fleet consistently booked.

I'd love to discuss the specifics — when would be a good time to connect?

Best regards,
Tycoon Logistics Team`,
  },
};

// --- Email funnel sequences ---
const FUNNEL_SEQUENCES = {
  seq_1: {
    name: "Self-Dispatch Time Reclaim",
    steps: [
      { subject: "Reclaim Your Time — Dispatch Services for {{company_name}}", body: "Hi {{contact_first}},\n\nAs a carrier, your time is your most valuable asset. Spending hours on load boards, calling brokers, and handling paperwork keeps you away from what matters — driving.\n\nTycoon Logistics takes over the back-office so you can focus on the road:\n• We find and negotiate loads for you\n• We handle rate confirmations and paperwork\n• You choose which loads to accept — no forced dispatch\n\nReady to reclaim your time? Let's talk.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Quick Follow-Up — {{company_name}}", body: "Hi {{contact_first}},\n\nJust following up on my previous email about reclaiming your time with our dispatch services.\n\nMany of our carriers save 10+ hours per week by letting us handle load-finding and paperwork. Could {{company_name}} benefit from that?\n\nA 5-minute call is all it takes.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Last Note — Dispatch Support for {{company_name}}", body: "Hi {{contact_first}},\n\nThis will be my last email for now. If {{company_name}} ever needs dispatch support — even as a backup — we're here.\n\nFeel free to reach out anytime.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_2: {
    name: "Fleet Scaling & Capacity",
    steps: [
      { subject: "Scaling {{company_name}} — More Loads, Less Hassle", body: "Hi {{contact_first}},\n\nLooking to grow {{company_name}}? We can help you scale without the growing pains.\n\nOur dispatch team keeps every truck in your fleet loaded with premium freight, so adding capacity doesn't mean adding stress.\n\nLet's discuss how we can support your growth.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Fleet Growth for {{company_name}}", body: "Hi {{contact_first}},\n\nFollowing up on scaling {{company_name}}. We handle the load-finding so you can focus on adding trucks and drivers.\n\nReady to talk?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Scaling {{company_name}}", body: "Hi {{contact_first}},\n\nLast note on fleet scaling. When you're ready to grow {{company_name}}, we're ready to help keep those new trucks loaded.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_3: {
    name: "New MC Authority Acceleration",
    steps: [
      { subject: "New Authority? Get {{company_name}} Loaded Fast", body: "Hi {{contact_first}},\n\nNew MC authority is exciting — but finding loads as a new carrier can be tough. We specialize in helping new authority carriers like {{company_name}} get booked and rolling quickly.\n\nWe know which brokers work with new MCs and can get you on the road faster.\n\nLet's connect.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Getting {{company_name}} on the Road", body: "Hi {{contact_first}},\n\nFollowing up — we can help {{company_name}} find loads even with new authority. Many brokers have 6-12 month requirements, but we know the ones that don't.\n\nReady to talk?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Last Note — New Authority Support", body: "Hi {{contact_first}},\n\nFinal note for now. Whenever {{company_name}} needs help finding loads as a new authority carrier, reach out.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_4: {
    name: "Broker Quality & Risk Mitigation",
    steps: [
      { subject: "Better Brokers for {{company_name}} — We Vet Every Load", body: "Hi {{contact_first}},\n\nNot all brokers pay on time. At Tycoon Logistics, we vet every broker we work with — checking credit, payment history, and reputation — so {{company_name}} never gets stuck with a bad load.\n\nWant to work with quality brokers only? Let's talk.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Broker Vetting for {{company_name}}", body: "Hi {{contact_first}},\n\nFollowing up on broker quality. We only book loads from brokers with proven payment records. No more chasing checks.\n\nInterested?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Quality Brokers", body: "Hi {{contact_first}},\n\nLast note for now. If {{company_name}} ever wants to work only with vetted, reliable brokers, we're here.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_5: {
    name: "No Forced Dispatch Freedom",
    steps: [
      { subject: "Your Loads, Your Choice — Dispatch for {{company_name}}", body: "Hi {{contact_first}},\n\nAt Tycoon Logistics, we never force dispatch. We present options — you pick the loads that work for {{company_name}}.\n\nNo pressure, no quotas. Just better freight choices.\n\nLet's discuss.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — No Forced Dispatch", body: "Hi {{contact_first}},\n\nFollowing up — with us, {{company_name}} keeps full control. You review every load offer and accept only what works for you.\n\nReady to explore?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Freedom to Choose", body: "Hi {{contact_first}},\n\nLast note for now. {{company_name}} always has the final say with our dispatch service. Reach out when you're ready.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_6: {
    name: "Deadhead & Lane Optimization",
    steps: [
      { subject: "Reduce Deadhead Miles for {{company_name}}", body: "Hi {{contact_first}},\n\nEmpty miles eat your profits. Our dispatch team specializes in lane optimization — finding backhauls and round trips that minimize deadhead for {{company_name}}.\n\nLess empty driving, more paid miles.\n\nLet's talk.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Less Deadhead for {{company_name}}", body: "Hi {{contact_first}},\n\nFollowing up — we can help {{company_name}} cut deadhead miles significantly with smart lane pairing and backhaul matching.\n\nInterested?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Lane Optimization", body: "Hi {{contact_first}},\n\nLast note for now. Whenever {{company_name}} wants to reduce empty miles, we're here to help.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_7: {
    name: "Transparent Financial Structure",
    steps: [
      { subject: "Transparent Pricing for {{company_name}} — No Hidden Fees", body: "Hi {{contact_first}},\n\nAt Tycoon Logistics, our financial structure is simple and transparent. No hidden fees, no surprise deductions. {{company_name}} knows exactly what you're paying and what you're earning.\n\nWant the details? Let's talk.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Transparent Financials", body: "Hi {{contact_first}},\n\nFollowing up — our pricing is straightforward and {{company_name}} always knows where every dollar goes. No games.\n\nReady to learn more?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Transparent Pricing", body: "Hi {{contact_first}},\n\nLast note for now. If {{company_name}} values financial transparency from a dispatch partner, reach out anytime.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_8: {
    name: "24/7/365 Back-Office Support",
    steps: [
      { subject: "24/7 Dispatch Support for {{company_name}}", body: "Hi {{contact_first}},\n\nFreight doesn't sleep — and neither do we. Tycoon Logistics provides 24/7/365 back-office support so {{company_name}} always has someone finding loads, handling paperwork, and solving problems.\n\nNever miss a load opportunity again.\n\nLet's connect.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Always-On Support", body: "Hi {{contact_first}},\n\nFollowing up — our dispatchers are available around the clock. {{company_name}} never has to wait for business hours to get loads booked.\n\nInterested?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — 24/7 Support", body: "Hi {{contact_first}},\n\nLast note for now. Whenever {{company_name}} needs round-the-clock dispatch support, we're just a call or email away.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_9: {
    name: "Growth & Equipment Expansion",
    steps: [
      { subject: "Growing {{company_name}}? We Handle the Extra Capacity", body: "Hi {{contact_first}},\n\nAdding equipment to {{company_name}}? We can find the freight to keep those new trucks busy from day one.\n\nWhether it's dry van, reefer, or flatbed, we have the broker relationships to fill your expanded fleet.\n\nLet's discuss your growth plans.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Equipment Expansion", body: "Hi {{contact_first}},\n\nFollowing up — if {{company_name}} is adding trucks, we can make sure they're loaded immediately. No sitting, no waiting.\n\nReady to talk?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Growth Support", body: "Hi {{contact_first}},\n\nLast note for now. When {{company_name}} is ready to expand, we're ready to keep those new trucks rolling.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
  seq_10: {
    name: "Premium Consultative Partnership",
    steps: [
      { subject: "A Premium Partnership for {{company_name}}", body: "Hi {{contact_first}},\n\nTycoon Logistics offers more than just dispatch — we're a consultative partner for {{company_name}}. We analyze your lanes, equipment, and goals to build a custom strategy that maximizes your revenue.\n\nThis isn't one-size-fits-all. It's tailored to you.\n\nLet's schedule a call.\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Follow-Up — Premium Partnership", body: "Hi {{contact_first}},\n\nFollowing up — our consultative approach means {{company_name}} gets a dispatch partner that actually understands your business and helps you grow.\n\nInterested in learning more?\n\nBest regards,\nTycoon Logistics Team" },
      { subject: "Final Note — Consultative Partnership", body: "Hi {{contact_first}},\n\nLast note for now. If {{company_name}} ever wants a dispatch partner that goes beyond just finding loads — one that helps you strategize and grow — we're here.\n\nBest regards,\nTycoon Logistics Team" },
    ],
  },
};

// --- Email function handlers ---
// Each returns { data, status? } or throws an Error

export async function handleEmailFunction(functionName, body, req) {
  const user = req.user;

  switch (functionName) {
    case "sendTestEmail":
      return handleSendTestEmail(body, user);

    case "sendCampaignEmail":
      return handleSendCampaignEmail(body, user);

    case "sendColdEmail":
      return handleSendColdEmail(body, user);

    case "sendStaffSalesEmail":
      return handleSendStaffSalesEmail(body, user);

    case "generateEmailContent":
      return handleGenerateEmailContent(body);

    case "generateColdEmail":
      return handleGenerateColdEmail(body);

    case "previewEmailFormat":
      return handlePreviewEmailFormat(body);

    case "runEmailBatch":
      return handleRunEmailBatch(user);

    case "getColdEmailStats":
      return handleGetColdEmailStats();

    default:
      return null; // Not an email function
  }
}

// --- sendTestEmail ---
async function handleSendTestEmail(body, user) {
  const { to_email, subject, body: emailBody, cc, bcc } = body;
  if (!to_email) throw new Error("to_email is required");
  if (!subject) throw new Error("subject is required");

  try {
    await sendEmail({ to: to_email, subject, body: emailBody, cc, bcc });
    logEmail({ to: to_email, subject, status: "Sent", createdBy: user?.id || "" });
    return { data: { message: `Email sent to ${to_email}` } };
  } catch (err) {
    logEmail({ to: to_email, subject, status: "Failed", createdBy: user?.id || "" });
    throw new Error(`Failed to send email: ${err.message}`);
  }
}

// --- sendCampaignEmail ---
async function handleSendCampaignEmail(body, user) {
  const { carrier_id, campaign_id, to_email, subject, body: emailBody } = body;
  if (!to_email) throw new Error("to_email is required");

  // Get CC from settings
  const ccSetting = getSetting("email_cc_address");
  const cc = ccSetting ? [ccSetting] : undefined;

  try {
    await sendEmail({ to: to_email, subject: subject || "Dispatch Services", body: emailBody, cc });
    logEmail({ to: to_email, subject, status: "Sent", carrierId: carrier_id, createdBy: user?.id || "" });
    return { data: { message: "Campaign email sent successfully" } };
  } catch (err) {
    logEmail({ to: to_email, subject, status: "Failed", carrierId: carrier_id, createdBy: user?.id || "" });
    throw new Error(`Failed to send email: ${err.message}`);
  }
}

// --- sendStaffSalesEmail ---
async function handleSendStaffSalesEmail(body, user) {
  const { to_email, subject, body: emailBody, carrier_id, cc, bcc } = body;
  if (!to_email) throw new Error("to_email is required");

  // Check staff sales settings
  const staffSalesEnabled = getSetting("staff_sales_enabled");
  if (staffSalesEnabled === "false") {
    throw new Error("Staff sales email is disabled by admin");
  }

  try {
    await sendEmail({ to: to_email, subject, body: emailBody, cc, bcc });
    logEmail({ to: to_email, subject, status: "Sent", carrierId: carrier_id || "", createdBy: user?.id || "" });
    return { data: { message: "Sales email sent successfully" } };
  } catch (err) {
    logEmail({ to: to_email, subject, status: "Failed", carrierId: carrier_id || "", createdBy: user?.id || "" });
    throw new Error(`Failed to send email: ${err.message}`);
  }
}

// --- sendColdEmail ---
async function handleSendColdEmail(body, user) {
  const { carrier_id, to_email, subject, email_body, scenario, comment, queue_id, action } = body;
  if (!to_email && action === "send") throw new Error("to_email is required");

  // Get CC from settings
  const ccSetting = getSetting("email_cc_address");
  const cc = ccSetting ? [ccSetting] : undefined;

  // Count emails sent today
  const today = new Date().toISOString().slice(0, 10);
  const sentTodayRows = db.prepare(
    "SELECT * FROM generic_entities WHERE entity_name = 'EmailLog' AND json_extract(data, '$.status') = 'Sent' AND created_date LIKE ?"
  ).all(`${today}%`);
  const sentToday = sentTodayRows.length;
  const DAILY_LIMIT = 200;

  if (action === "draft") {
    return { data: { status: "Drafted", message: "Draft saved" } };
  }

  if (action === "queue") {
    return { data: { status: "Queued", message: "Email added to the cold email queue", queue_id: queue_id || genId() } };
  }

  // action === "send"
  try {
    if (sentToday >= DAILY_LIMIT) {
      return { data: { status: "Waiting", message: `Daily limit (${DAILY_LIMIT}) reached — email queued for tomorrow.`, sent_today: sentToday, limit: DAILY_LIMIT } };
    }

    await sendEmail({ to: to_email, subject, body: email_body, cc });
    logEmail({ to: to_email, subject, status: "Sent", carrierId: carrier_id, createdBy: user?.id || "" });

    // Update carrier email tracking
    if (carrier_id) {
      const carrier = getCarrier(carrier_id);
      if (carrier) {
        const nextSend = new Date();
        nextSend.setDate(nextSend.getDate() + 3);
        db.prepare("UPDATE carriers SET email_first_sent_at = COALESCE(email_first_sent_at, ?), email_sequence_step = COALESCE(email_sequence_step, 0) + 1, email_next_send_at = ?, lead_status = 'Contacted', updated_date = ? WHERE id = ?")
          .run(nowISO(), nextSend.toISOString(), nowISO(), carrier.id);
      }
    }

    return { data: { status: "Sent", sent_today: sentToday + 1, limit: DAILY_LIMIT } };
  } catch (err) {
    logEmail({ to: to_email, subject, status: "Failed", carrierId: carrier_id, createdBy: user?.id || "" });
    return { data: { status: "Failed", error: err.message } };
  }
}

// --- generateEmailContent ---
function handleGenerateEmailContent(body) {
  const { carrier_id, campaign_id } = body;
  const carrier = getCarrier(carrier_id);
  if (!carrier) throw new Error("Carrier not found");

  // If campaign_id provided, try to get campaign template
  if (campaign_id) {
    const campaignRows = db.prepare(
      "SELECT * FROM generic_entities WHERE entity_name = 'EmailCampaign' AND id = ?"
    ).get(campaign_id);
    if (campaignRows) {
      const campaign = JSON.parse(campaignRows.data);
      const subject = fillTemplate(campaign.template_subject || DEFAULT_TEMPLATES.subject, carrier);
      const emailBody = fillTemplate(campaign.template_body || DEFAULT_TEMPLATES.body, carrier);
      return { data: { subject, body: emailBody } };
    }
  }

  // Default template
  const subject = fillTemplate(DEFAULT_TEMPLATES.subject, carrier);
  const emailBody = fillTemplate(DEFAULT_TEMPLATES.body, carrier);
  return { data: { subject, body: emailBody } };
}

// --- generateColdEmail ---
function handleGenerateColdEmail(body) {
  const { carrier_id, comment, scenario } = body;
  const carrier = getCarrier(carrier_id);
  if (!carrier) throw new Error("Carrier not found");

  // Detect scenario from comment if it starts with "send email"
  let detectedScenario = scenario || "General Dispatch Introduction";
  let emailRequested = false;
  if (comment && comment.toLowerCase().startsWith("send email")) {
    emailRequested = true;
    const lowerComment = comment.toLowerCase();
    if (lowerComment.includes("high") || lowerComment.includes("pay")) detectedScenario = "High-Paying Load Opportunity";
    else if (lowerComment.includes("trial")) detectedScenario = "Complimentary Trial";
    else if (lowerComment.includes("backup")) detectedScenario = "Backup Dispatcher Offer";
    else if (lowerComment.includes("follow")) detectedScenario = "Follow-Up";
    else if (lowerComment.includes("re-engage") || lowerComment.includes("reengage")) detectedScenario = "Re-Engagement";
  }

  const template = COLD_EMAIL_SCENARIOS[detectedScenario] || COLD_EMAIL_SCENARIOS["General Dispatch Introduction"];
  const subject = fillTemplate(template.subject, carrier);
  const emailBody = fillTemplate(template.body, carrier);

  // Check for recent outreach
  const recentCount = countRecentOutreach(carrier_id);
  const hasRecent = recentCount > 0;

  // Generate staff sudo (internal tracking code)
  const staffSudo = `TL-${carrier.mc_number || carrier.usdot_number || "GEN"}-${Date.now().toString(36).toUpperCase()}`;

  return {
    data: {
      subject,
      body: emailBody,
      staff_sudo: staffSudo,
      email_requested: emailRequested,
      has_recent_outreach: hasRecent,
      recent_outreach_count: recentCount,
      scenario: detectedScenario,
    },
  };
}

// --- previewEmailFormat ---
function handlePreviewEmailFormat(body) {
  const { sequence_id, step } = body;
  const seq = FUNNEL_SEQUENCES[sequence_id] || FUNNEL_SEQUENCES.seq_1;
  const stepIndex = Math.min(step || 0, seq.steps.length - 1);
  const stepData = seq.steps[stepIndex];

  // Build a branded HTML email
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #f1f5f9; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
  .header { background: #4f46e5; padding: 24px 32px; }
  .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; }
  .header p { color: #c7d2fe; margin: 4px 0 0; font-size: 13px; }
  .body { padding: 32px; }
  .body p { line-height: 1.6; font-size: 14px; color: #334155; margin: 0 0 16px; white-space: pre-line; }
  .footer { padding: 20px 32px; border-top: 1px solid #e2e8f0; }
  .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
  .cta { display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 8px 0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tycoon Logistics</h1>
      <p>${seq.name} — Step ${stepIndex + 1}</p>
    </div>
    <div class="body">
      <p style="font-weight: 600; font-size: 16px;">${stepData.subject}</p>
      <p>${stepData.body.replace(/\n/g, "<br>")}</p>
    </div>
    <div class="footer">
      <p>Tycoon Logistics · Dispatch Services<br>tycoon@tycoonlogistics.site · 24/7/365 Support</p>
    </div>
  </div>
</body>
</html>`;

  return { data: { html } };
}

// --- runEmailBatch ---
async function handleRunEmailBatch(user) {
  // Get eligible carriers: have email, not DNC, not in terminal status
  const terminalStatuses = ["Active Client", "Do Not Contact", "Onboarding", "Human Handoff", "Interested"];
  const carriers = db.prepare("SELECT * FROM carriers WHERE email IS NOT NULL AND email != '' AND do_not_contact = 0")
    .all()
    .map((r) => ({
      ...r,
      do_not_contact: !!r.do_not_contact,
      email_sequence_complete: !!r.email_sequence_complete,
      staff_lead_status: JSON.parse(r.staff_lead_status || "[]"),
    }));

  const eligible = carriers.filter((c) => !terminalStatuses.includes(c.lead_status));
  const ccSetting = getSetting("email_cc_address");
  const cc = ccSetting ? [ccSetting] : undefined;

  let sent = 0;
  let failed = 0;
  const assigned = [];
  let lastSentHtml = "";

  // Assign funnels to unassigned carriers and send due emails
  const now = new Date();
  const funnelKeys = Object.keys(FUNNEL_SEQUENCES);

  for (const carrier of eligible) {
    // Auto-assign a funnel if not already assigned
    if (!carrier.email_funnel) {
      const funnelKey = funnelKeys[carrier.lead_score ? carrier.lead_score % funnelKeys.length : Math.floor(Math.random() * funnelKeys.length)];
      db.prepare("UPDATE carriers SET email_funnel = ?, email_sequence_step = 0, email_next_send_at = ?, updated_date = ? WHERE id = ?")
        .run(funnelKey, now.toISOString(), nowISO(), carrier.id);
      carrier.email_funnel = funnelKey;
      carrier.email_sequence_step = 0;
      assigned.push(`${carrier.legal_name || carrier.dba_name || "Unknown"} → ${FUNNEL_SEQUENCES[funnelKey].name}`);
    }

    // Check if email is due
    const isDue = !carrier.email_next_send_at || new Date(carrier.email_next_send_at) <= now;
    const sequence = FUNNEL_SEQUENCES[carrier.email_funnel];
    if (!sequence) continue;
    const step = carrier.email_sequence_step || 0;
    if (step >= sequence.steps.length) continue; // Sequence complete
    if (!isDue) continue;

    const stepData = sequence.steps[step];
    const subject = fillTemplate(stepData.subject, carrier);
    const emailBody = fillTemplate(stepData.body, carrier);

    try {
      await sendEmail({ to: carrier.email, subject, body: emailBody, cc });
      logEmail({ to: carrier.email, subject, status: "Sent", carrierId: carrier.id, createdBy: user?.id || "" });

      const nextStep = step + 1;
      const isComplete = nextStep >= sequence.steps.length;
      const nextSend = new Date();
      const delays = [3, 4, 5, 7]; // Days between steps
      nextSend.setDate(nextSend.getDate() + (delays[step] || 5));

      db.prepare("UPDATE carriers SET email_sequence_step = ?, email_next_send_at = ?, email_sequence_complete = ?, email_first_sent_at = COALESCE(email_first_send_at, ?), lead_status = CASE WHEN ? = 1 THEN lead_status ELSE 'Contacted' END, updated_date = ? WHERE id = ?")
        .run(nextStep, nextSend.toISOString(), isComplete ? 1 : 0, nowISO(), isComplete ? 1 : 0, nowISO(), carrier.id);

      sent++;
      if (sent === 1) {
        // Generate HTML preview of the first sent email
        lastSentHtml = `<div style="font-family: sans-serif; padding: 20px;"><h3>${subject}</h3><pre style="white-space: pre-wrap; font-family: sans-serif;">${emailBody}</pre></div>`;
      }
    } catch (err) {
      logEmail({ to: carrier.email, subject, status: "Failed", carrierId: carrier.id, createdBy: user?.id || "" });
      failed++;
    }

    // Limit to 50 emails per batch run
    if (sent + failed >= 50) break;
  }

  return {
    data: {
      sent,
      failed,
      eligible: eligible.length,
      assigned_count: assigned.length,
      assigned: assigned.slice(0, 20),
      last_sent_html: lastSentHtml,
      message: sent === 0 && assigned.length > 0 ? "Carriers assigned to funnels. Emails will send on the next run." : undefined,
    },
  };
}

// --- getColdEmailStats ---
function handleGetColdEmailStats() {
  const total = db.prepare("SELECT * FROM generic_entities WHERE entity_name = 'EmailLog'").all().length;
  const sent = db.prepare("SELECT * FROM generic_entities WHERE entity_name = 'EmailLog' AND json_extract(data, '$.status') = 'Sent'").all().length;
  const failed = db.prepare("SELECT * FROM generic_entities WHERE entity_name = 'EmailLog' AND json_extract(data, '$.status') = 'Failed'").all().length;
  return { data: { total, sent, failed } };
}

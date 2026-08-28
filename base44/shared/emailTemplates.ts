// Tycoon Logistics LLC — Carrier Acquisition Outbound System
// All email templates: 10 standalone cold emails, 10 multi-email sequences,
// universal follow-up framework, and objection response system.
// Placeholders: [First Name], [Company Name], [MC Number], [Equipment Type],
// [Preferred Lanes], [Fleet Size]

export const COMPANY_PROFILE = {
  legal_name: "Tycoon Logistics LLC",
  short_name: "Tycoon Logistics",
  address: "1500 N Grant St Ste R, Denver, CO 80203",
  city_state: "Denver, CO",
  website: "tycoonlogistics.online",
  email: "admin@tycoonlogistics.online",
  phone: "720-549-8518",
  logo_url: "https://media.base44.com/images/public/6a8dbfdaa29c066ecbb1f277/d50d77a35_WhatsApp_Image_2026-08-04_at_101840_PM.jpeg",
  fee_summary: "$350 flat for the first $8,000 weekly gross · 10% on revenue above $8,000",
  fee_first_threshold: "$8,000",
  fee_flat: "$350",
  fee_percentage: "10%",
};

export interface EmailTemplate {
  id: string;
  name: string;
  target: string;
  subject: string;
  body: string;
  cta: string;
}

// ──────────────────────────────────────────────────────────────
// PART 1: 10 STANDALONE COLD EMAILS
// ──────────────────────────────────────────────────────────────
export const STANDALONE_EMAILS: EmailTemplate[] = [
  {
    id: "standalone_1",
    name: "Self-Dispatch Time Reclaim",
    target: "Owner-operators running 1 truck who handle their own load booking",
    subject: "[First Name] - hours spent on load boards this week",
    body: `Hi [First Name],

Self-dispatching gives you total control over your business, but spending 15 to 20 hours a week refreshing load boards, negotiating rates, and filling out broker setup packets eats directly into your driving hours and downtime.

At Tycoon Logistics, we operate as an extension of your back office—not a manager telling you where to drive. We handle the time-consuming administrative work: searching for quality freight, negotiating rates, vetting broker creditworthiness, and handling setup paperwork. You retain 100% control over where and when you run. If you don't like a load, you don't take it.

Our pricing is simple: $350 for the first $8,000 you gross each week, and 10% on gross revenue above $8,000. Brokers pay you directly, and we invoice you weekly. There are no long-term contracts binding you.

Are you open to a quick 10-minute phone call this week to see if delegating the back-office work makes operational sense for [Company Name]?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online
tycoonlogistics.online`,
    cta: "Ask if open to a quick 10-minute phone call",
  },
  {
    id: "standalone_2",
    name: "Idle Equipment & Fleet Capacity",
    target: "Small-to-mid fleet owners (2-10 trucks) with idle capacity",
    subject: "Keeping idle trucks moving for [Company Name]",
    body: `Hi [First Name],

An idle truck sitting in the yard represents pure overhead. When driver turn-over or sudden market shifts leave you with unassigned equipment, finding consistent freight fast enough to keep overall fleet utilization high becomes a full-time challenge.

Tycoon Logistics provides on-demand back-office and dispatch capacity to keep your trucks moving. We cover lane selection, broker credit vetting, rate negotiation, and packet completion across [Equipment Type] units nationwide. We operate without forced dispatch—your team always retains the final say on every load we bring to the table.

Our standard pricing is $350 for the first $8,000 earned per truck weekly, plus 10% on revenue generated above $8,000. Brokers pay your company directly, and we invoice you weekly with zero long-term contract lock-ins.

Would you be open to replying with your current equipment count and preferred lanes so we can evaluate how we might support your fleet?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
    cta: "Reply with equipment count and preferred lanes",
  },
  {
    id: "standalone_3",
    name: "New Authority Launch & Foundations",
    target: "New MC authority holders (under 6 months active)",
    subject: "[Company Name] - MC #[MC Number] dispatch setup",
    body: `Hi [First Name],

Congratulations on getting MC #[MC Number] active. Building momentum under a new authority brings unique operational friction—specifically brokers who enforce 30, 60, or 90-day waiting periods before booking with new carriers.

At Tycoon Logistics, we help new authorities establish clean operational consistency from day one. We identify brokers who actively work with new carriers, vet their creditworthiness and days-to-pay to protect your cash flow, handle all packet submissions, and manage 24/7 route coordination. You maintain complete control over load acceptance.

Our terms are transparent: $350 flat for the first $8,000 in weekly revenue per truck, and 10% on anything above $8,000. Brokers pay you directly. We invoice weekly, and we don't bind you to long-term contracts. Additionally, we maintain direct partnerships with established factoring providers to assist with immediate cash flow if needed.

Reply with your MC number or give us a call at 720-549-8518 to discuss setting up your back office.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
Denver, CO | tycoonlogistics.online`,
    cta: "Reply with MC number or call 720-549-8518",
  },
  {
    id: "standalone_4",
    name: "Broker Vetting & Cash Flow Protection",
    target: "Established carriers frustrated by slow-paying brokers",
    subject: "Protecting [Company Name]'s cash flow on [Equipment Type]",
    body: `Hi [First Name],

Booking high-paying freight means very little if the broker drags out payments for 60+ days or hits you with unjust claims. Protecting your operational cash flow requires thorough broker vetting before wheels hit the road.

Tycoon Logistics provides full-service dispatch and administrative support focused heavily on carrier risk mitigation. Before booking any freight for your [Equipment Type] units, we run strict checks on broker creditworthiness, average days-to-pay, and market reputation. We negotiate rates, handle setup paperwork, and coordinate load details 24/7/365, while you maintain full authority to accept or decline any load.

Our fee structure is straightforward: $350 for the first $8,000 in gross weekly revenue, and 10% on revenue over $8,000. Brokers pay you directly, and we operate on a flexible week-to-week basis with no long-term contracts.

Could you drop your MC number in a quick reply so we can take a look at your preferred lanes?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
    cta: "Reply with MC number",
  },
  {
    id: "standalone_5",
    name: "Existing Dispatcher Benchmark",
    target: "Carriers using another dispatch service with poor communication",
    subject: "Benchmarking your back-office support - [Company Name]",
    body: `Hi [First Name],

If your current dispatch service forces you into lanes you dislike, fails to answer calls outside standard business hours, or takes a cut without delivering back-office value, it might be time to benchmark your options.

Tycoon Logistics operates strictly as a carrier advocate. We offer 24/7/365 dispatch coverage, disciplined broker packet handling, rate negotiation, and lane selection tailored specifically to your preferences. Crucially, we operate under a strict no-forced-dispatch policy: you retain absolute final approval on every single load.

We charge a clear, fixed structure: $350 for the first $8,000 in weekly gross revenue, and 10% on weekly revenue exceeding $8,000. Your brokers pay you directly, we invoice weekly, and we never ask for long-term contract lock-ins.

Are you open to a brief, 10-minute conversation to compare how our back-office support stacks up against your current setup?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
    cta: "Ask for a 10-minute comparison conversation",
  },
  {
    id: "standalone_6",
    name: "Fleet Growth & Scalability",
    target: "Growing fleets (3-20 trucks) seeking operational scaling",
    subject: "Scaling [Company Name]'s fleet without extra back-office overhead",
    body: `Hi [First Name],

Adding trucks to your fleet shouldn't mean doubling your administrative headaches. As fleet size increases, back-office tasks—packet management, broker credit reviews, rate negotiation, and 24/7 driver support—can slow down overall business growth.

Tycoon Logistics provides fleet owners with a scalable back-office infrastructure. We manage administrative logistics across your [Equipment Type] fleet while leaving full operational control in your hands. Additionally, through our industry network, we offer support with sourcing additional trucks through leasing or purchasing channels, alongside driver sourcing assistance.

Our service structure per truck is simple: $350 for the first $8,000 grossed each week, and 10% on revenue generated above $8,000. Direct broker-to-carrier payment keeps your accounting clean, billed weekly with zero long-term contracts.

Would you be open to a 10-minute introductory call this week to discuss back-office scaling for [Company Name]?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
Denver, CO | tycoonlogistics.online`,
    cta: "Ask for a 10-minute introductory call",
  },
  {
    id: "standalone_7",
    name: "Lane Optimization & Deadhead Reduction",
    target: "Carriers running inefficient lanes or excessive deadhead miles",
    subject: "Cutting deadhead miles for [Company Name]",
    body: `Hi [First Name],

Empty miles wipe out net profitability faster than market rate fluctuations. Running tight, repeatable corridors requires dedicated rate negotiation, constant market tracking, and proactive broker outreach long before your truck lands at a receiver.

Tycoon Logistics works with [Equipment Type] carriers to build consistent lane strategies based on your regional preferences. We spend the necessary time vetting brokers, securing load setups, and booking quality freight so you can reduce deadhead and keep your wheels rolling. You maintain full authority: no forced dispatch, ever.

Our standard fee is $350 for the first $8,000 earned each week per unit, plus 10% on gross revenue above $8,000. Brokers pay you directly, and we bill weekly without long-term contracts.

Reply with your preferred lanes and home base, or give us a call at 720-549-8518 to discuss your current routing setup.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
    cta: "Reply with preferred lanes or call 720-549-8518",
  },
  {
    id: "standalone_8",
    name: "Transparent Pricing & Financial Predictability",
    target: "Financially conscious owner-operators wanting capped costs",
    subject: "Straightforward dispatch fees for [Company Name]",
    body: `Hi [First Name],

Unpredictable dispatch fees and percentage takes can make cash flow projection difficult for independent carriers. We believe back-office pricing should be as clear and predictable as your fixed operational costs.

At Tycoon Logistics, our model is simple:
• First $8,000 in weekly revenue: $350 flat service fee.
• Revenue above $8,000: 10% on the excess amount.

All brokers pay your company directly—we never touch your freight revenue upfront. We invoice you weekly for our services. There are no forced dispatches and no long-term contracts binding your business. You retain total operational freedom while gaining 24/7/365 back-office support, broker credit vetting, packet completion, and rate negotiation.

Would you be open to visiting tycoonlogistics.online or taking a quick 10-minute call to see how this fits your weekly gross targets?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
1500 N Grant St Ste R, Denver, CO 80203
720-549-8518 | admin@tycoonlogistics.online`,
    cta: "Visit tycoonlogistics.online or take a 10-minute call",
  },
  {
    id: "standalone_9",
    name: "Owner-Operator Lifestyle & Admin Offload",
    target: "Single-truck owner-operators experiencing admin burnout",
    subject: "Offloading the back office for [Company Name]",
    body: `Hi [First Name],

Driving nationwide is hard enough without having to negotiate rates at truck stops, complete broker packets late at night, or handle detention disputes on the road.

Tycoon Logistics provides comprehensive back-office administrative support built for independent owner-operators running [Equipment Type]. We handle the time-consuming tasks: searching load boards, vetting broker payment histories, executing rate confirmations, and offering round-the-clock dispatch support. You retain total authority over your schedule—we operate with strict no-forced-dispatch policies.

Our service fee is $350 for the first $8,000 grossed each week, and 10% on weekly revenue above $8,000. Brokers pay you directly, and we invoice you weekly with zero long-term commitments.

Are you open to a brief 10-minute chat this week to discuss how we can take the administrative weight off your shoulders?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
    cta: "Ask for a brief 10-minute chat",
  },
  {
    id: "standalone_10",
    name: "Strategic Logistics Partnership",
    target: "Mid-sized fleet owners wanting high-touch partnership",
    subject: "Logistics partnership for [Company Name]",
    body: `Hi [First Name],

Finding a back-office provider that operates as a true strategic partner rather than a transactional load-booker is rare in today's logistics environment.

Tycoon Logistics is currently selecting established carriers operating [Equipment Type] units for long-term operational alignment. We serve as your full-service logistics back office: managing rate negotiations, conducting broker credit evaluations, processing broker setups, optimizing lanes, and providing 24/7/365 operational coverage. You retain complete authority over all load decisions, backed by zero forced dispatch policies and zero long-term contracts.

Our fee structure is transparent: $350 per truck for the first $8,000 in weekly revenue, and 10% on revenue generated above $8,000. Brokers pay your company directly, and we bill weekly. Additionally, we provide factoring access partners and truck/driver growth support to assist as your operations expand.

If you are open to exploring a dedicated back-office partnership, please send a reply with your MC number or call us directly at 720-549-8518.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
1500 N Grant St Ste R, Denver, CO 80203
tycoonlogistics.online`,
    cta: "Reply with MC number or call 720-549-8518",
  },
];

// ──────────────────────────────────────────────────────────────
// PART 2: 10 MULTI-EMAIL SEQUENCES (5 emails each: initial + 3 follow-ups + breakup)
// Sequence spacing: Day 0, Day 3, Day 7, Day 12, Day 19
// ──────────────────────────────────────────────────────────────
export interface SequenceEmail {
  step: number;   // 0 = initial, 1-3 = follow-ups, 4 = breakup
  day: number;    // day offset from initial send
  subject: string;
  body: string;
}

export interface Sequence {
  id: string;
  name: string;
  target: string;
  emails: SequenceEmail[];
}

export const SEQUENCE_SPACING = [0, 3, 7, 12, 19];

export const SEQUENCES: Sequence[] = [
  {
    id: "seq_1",
    name: "Self-Dispatch Time Reclaim",
    target: "Independent owner-operators who currently self-dispatch",
    emails: [
      {
        step: 0, day: 0,
        subject: "[First Name] - hours spent on load boards this week",
        body: `Hi [First Name],

Self-dispatching gives you total control over your business, but spending 15 to 20 hours a week refreshing load boards, negotiating rates, and filling out broker setup packets eats directly into your driving hours and downtime.

At Tycoon Logistics, we operate as an extension of your back office—not a manager telling you where to drive. We handle the time-consuming administrative work: searching for quality freight, negotiating rates, vetting broker creditworthiness, and handling setup paperwork. You retain 100% control over where and when you run.

Our pricing is simple: $350 for the first $8,000 you gross each week, and 10% on gross revenue above $8,000. Brokers pay you directly, and we invoice you weekly with zero long-term contracts.

Are you open to a quick 10-minute phone call this week to see if delegating the back-office work makes sense for [Company Name]?

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "Re: [First Name] - hours spent on load boards this week",
        body: `Hi [First Name],

Following up on my note from earlier this week. Most single-truck operators we talk to spend at least two full hours a day on administrative tasks—broker phone calls, credit checks, packet submissions, and check-calls. That is 10 to 14 hours every week that could be spent resting, spending time with family, or keeping wheels moving.

Because we operate with strict no-forced-dispatch policies, you retain complete authority over your load selection while we take those hours off your plate.

Would you be open to a quick 5-minute call tomorrow to discuss how we handle back-office management?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Packet completion & broker checks for [Company Name]",
        body: `Hi [First Name],

Beyond basic load searching, one of the biggest friction points in self-dispatching is filling out setup packets and verifying broker credibility. When you work with Tycoon Logistics, we execute packet submission immediately and run checks on broker credit terms and average days-to-pay before you lock in a load. That way, you avoid slow payers and administrative delays.

Our fee remains $350 flat for the first $8,000 grossed each week (10% over $8,000), with direct broker payment to you.

Would you be open to sending over your preferred lanes so we can show you how we structure load selection?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Cash flow support for [Company Name]",
        body: `Hi [First Name],

Quick operational note: if cash flow timing is ever a bottleneck while managing your own back office, we also connect our partner carriers with established factoring channels to ensure quick funding turns.

Combined with our 24/7 dispatch support and zero long-term contract lock-ins, our goal is to streamline your entire operational workflow.

Are you free for a 10-minute call this week?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Closing out - [Company Name] back office",
        body: `Hi [First Name],

I haven't heard back, so I assume you have your load booking and back-office administrative routine fully streamlined at [Company Name]. I won't clutter your inbox further. If you ever want to reduce your administrative workload without giving up operational control, keep our information on file:
• Phone: 720-549-8518
• Email: admin@tycoonlogistics.online
• Web: tycoonlogistics.online

Safe driving out there.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_2",
    name: "Fleet Scaling & Capacity Support",
    target: "Small-to-mid fleet owners (2-10 trucks)",
    emails: [
      {
        step: 0, day: 0,
        subject: "Keeping idle trucks moving for [Company Name]",
        body: `Hi [First Name],

An idle truck sitting in the yard represents pure overhead. When driver turnover or sudden market shifts leave you with unassigned equipment, finding consistent freight fast enough to keep fleet utilization high becomes a major operational hurdle.

Tycoon Logistics provides on-demand back-office and dispatch capacity to keep your trucks moving. We cover lane selection, broker credit vetting, rate negotiation, and packet completion across [Equipment Type] units nationwide—with no forced dispatch.

Our pricing is $350 for the first $8,000 earned per truck weekly, plus 10% on revenue generated above $8,000. Brokers pay your company directly, and we invoice you weekly with zero long-term contracts.

Would you be open to replying with your current equipment count and preferred lanes to discuss operational fit?

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "Re: Keeping idle trucks moving for [Company Name]",
        body: `Hi [First Name],

Reaching back out regarding fleet support for [Company Name]. In addition to handling dispatch and back-office administration, we assist our fleet partners with driver sourcing and truck sourcing (via leasing/purchasing channels) when expansion opportunities arise.

We aim to serve as a complete operational partner, letting you add capacity without overloading your internal back office.

Do you have 10 minutes this week for a brief conversation on how we support fleet operations?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Multi-unit back-office accounting for [Company Name]",
        body: `Hi [First Name],

Managing dispatch costs across multiple power units requires financial clarity. Our pricing applies per unit: $350 flat for the first $8,000 grossed per truck each week, and 10% on any gross above $8,000.

Because brokers pay your carrier authority directly, you maintain full control of gross revenue, and we bill weekly for administrative services rendered. No hidden fees, no percentage traps, and no long-term contracts.

Can I send over a quick summary of our carrier service agreement for you to review?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "24/7/365 coverage for [Company Name]'s drivers",
        body: `Hi [First Name],

When running multiple trucks, issues don't just happen during standard 9-to-5 business hours. Receiver delays, rate adjustments, and route changes happen around the clock.

Tycoon Logistics provides 24/7/365 dispatch and operational support, giving your drivers immediate assistance whenever they are on the road.

Are you available for a quick phone call at 720-549-8518 to discuss your fleet's current coverage setup?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Fleet dispatch support - [Company Name]",
        body: `Hi [First Name],

Assuming fleet dispatch and back-office capacity are well in hand at [Company Name] right now. I'll step back for now. Should you face sudden capacity spikes, driver changes, or need temporary dispatch support down the road, feel free to reach out directly to admin@tycoonlogistics.online or call 720-549-8518.

Wishing [Company Name] continued success.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_3",
    name: "New MC Authority Carrier Acceleration",
    target: "New authorities (MC active under 6 months)",
    emails: [
      {
        step: 0, day: 0,
        subject: "[Company Name] - MC #[MC Number] dispatch setup",
        body: `Hi [First Name],

Congratulations on getting MC #[MC Number] active. Building momentum under a new authority brings unique operational friction—specifically brokers who enforce 30, 60, or 90-day waiting periods before booking with new carriers.

At Tycoon Logistics, we help new authorities establish clean operational consistency from day one. We identify brokers who actively work with new carriers, vet their creditworthiness and days-to-pay, handle all setup packets, and manage 24/7 route coordination. You maintain complete control over load acceptance.

Our terms are transparent: $350 flat for the first $8,000 in weekly revenue, and 10% on anything above $8,000. Brokers pay you directly with zero long-term contracts.

Reply with your MC number or give us a call at 720-549-8518 to discuss setting up your back office.

Best regards,
Dispatcher Team | Tycoon Logistics LLC | tycoonlogistics.online`,
      },
      {
        step: 1, day: 3,
        subject: "Navigating broker aging restrictions - MC #[MC Number]",
        body: `Hi [First Name],

Following up on MC #[MC Number]. The biggest hurdle for new authorities is finding non-restricted, reliable brokers that pay fairly. We maintain an updated database of broker requirements, knowing exactly who will load new MCs immediately and who requires credit or age workarounds.

This saves you hours of getting turned down on load calls.

Would you be open to a 5-minute call to discuss setup options for your equipment type?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Cash flow solutions for new authority MC #[MC Number]",
        body: `Hi [First Name],

Managing cash flow during your first few months on active authority is critical. Waiting 30 days for broker payments can stall your operations quickly.

We partner directly with established factoring companies to help new carriers get same-day or next-day funding while building up their credit history.

Are you open to discussing how we combine factoring setup with daily dispatch operations?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Operational freedom for [Company Name]",
        body: `Hi [First Name],

As a new authority, the last thing you need is a rigid dispatch contract locking you into poor terms. With Tycoon Logistics, you operate week-to-week. If you don't like a load, you decline it. If you want to pause service, you pause it. You stay in complete control of your business while leveraging our back-office resources.

Can we schedule a 10-minute introductory call this week?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Checking off - MC #[MC Number]",
        body: `Hi [First Name],

I'll stop reaching out regarding MC #[MC Number]. I know how busy the initial launching phase is for new carriers. Save my contact info for down the road if you ever need back-office support, broker packet assistance, or dispatch capacity:
• Direct Line: 720-549-8518
• Email: admin@tycoonlogistics.online

Best of luck building [Company Name].

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_4",
    name: "Broker Quality & Risk Mitigation",
    target: "Carriers concerned with creditworthiness, slow pay, and broker vetting",
    emails: [
      {
        step: 0, day: 0,
        subject: "Protecting [Company Name]'s cash flow on [Equipment Type]",
        body: `Hi [First Name],

Booking high-paying freight means very little if the broker drags out payments for 60+ days or hits you with unjust claims. Protecting operational cash flow requires thorough broker vetting before wheels hit the road.

Tycoon Logistics provides full-service dispatch and administrative support focused heavily on carrier risk mitigation. Before booking freight for your [Equipment Type] units, we run strict checks on broker creditworthiness, average days-to-pay, and market reputation. We negotiate rates, handle setup paperwork, and coordinate load details 24/7/365—with zero forced dispatch.

Our fee structure is simple: $350 for the first $8,000 in weekly revenue, and 10% on revenue over $8,000. Brokers pay you directly, billed weekly with no long-term contracts.

Could you drop your MC number in a quick reply so we can take a look at your preferred lanes?

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "Re: Protecting [Company Name]'s cash flow on [Equipment Type]",
        body: `Hi [First Name],

Following up on broker credit protection. A freight rate might look great on paper, but if the broker has a 65-day average pay score or a history of claims disputes, that load costs you money in the long run.

We run every broker through rigorous credit checks prior to pitching you the load. If they don't meet strict payment standards, we don't present them to you.

Would you be open to a 10-minute call to discuss our vetting criteria?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Handling broker paperwork & disputes for [Company Name]",
        body: `Hi [First Name],

When broker issues arise—such as detention pay disputes, layover fees, or missing rate confirmation details—our administrative team steps in to handle communications directly. We enforce clear rate confirmations and make sure detention and accessorial terms are documented before loading, saving you from back-and-forth arguments after delivery.

Are you free for a quick chat this week regarding your current back-office support?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Direct payment security for [Company Name]",
        body: `Hi [First Name],

Just to be completely clear on our financial structure: Tycoon Logistics never touches your gross freight payment. Brokers pay [Company Name] directly according to your agreed billing terms or factoring arrangements. We simply invoice you weekly for our dispatch and administrative service ($350 for first $8,000 / 10% on balance).

Would you be interested in testing our support on a load or two?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Closing inquiry - [Company Name]",
        body: `Hi [First Name],

It seems you've got your broker vetting and carrier administration well covered right now. I'll step aside. If you ever run into broker credit issues or need back-office reinforcement, keep our details handy:
• Phone: 720-549-8518
• Email: admin@tycoonlogistics.online
• Web: tycoonlogistics.online

Safe miles ahead.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_5",
    name: "No Forced Dispatch Operational Freedom",
    target: "Carriers running under strict/controlling dispatchers",
    emails: [
      {
        step: 0, day: 0,
        subject: "Benchmarking your back-office support - [Company Name]",
        body: `Hi [First Name],

If your current dispatch service forces you into lanes you dislike, fails to answer calls outside standard business hours, or takes a cut without delivering true back-office value, it might be time to benchmark your options.

Tycoon Logistics operates strictly as a carrier advocate. We offer 24/7/365 dispatch coverage, disciplined broker packet handling, rate negotiation, and lane selection tailored to your preferences. Crucially, we operate under a strict no-forced-dispatch policy: you retain absolute final approval on every single load.

We charge a clear, fixed structure: $350 for the first $8,000 in weekly gross revenue, and 10% on weekly revenue exceeding $8,000. Your brokers pay you directly, we invoice weekly, and we never ask for long-term contract lock-ins.

Are you open to a brief, 10-minute conversation to compare how our back-office support stacks up against your current setup?

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "Total load acceptance authority for [Company Name]",
        body: `Hi [First Name],

Following up on my previous note. "No forced dispatch" shouldn't just be a marketing phrase—it should be an operational reality. When we present a load, we bring you full details: broker credit, rate breakdown, pickup/delivery times, and lane conditions. If it doesn't meet your standard, you say no, and we present the next best option.

You are always the owner of your business. Open to a quick 5-minute call to discuss your ideal load criteria?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Eliminating broker setup friction",
        body: `Hi [First Name],

When you do approve a load, speed matters. Our back-office team submits setup packets, certificate of insurance requests, and rate confirmations within minutes so you don't lose quality freight while sitting at a stop.

We take care of the desk work while you maintain complete decision control.

Could you reply with your preferred equipment type and home operating region?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "No long-term lock-in for [Company Name]",
        body: `Hi [First Name],

We don't ask carriers to sign binding long-term dispatch contracts because we believe our performance should earn your business week after week. If our support doesn't make your operation smoother and more profitable, you can walk away at any time without penalty.

Are you free for a brief call at 720-549-8518 this week?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Moving on - [Company Name] dispatch",
        body: `Hi [First Name],

Looks like you're completely satisfied with your current dispatch setup at [Company Name]. I won't continue to reach out. If anything changes down the line, feel free to contact us anytime at admin@tycoonlogistics.online or 720-549-8518.

Wishing you profitable runs ahead.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_6",
    name: "Deadhead & Lane Optimization",
    target: "Carriers seeking better regional routing and reduced empty miles",
    emails: [
      {
        step: 0, day: 0,
        subject: "Cutting deadhead miles for [Company Name]",
        body: `Hi [First Name],

Empty miles wipe out net profitability faster than market rate fluctuations. Running tight, repeatable corridors requires dedicated rate negotiation, constant market tracking, and proactive broker outreach long before your truck lands at a receiver.

Tycoon Logistics works with [Equipment Type] carriers to build consistent lane strategies based on your regional preferences. We spend the necessary time vetting brokers, securing load setups, and booking quality freight so you can reduce deadhead and keep your wheels rolling. You maintain full authority: no forced dispatch, ever.

Our standard fee is $350 for the first $8,000 earned each week per unit, plus 10% on gross revenue above $8,000. Brokers pay you directly, and we bill weekly without long-term contracts.

Reply with your preferred lanes and home base, or give us a call at 720-549-8518 to discuss your current routing setup.

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "Pre-booking strategy for [Company Name]",
        body: `Hi [First Name],

The key to cutting deadhead is working on your reload before your driver ever reaches the destination. Our team tracks incoming drop-offs and initiates broker negotiations for return or outbound freight hours in advance, keeping your equipment moving smoothly without long layovers.

Would you be open to sharing your top 2 preferred lanes so we can run a quick market evaluation?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "[Equipment Type] lane management",
        body: `Hi [First Name],

Different equipment types require completely different operational tactics—flatbed securement timing, reefer temperature compliance, or box truck dock availability all impact lane efficiency. We tailor our rate negotiations and broker packet setups specifically around [Equipment Type] requirements to avoid wasted time at shipper facilities.

Do you have 10 minutes this week for a phone call?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Predictable operational cost structure",
        body: `Hi [First Name],

Optimizing lanes is about maximizing net profit, not just gross revenue. Our $350 flat rate on the first $8,000 weekly gross (and 10% above $8,000) guarantees that as lane performance improves, your overhead remains clear and predictable.

Can we connect for 5 minutes today at 720-549-8518?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Closing lane optimization inquiry",
        body: `Hi [First Name],

I haven't heard back, so I assume [Company Name] has its lane schedules and back-office logistics fully covered. I'll stop my follow-ups here. If you ever need back-office assistance optimizing deadhead or finding freight on specific corridors, reach out to admin@tycoonlogistics.online.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_7",
    name: "Transparent Financial Structure",
    target: "Cost-conscious carriers looking for clear pricing terms",
    emails: [
      {
        step: 0, day: 0,
        subject: "Straightforward dispatch fees for [Company Name]",
        body: `Hi [First Name],

Unpredictable dispatch fees and percentage takes can make cash flow projection difficult for independent carriers. We believe back-office pricing should be as clear and predictable as your fixed operational costs.

At Tycoon Logistics, our model is simple:
• First $8,000 in weekly revenue: $350 flat service fee.
• Revenue above $8,000: 10% on the excess amount.

All brokers pay your company directly—we never touch your freight revenue upfront. We invoice you weekly for our services. There are no forced dispatches and no long-term contracts binding your business. You retain total operational freedom while gaining 24/7/365 back-office support, broker credit vetting, packet completion, and rate negotiation.

Would you be open to visiting tycoonlogistics.online or taking a quick 10-minute call to see how this fits your weekly gross targets?

Best regards,
Dispatcher Team | Tycoon Logistics LLC | Denver, CO`,
      },
      {
        step: 1, day: 3,
        subject: "Re: Straightforward dispatch fees for [Company Name]",
        body: `Hi [First Name],

To make our fee breakdown crystal clear for [Company Name]:
• If your truck grosses $7,500 in a week: Your fee is flat $350.
• If your truck grosses $10,000 in a week: Your fee is $350 (for the first $8k) + $200 (10% of the remaining $2,000) = $550 total.

You keep total control of your cash flow, brokers pay you directly, and we handle the back-office grinding.

Would you be open to a quick call to talk through your weekly gross targets?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Operational flexibility for [Company Name]",
        body: `Hi [First Name],

Many dispatch agencies charge high percentage cuts while tying carriers down with 6-month or 1-year binding contracts. At Tycoon Logistics, we operate on a flexible week-to-week basis. If you decide to self-dispatch, pause operations, or change directions, you are free to do so with zero cancellation penalties.

Are you open to testing our back-office service on your next run?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Full back-office inclusion - no extra fees",
        body: `Hi [First Name],

Quick reminder on what our $350 / 10% structure includes for [Company Name]:
• Full load searching & rate negotiation
• Complete broker packet execution & COI dispatch
• Thorough broker credit checking & days-to-pay verification
• 24/7/365 operational support for your drivers

No add-on charges or administrative fees. Can we schedule a 10-minute introductory call this week?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Closing out - Tycoon Logistics terms",
        body: `Hi [First Name],

I'll assume our pricing structure isn't what [Company Name] is looking for right now. I will stop reaching out. Should you ever want transparent, week-to-week back-office support, you can review our terms anytime at tycoonlogistics.online or call 720-549-8518.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_8",
    name: "24/7/365 Back-Office & Driver Support",
    target: "Carriers running long-haul or multi-shift routes needing continuous coverage",
    emails: [
      {
        step: 0, day: 0,
        subject: "24/7 administrative support for [Company Name]",
        body: `Hi [First Name],

Trucking doesn't stop at 5:00 PM, and administrative headaches certainly don't either. Delayed shippers, after-hours rate confirmations, and late-night check-calls require active attention no matter what time zone your driver is in.

Tycoon Logistics provides full-service 24/7/365 back-office and dispatch management for [Equipment Type] carriers nationwide. We handle broker credit checks, setup paperwork, rate negotiation, and live route support day and night—giving you real operational stability. You keep complete authority over load selection with our strict no-forced-dispatch policy.

Our rate structure is simple: $350 for the first $8,000 earned weekly, and 10% on gross revenue exceeding $8,000. Brokers pay you directly, billed weekly with no long-term contracts.

Reply with your MC number or call us at 720-549-8518 to discuss 24/7 coverage options.

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "After-hours freight support for [Company Name]",
        body: `Hi [First Name],

Following up on 24/7 coverage. When a driver encounters a gate issue or loading dock delay at 10 PM, waiting until 8 AM the next morning for a dispatcher to wake up costs you time and money.

Our team maintains continuous dispatch presence to resolve broker delays, update ETAs, and request detention pay in real time.

Would you be open to a 10-minute conversation to see how this fits your operation?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Weekend & evening broker credit checks",
        body: `Hi [First Name],

Booking weekend freight often means dealing with limited broker staff and higher risk of communication breakdowns. We perform credit checks and process setup packets even during off-hours, ensuring your equipment stays moving without security risks or delays.

Could you send over your primary running lanes to see how we can assist?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Clear fee structure for 24/7 support",
        body: `Hi [First Name],

Continuous 24/7 coverage shouldn't come with enterprise price tags. Our standard structure remains $350 for the first $8,000 grossed each week, and 10% on revenue over $8,000 per truck. Direct broker payment to you, invoiced weekly with no long-term contract.

Are you free for a 5-minute phone call today?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Closing 24/7 support inquiry - [Company Name]",
        body: `Hi [First Name],

I'll assume your current back-office arrangements fully cover your 24/7 operational needs. I won't send any more emails. If you ever need round-the-clock administrative back-office support, feel free to call 720-549-8518 or email admin@tycoonlogistics.online.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_9",
    name: "Growth & Equipment Expansion Partner",
    target: "Carriers looking to add power units or upgrade equipment",
    emails: [
      {
        step: 0, day: 0,
        subject: "Truck & driver growth support for [Company Name]",
        body: `Hi [First Name],

Growing a freight business requires more than just booking loads—it requires access to hardware, reliable drivers, and sustainable back-office management.

Tycoon Logistics helps active carriers expand efficiently. Beyond core 24/7 dispatching, rate negotiations, broker credit checks, and setup packet handling, we assist our carrier partners with sourcing additional trucks through leasing/purchasing channels and driver sourcing support.

Our structure is built to scale: $350 for the first $8,000 grossed per truck weekly, and 10% on revenue above $8,000. Brokers pay your company directly, and we operate with zero long-term contract lock-ins and zero forced dispatch.

Would you be open to a 10-minute call this week to discuss expansion plans for [Company Name]?

Best regards,
Dispatcher Team | Tycoon Logistics LLC | 720-549-8518`,
      },
      {
        step: 1, day: 3,
        subject: "Equipment sourcing for [Company Name]",
        body: `Hi [First Name],

Following up on my previous note. Finding quality equipment without overpaying is a key bottleneck for growing carriers. Through our industry relationships, we help direct carriers toward reputable truck leasing and purchasing channels, helping you put reliable units on the road while we manage the operational setup.

Open to a brief conversation regarding your equipment plans for this year?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Driver sourcing assistance for [Company Name]",
        body: `Hi [First Name],

Finding dependable drivers who protect your equipment and maintain schedule integrity is another major challenge. When expanding your fleet, we assist in connecting you with qualified driver channels, helping keep your new trucks rolling quickly.

Would you be interested in learning how we combine driver support with our dispatch services?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Back-office foundation for fleet expansion",
        body: `Hi [First Name],

As you scale capacity, our back-office team ensures that your pricing and payment structures remain totally transparent.
• Brokers pay your authority directly.
• We invoice weekly: $350 for the first $8,000 grossed per unit, 10% over $8,000.
• No long-term contracts.

Can we set up a quick 10-minute introduction call this week?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Closing growth inquiry - [Company Name]",
        body: `Hi [First Name],

It looks like fleet growth support isn't a priority for [Company Name] at this moment. I'll step back. If you decide to expand your fleet or need back-office support down the road, reach out to us at admin@tycoonlogistics.online or visit tycoonlogistics.online.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
  {
    id: "seq_10",
    name: "Premium Consultative Carrier Partnership",
    target: "Selective, high-performing established carriers",
    emails: [
      {
        step: 0, day: 0,
        subject: "Logistics partnership for [Company Name]",
        body: `Hi [First Name],

Finding a back-office provider that operates as a true strategic partner rather than a transactional load-booker is rare in today's logistics environment.

Tycoon Logistics is currently selecting established carriers operating [Equipment Type] units for long-term operational alignment. We serve as your full-service logistics back office: managing rate negotiations, conducting broker credit evaluations, processing broker setups, optimizing lanes, and providing 24/7/365 operational coverage. You retain complete authority over all load decisions, backed by zero forced dispatch policies and zero long-term contracts.

Our fee structure is transparent: $350 per truck for the first $8,000 in weekly revenue, and 10% on revenue generated above $8,000. Brokers pay your company directly, and we bill weekly.

If you are open to exploring a dedicated back-office partnership, please send a reply with your MC number or call us directly at 720-549-8518.

Best regards,
Dispatcher Team | Tycoon Logistics LLC | Denver, CO`,
      },
      {
        step: 1, day: 3,
        subject: "Re: Logistics partnership for [Company Name]",
        body: `Hi [First Name],

Following up on my message. We purposefully limit the number of carriers assigned to each of our dispatch managers. This ensures your operations get dedicated focus, fast broker setup response times, and thoughtful lane positioning rather than high-volume, generic load-booking.

We view our role as an advocate for your business at every step. Would you be open to a 10-minute introduction call to evaluate mutual fit?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 2, day: 7,
        subject: "Credit security & back-office protection",
        body: `Hi [First Name],

A primary duty in our strategic model is protecting your bottom line. We perform rigorous credit and reputation checks on every broker before submitting packets, protecting [Company Name] from non-payment and excessive claims exposure.

Combined with our week-to-week flexibility and direct broker payment, your cash flow stays safe. Can we schedule a short conversation this week?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 3, day: 12,
        subject: "Overview of Tycoon Logistics partnership terms",
        body: `Hi [First Name],

If you haven't had a chance yet, feel free to review our business background and service scope at tycoonlogistics.online. We stand by our simple structure ($350 for first $8k / 10% above), zero forced dispatch, and full operational control for the carrier.

Are you open to a brief call this week to discuss your current operational setup?

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
      {
        step: 4, day: 19,
        subject: "Final note - Tycoon Logistics partnership",
        body: `Hi [First Name],

I'll assume the timing isn't right for [Company Name] to explore a back-office partnership. I will stop following up. If you decide to evaluate strategic back-office management in the future, you can reach our Denver office directly:
• Phone: 720-549-8518
• Email: admin@tycoonlogistics.online
• Web: tycoonlogistics.online

Thank you for your time and safe driving.

Best regards,
Dispatcher Team | Tycoon Logistics LLC`,
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────
// PART 3: UNIVERSAL FOLLOW-UP FRAMEWORK & OBJECTION RESPONSES
// ──────────────────────────────────────────────────────────────
export interface FollowUpTemplate {
  id: string;
  day: number;
  name: string;
  subject: string;
  body: string;
}

export const UNIVERSAL_FOLLOWUPS: FollowUpTemplate[] = [
  {
    id: "followup_1", day: 3, name: "Context Anchor & Core Value",
    subject: "Re: [Original Subject Line]",
    body: `Hi [First Name],

Following up on my previous email regarding back-office support for [Company Name].

Whether your primary focus right now is cutting down administrative load-board hours, securing cleaner lanes, or protecting cash flow with pre-screened brokers, our role is to execute the desk work while leaving 100% of the operational control in your hands.

As a reminder, our service structure is completely transparent: $350 for the first $8,000 earned weekly per truck, and 10% on revenue above $8,000. Brokers pay you directly, and we work week-to-week with zero long-term contract lock-ins.

Would you be open to a 5-minute phone call to see how this aligns with your current operational needs?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
  },
  {
    id: "followup_2", day: 7, name: "Operational Friction Reduction",
    subject: "Re: [Original Subject Line]",
    body: `Hi [First Name],

I know keeping wheels moving leaves little time to evaluate back-office services.

To keep things as effortless as possible: if you reply with your MC number and equipment type, we can perform a quick lane evaluation and share how we would handle packet setup, broker credit checks, and load coordination for your specific setup.

You remain under no obligation, and we operate strictly with no forced dispatch.

Can we set up a brief, 10-minute call this week?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | tycoonlogistics.online`,
  },
  {
    id: "followup_3", day: 12, name: "Direct Question / Core Alignment",
    subject: "Quick question regarding [Company Name]'s back office",
    body: `Hi [First Name],

Quick question: Are you currently open to delegating your back-office paperwork, broker setup packets, and load searching if it preserves your complete freedom on load acceptance?

Our carriers keep full authority over their schedule, receive direct payments from brokers, and pay a transparent weekly fee ($350 for the first $8,000 / 10% above).

If you are open to exploring this, let me know a convenient time for a brief 5-minute call, or call us directly at 720-549-8518.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
admin@tycoonlogistics.online`,
  },
  {
    id: "followup_4", day: 19, name: "Professional Sign-Off",
    subject: "Closing our communication - [Company Name]",
    body: `Hi [First Name],

I haven't heard back, so I'll assume evaluating back-office support isn't a priority for [Company Name] right now.

I won't send any further emails. If your operational situation changes and you need 24/7 back-office management, broker packet handling, or rate negotiation support, please feel free to reach out:
• Phone: 720-549-8518
• Email: admin@tycoonlogistics.online
• Web: tycoonlogistics.online

Wishing you safe routes and profitable operations.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
1500 N Grant St Ste R, Denver, CO 80203`,
  },
];

export interface ObjectionResponse {
  id: string;
  scenario: string;
  subject: string;
  body: string;
}

export const OBJECTION_RESPONSES: ObjectionResponse[] = [
  {
    id: "obj_1", scenario: "Prospect replies 'Send me more information'",
    subject: "Tycoon Logistics - Back-Office Service & Fee Breakdown",
    body: `Hi [First Name],

Thanks for reaching out. Here is a clear overview of how Tycoon Logistics operates as your back-office partner:

Core Services Provided:
• Load Booking & Rate Negotiation: Dedicated load searching matching your regional preferences.
• Broker Vetting & Credit Checks: Complete screening of broker creditworthiness and average days-to-pay before booking.
• Administrative Handling: Rapid completion and submission of broker setup packets, rate confirmations, and COI requests.
• 24/7/365 Operational Support: Live coverage for issue resolution, shipper/receiver delays, and detention tracking.
• Growth & Cash Flow Tools: Direct connection to factoring partners, plus assistance with truck/driver sourcing when expanding.

Pricing & Payment Structure:
• Weekly Fee: $350 flat fee for the first $8,000 in gross revenue earned per truck.
• High-Gross Share: 10% fee on weekly gross revenue generated above $8,000.
• Payment Flow: Brokers pay your company directly. Tycoon Logistics invoices you weekly for administrative services.
• Contract Terms: No long-term contracts (week-to-week flexibility) and strict No Forced Dispatch.

Are you free for a quick 10-minute call tomorrow or Thursday to discuss your equipment type and preferred lanes?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | tycoonlogistics.online`,
  },
  {
    id: "obj_2", scenario: "Prospect replies 'I already have a dispatcher'",
    subject: "Re: [Original Subject Line]",
    body: `Hi [First Name],

Understood, and thanks for letting me know. Many of the carriers we partner with were working with other dispatchers before switching to us.

Common reasons carriers keep us in mind as a benchmark or backup include:
• Strict No-Forced-Dispatch: Complete control over every single acceptance decision.
• Transparent Pricing: Capped pricing at $350 for the first $8k gross weekly (10% on excess) with direct broker payments.
• 24/7/365 Coverage: Continuous support for drivers after standard office hours.
• No Long-Term Contracts: Operating week-to-week on performance rather than locked commitments.

If you ever experience downtime, poor communication, or forced lanes with your current provider, keep our number handy: 720-549-8518.

Would it be alright if I check back in with you in a few months to see how your operations are running?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
admin@tycoonlogistics.online`,
  },
  {
    id: "obj_3", scenario: "Prospect replies 'I self-dispatch'",
    subject: "Re: [Original Subject Line]",
    body: `Hi [First Name],

That makes complete sense. Running your own dispatch gives you absolute control over your operation.

Where we help self-dispatchers is by serving as a pure administrative back office. You retain 100% decision authority on what loads you take, while we take care of time-consuming tasks:
• Refreshing load boards and calling brokers while you drive.
• Completing tedious setup packets and requesting rate confirmations.
• Running credit checks on unfamiliar brokers before you commit.

Because we charge $350 for the first $8,000 grossed weekly (10% over $8,000) with zero long-term contracts, many self-dispatchers use us to buy back 15+ hours of their time each week without giving up control.

If you are ever open to testing our back-office support on a trial basis, give us a call at 720-549-8518.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
tycoonlogistics.online`,
  },
  {
    id: "obj_4", scenario: "Prospect replies 'Not interested'",
    subject: "Re: [Original Subject Line]",
    body: `Hi [First Name],

Understood—thanks for the quick response. I will remove [Company Name] from our outreach list right away.

If you ever need back-office dispatch support or broker packet management in the future, feel free to visit us at tycoonlogistics.online or call 720-549-8518.

Safe driving out there.

Best regards,
Dispatcher Team
Tycoon Logistics LLC`,
  },
  {
    id: "obj_5", scenario: "Prospect replies 'How much do you charge?'",
    subject: "Tycoon Logistics - Simple Fee Breakdown",
    body: `Hi [First Name],

Our pricing structure is completely transparent and designed to protect your weekly baseline cash flow:
• First $8,000 Earned Weekly: Flat service fee of $350 per truck.
• Revenue Above $8,000: 10% service fee on the gross amount earned above $8,000.

Financial Rules:
1. Direct Payment: Brokers pay your carrier authority directly—we never hold or touch your freight revenue.
2. Weekly Invoicing: We invoice you weekly for our back-office services rendered.
3. No Hidden Terms: No setup charges, no long-term contracts, and strict no forced dispatch.

For example, if your truck grosses $7,000 in a week, your fee is $350. If your truck grosses $10,000, your fee is $350 + $200 (10% of $2,000) = $550 total.

Would you be open to a 5-minute phone call to see how this fits your operational targets?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
  },
  {
    id: "obj_6", scenario: "Prospect replies 'What equipment do you handle?'",
    subject: "Tycoon Logistics - Supported Equipment Types",
    body: `Hi [First Name],

We provide full back-office and dispatch management across all major commercial equipment types nationwide, including:
• Dry Van
• Reefer
• Flatbed / Stepdeck
• Box Trucks
• Power Only
• Hotshot
• Multi-Equipment Fleets

We tailor our broker packet processing, rate negotiations, and lane optimization directly to the operational requirements of your specific rig.

What equipment type are you currently running at [Company Name], and what are your primary operating corridors?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | tycoonlogistics.online`,
  },
  {
    id: "obj_7", scenario: "Prospect replies 'How does no-forced-dispatch work?'",
    subject: "How No-Forced-Dispatch Works at Tycoon Logistics",
    body: `Hi [First Name],

Our no-forced-dispatch model is straightforward: You are the boss, and you make the final call on every load.

Here is exactly how the process works step-by-step:
1. Preference Mapping: You define your preferred lanes, target rates, home-time requirements, and maximum weight limits.
2. Search & Vetting: We search for matching freight, run credit checks on the broker, and negotiate the highest available rate.
3. Load Presentation: We present the load details to you—including rate, pick/drop times, weight, and broker credit standing.
4. Your Decision: If you accept, we submit setup packets, secure the rate confirmation, and support you 24/7 through delivery. If you decline, we immediately move to the next option without pressure.
5. Direct Payment: The broker pays your company directly. We invoice weekly ($350 for first $8,000 / 10% above).

There are no penalties, forced routes, or binding long-term contracts.

Are you free for a quick 10-minute phone call to test this out on your current running lanes?

Best regards,
Dispatcher Team
Tycoon Logistics LLC
720-549-8518 | admin@tycoonlogistics.online`,
  },
  {
    id: "obj_8", scenario: "Prospect replies 'Call me later' / 'Contact me next month'",
    subject: "Re: [Original Subject Line]",
    body: `Hi [First Name],

Will do. I have noted my calendar to follow up with you in [Specified Timeframe / Next Month].

In the meantime, if you run into unexpected idle capacity, broker setup issues, or administrative bottlenecks before then, feel free to call or text us anytime at 720-549-8518 or email admin@tycoonlogistics.online.

Talk to you soon and stay safe on the road.

Best regards,
Dispatcher Team
Tycoon Logistics LLC
tycoonlogistics.online`,
  },
];

// Helper: get a sequence by id
export function getSequence(id: string): Sequence | undefined {
  return SEQUENCES.find((s) => s.id === id);
}
export function getStandaloneEmail(id: string): EmailTemplate | undefined {
  return STANDALONE_EMAILS.find((e) => e.id === id);
}
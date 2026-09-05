import React from "react";
import LectureSlider from "./LectureSlider";
import { Image } from "@/components/ui/image";

const NAVY = "#0a2a6e";
const RED = "#cc0000";
const GREEN = "#25d366";

function Block({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 sm:p-8 mb-5 shadow-sm" style={{ borderLeft: `6px solid ${RED}` }}>
      <h2 className="text-lg sm:text-xl font-black mb-3 pb-3 border-b-2 border-slate-100" style={{ color: NAVY }}>{icon} {title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Highlight({ children }) {
  return (
    <div className="rounded-lg p-4 my-3" style={{ background: "#f0f4ff", border: `2px solid ${NAVY}` }}>
      <p className="text-sm font-bold leading-relaxed" style={{ color: NAVY }}>{children}</p>
    </div>
  );
}

function Warning({ children }) {
  return (
    <div className="rounded-lg p-4 my-3" style={{ background: "#fff3f3", border: `2px solid ${RED}` }}>
      <p className="text-sm font-bold leading-relaxed" style={{ color: RED }}>{children}</p>
    </div>
  );
}

function Success({ children }) {
  return (
    <div className="rounded-lg p-4 my-3" style={{ background: "#f0fff4", border: `2px solid ${GREEN}` }}>
      <p className="text-sm font-bold leading-relaxed" style={{ color: "#1a7a3a" }}>{children}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-xl sm:text-2xl font-black text-center mb-5 pb-3" style={{ color: NAVY, borderBottom: `3px solid ${RED}` }}>{children}</h2>
  );
}

function SectionImg({ src, alt }) {
  return (
    <div className="rounded-xl overflow-hidden mb-4 max-h-[300px]">
      <Image src={src} alt={alt} fittingType="fill" className="w-full h-[300px]" />
    </div>
  );
}

function SubjectItem({ label, variant, children }) {
  const styles = {
    bad: { bg: "#fff3f3", border: RED, labelBg: RED },
    good: { bg: "#f0fff4", border: GREEN, labelBg: GREEN },
    best: { bg: "#f0f4ff", border: NAVY, labelBg: NAVY },
  };
  const s = styles[variant];
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
      <span className="text-[11px] font-black text-white px-2.5 py-1 rounded-full flex-shrink-0 text-center" style={{ background: s.labelBg }}>{label}</span>
      <p className="text-[13px] text-slate-600 italic m-0">{children}</p>
    </div>
  );
}

function EmailTemplate({ title, badge, subject, children }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md mb-6">
      <div className="px-6 py-3.5 flex items-center justify-between" style={{ background: NAVY }}>
        <h3 className="text-sm sm:text-base font-black text-white m-0">{title}</h3>
        <span className="text-[11px] font-black text-white px-3 py-1 rounded-full" style={{ background: RED }}>{badge}</span>
      </div>
      <div className="px-6 py-3 border-b" style={{ background: "#f4f6fb", borderColor: "#e0e0e0" }}>
        <p className="text-xs text-slate-500 m-0 mb-1">Subject Line:</p>
        <strong className="text-[13px]" style={{ color: NAVY }}>{subject}</strong>
      </div>
      <div className="p-6 text-[13px] text-slate-600 leading-relaxed space-y-3">
        {children}
        <div className="border-t pt-3 mt-4 text-xs text-slate-500" style={{ borderColor: "#f0f0f0" }}>
          [Your Name]<br />
          [Your Dispatch Company]<br />
          [US Phone Number] | [Email]
        </div>
      </div>
    </div>
  );
}

const ANATOMY = [
  ["Opening — Establish Relevance", "1 to 2 sentences. Show you know who they are and why you are reaching out to them specifically."],
  ["Problem — Identify Their Pain Point", "1 to 2 sentences. Name a specific challenge they likely face — deadhead, rate negotiation, load finding while driving."],
  ["Solution — What You Offer", "2 to 3 sentences. Your specific service and why it matters to them — not generic, tied to their situation."],
  ["Social Proof — Brief Credibility", "1 sentence. A specific result — average rates you achieve, number of carriers you work with, relevant experience."],
  ["Call to Action — One Clear Ask", "1 sentence. Ask for a 10 minute call. One ask only — never multiple requests in one email."],
];

const TOOLS = [
  ["📧", "Lemlist", "From $59/month", "Excellent for personalized cold email campaigns. Insert personalized variables automatically — name, MC number, state, equipment type. Has reply detection and follow-up automation.", "Best for: Personalization at scale"],
  ["⚡", "Instantly.ai", "From $37/month", "Newer tool gaining popularity among dispatchers. Excellent deliverability, unlimited email sending accounts, strong analytics. Growing favorite in the dispatching community.", "Best for: High volume sending"],
  ["📨", "GMass", "From $25/month", "Affordable Gmail-based mass email tool. Sends personalized emails directly from your Gmail account. Maintains good deliverability because it uses your actual Gmail inbox.", "Best for: Beginners on budget"],
  ["📮", "Gmail Direct", "Free", "For under 50 emails per day your regular Gmail is perfectly adequate. No tool needed. Manual but effective for building initial carrier relationships one by one.", "Best for: Getting started free"],
];

const SPAM_TIPS = [
  ["🌡️", "Warm Up Your Email Domain", "If using a new business email domain gradually increase sending volume over 2 to 3 weeks. Start with 20 emails per day, increase to 50, then 100, then 200. Sudden high volume from a new domain triggers spam filters."],
  ["🚫", "Avoid Spam Trigger Words", "Words like \"free,\" \"guarantee,\" \"earn money,\" \"limited time,\" \"act now,\" \"no risk\" activate spam filters. Write naturally and professionally — avoid all sales language in cold outreach."],
  ["📝", "Use Plain Text — Not HTML", "Heavily formatted emails with images and colorful HTML look like marketing blasts. Plain text emails look like personal messages — they land in the inbox more reliably and get better open rates."],
  ["👤", "Personalize Every Email", "Emails with personalized subject lines and content have better deliverability. Even simple personalization — their name or their state — significantly improves both delivery rate and open rate."],
  ["⚖️", "Follow CAN-SPAM Compliance", "Include your business name, physical address — your LLC registered address works — and an unsubscribe mechanism. This is legally required and improves deliverability significantly."],
];

const FOLLOWUPS = [
  ["Day 1", "Initial Email Sent", "Send your primary template — personalized with their name, MC number, state, and equipment type. Keep it under 250 words."],
  ["Day 3", "First Follow-Up", "2 to 3 sentence reference to your initial email from a different angle. \"I wanted to make sure this did not get buried — are you currently satisfied with your load situation?\""],
  ["Day 7", "Second Follow-Up — Add Value", "Share something of genuine value — a current rate report for their lane, a tip about a high-demand corridor. Give before you ask again."],
  ["Day 14", "Third Follow-Up — Break-Up Email", "\"I understand if the timing is not right. I will not reach out again unless you would like me to.\" This often generates responses from carriers who were interested but busy."],
  ["Day 30+", "Optional Re-Engagement", "Carrier circumstances change. A carrier who was happy with their dispatcher in week one may be unhappy in week four. A gentle re-engagement after 30 days captures these changed situations."],
];

const TAKEAWAYS = [
  ["📧", "Email is a scale multiplier", " — while cold calling reaches 15 to 20 carriers per day, systematic email campaigns reach 500 to 1,000. Use both together for maximum carrier acquisition."],
  ["📌", "Subject lines determine open rates", " — reference their MC number, state, or specific pain point. Generic subject lines get deleted. Specific, relevant subjects get opened."],
  ["✍️", "Keep emails short", " — 150 to 250 words maximum. Carriers read on their phone between loads. Short, clear, benefit-focused emails get read and responded to."],
  ["🔄", "Follow up is everything", " — 80% of sales happen after the 5th contact. Use the Day 1, 3, 7, 14 follow-up sequence systematically. Most responses come from follow-ups not first emails."],
  ["📞", "Email gets them to the call", " — relationships and agreements close on phone calls. As soon as a carrier responds positively move them to a scheduled 10-minute call immediately."],
];

export default function Module8Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 8 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 8 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2331543758&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 8 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 8 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Finding Carriers Through <span style={{ color: RED }}>Email</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          Cold calling gets you fast conversations. Email gets you scale. Together they form the most powerful carrier acquisition engine available to a professional dispatcher.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1000&q=80" alt="Email Outreach for Carrier Acquisition" />
          <p>Cold calling gets you fast conversations. Email gets you scale. While a dispatcher making 80 calls per day can speak to perhaps 15 to 20 carriers, a well-constructed email campaign can reach 500 to 1,000 carriers per day with properly automated systems.</p>
          <Highlight>💡 Key Insight: Email and cold calling are NOT competing strategies — they are complementary. The most effective carrier acquisition systems use both simultaneously. Cold calling for speed. Email for scale.</Highlight>
          <p>In this lecture we cover everything about email outreach for carrier acquisition — where to get email addresses, how to write emails that get responses, what tools to use, how to follow up systematically, and how to convert email inquiries into signed dispatch agreements.</p>
        </Block>

        <Block icon="📧" title="Where to Find Carrier Email Addresses">
          <SectionImg src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80" alt="Finding Carrier Email Addresses FMCSA" />
          <ul className="pl-5 space-y-2 my-2">
            <li><strong style={{ color: NAVY }}>FMCSA Database (Free):</strong> The same FMCSA database used for cold calling also contains email addresses for many registered carriers. Primary source for carrier emails. We cover FMCSA navigation in its own dedicated lecture.</li>
            <li><strong style={{ color: NAVY }}>Carrier411:</strong> Provides supplementary carrier contact data including emails. Often more complete than FMCSA specifically for email addresses.</li>
            <li><strong style={{ color: NAVY }}>Load Board Carrier Profiles:</strong> On some load boards carriers create profiles that include contact information including email. Capture every email you see when browsing carrier profiles.</li>
            <li><strong style={{ color: NAVY }}>LinkedIn:</strong> Many owner-operators and fleet managers have LinkedIn profiles. LinkedIn messages function similarly to email for outreach, and some profiles include business email addresses.</li>
            <li><strong style={{ color: NAVY }}>Google Search:</strong> Search "[Carrier Company Name] trucking email" or "[MC Number] contact" — many carriers have basic websites or business listings that include email contact information.</li>
          </ul>
          <Highlight>🎯 Quality Over Quantity: Even if you start with a list of 200 emails that is 200 potential clients you can reach systematically. Verified active emails to real carriers are far more valuable than mass-scraped lists full of outdated addresses.</Highlight>
        </Block>

        <Block icon="✍️" title="Anatomy of an Effective Carrier Outreach Email">
          <SectionImg src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1000&q=80" alt="Writing Effective Cold Emails" />
          <p>Most dispatchers cold emails fail for predictable reasons — too long, too generic, too focused on the dispatcher rather than the carrier, or no clear ask. Here is the anatomy of an email that actually gets responses.</p>
          <Highlight>📏 Email Length: 150 to 250 words maximum for cold outreach. Carriers are busy. They read emails on their phone between loads. Short, clear, benefit-focused emails get read. Walls of text get deleted.</Highlight>
          <p className="font-black mt-4 mb-3" style={{ color: NAVY }}>Email Structure — 5 Part Framework:</p>
          <div className="flex flex-col gap-2.5 mt-3">
            {ANATOMY.map(([title, desc], i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-3.5" style={{ background: "#f4f6fb" }}>
                <span className="text-[13px] font-black text-white flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: NAVY }}>{i + 1}</span>
                <div>
                  <h4 className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block icon="📌" title="Writing Subject Lines That Get Opened">
          <SectionImg src="https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1000&q=80" alt="Email Subject Lines That Work" />
          <p>The subject line determines whether your email gets opened or ignored. It must be specific, relevant, and benefit-focused. Generic subject lines get deleted without being read.</p>
          <div className="flex flex-col gap-2.5 mt-4">
            <SubjectItem label="❌ BAD" variant="bad">"Dispatching Services Available"</SubjectItem>
            <SubjectItem label="❌ BAD" variant="bad">"Hello from Tycoon Dispatch Academy Dispatch"</SubjectItem>
            <SubjectItem label="✅ GOOD" variant="good">"Dry Van Dispatcher — Midwest to Southeast Lanes"</SubjectItem>
            <SubjectItem label="✅ GOOD" variant="good">"More Loads, Better Rates for Your Texas Operation"</SubjectItem>
            <SubjectItem label="⭐ BEST" variant="best">"MC [Their MC Number] — Are You Covered on Return Loads from [Their State]?"</SubjectItem>
            <SubjectItem label="⭐ BEST" variant="best">"Are You Getting $2.50+ Per Mile Out of [Their State]?"</SubjectItem>
          </div>
          <Highlight>💡 Best subject lines feel personal and relevant. Referencing their MC number or state shows you know who they are. Addressing a specific pain point like return loads shows you understand their business.</Highlight>
        </Block>

        {/* EMAIL TEMPLATES */}
        <SectionTitle>📩 Complete Email Templates — Ready to Use</SectionTitle>

        <EmailTemplate title="Template 1 — Standard Owner-Operator Outreach" badge="Best For Beginners" subject="Dry Van Dispatcher — [Their State] Operations">
          <p>Hi [Name or "there" if unknown],</p>
          <p>My name is [Your Name] and I am a professional truck dispatcher specializing in dry van operations across the Midwest and Southeast corridors.</p>
          <p>I know how challenging it is to find quality loads while also managing everything else that comes with running your own truck. Deadhead miles, rate negotiations, broker follow-ups — it takes time that cuts into your driving and your life.</p>
          <p>At [Your Dispatch Company], we handle all of that for you. We source loads from DAT, Truckstop, and direct broker relationships, negotiate aggressively on your behalf, and handle all the paperwork. Our carriers average above-market rates because negotiation is all we do.</p>
          <p>We work with several owner-operators in your region and consistently book $2.40 to $2.80 per mile on lanes you are likely running.</p>
          <p>Would you be open to a 10-minute call this week to see if we would be a good fit? No commitment — just a conversation.</p>
        </EmailTemplate>

        <EmailTemplate title="Template 2 — New Authority Carrier Outreach" badge="High Conversion" subject="Congrats on Your New Authority — MC [Their MC Number]">
          <p>Hi [Name],</p>
          <p>I came across your new MC authority and wanted to reach out directly. Congratulations on taking that step — it is a big one.</p>
          <p>The first 90 days with a new authority can be challenging. Finding consistent loads, establishing broker relationships, and managing all the paperwork while also driving is genuinely difficult — most new owner-operators underestimate it.</p>
          <p>I am [Your Name], a truck dispatcher specializing in helping new carriers get established quickly. I have helped several new owner-operators go from zero loads to consistent profitable runs within their first month of authority.</p>
          <p>Here is what I offer: load finding, rate negotiation, broker setup, document management, and ongoing support — so you can focus on driving.</p>
          <p>Would you have 10 minutes for a quick call today or tomorrow? I would like to understand your lane preferences and equipment, and share how I can help you hit the ground running.</p>
        </EmailTemplate>

        <EmailTemplate title="Template 3 — Pain Point Focus" badge="Strong Hook" subject="Are You Getting $2.50+ Per Mile Out of [Their State]?">
          <p>Hi [Name],</p>
          <p>Quick question — are you satisfied with the rates you are currently getting on your outbound loads from [State]?</p>
          <p>I am a truck dispatcher who specializes in dry van operations out of [Region]. Most of the carriers I talk to are leaving $0.20 to $0.40 per mile on the table because they do not have time to negotiate aggressively with brokers while also managing everything else.</p>
          <p>We handle that negotiation on your behalf. Our average rate for carriers out of your region is currently $2.55 to $2.80 per mile depending on the lane. We also minimize deadhead by sequencing loads strategically.</p>
          <p>Our fee is [X%] of gross load revenue — you only pay when we earn for you.</p>
          <p>If you are open to it I would love to show you current rate data on your lanes and let the numbers speak for themselves. 10 minutes?</p>
        </EmailTemplate>

        <Block icon="🛠️" title="Email Tools and Automation">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Email Automation Tools for Dispatchers" />
          <p>For sending under 50 emails per day Gmail or your business email is sufficient. For larger volumes you need a dedicated email outreach tool.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {TOOLS.map(([icon, name, price, desc, best]) => (
              <div key={name} className="bg-white rounded-xl p-5 shadow-sm transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${RED}` }}>
                <span className="text-3xl block mb-2">{icon}</span>
                <h4 className="text-sm font-black mb-1" style={{ color: NAVY }}>{name}</h4>
                <div className="text-xs font-black mb-2" style={{ color: RED }}>{price}</div>
                <p className="text-xs text-slate-600 leading-relaxed m-0">{desc}</p>
                <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mt-3" style={{ background: "#f4f6fb", color: NAVY }}>{best}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block icon="🚫" title="Avoiding the Spam Folder">
          <SectionImg src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&q=80" alt="Email Spam Avoidance Tips" />
          <p>Your carefully crafted email is worthless if it lands in spam. Follow these practices to ensure inbox delivery every time:</p>
          <div className="flex flex-col gap-3 mt-4">
            {SPAM_TIPS.map(([icon, title, desc], i) => (
              <div key={i} className="rounded-lg p-4 flex items-start gap-3 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `5px solid ${NAVY}` }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <h4 className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block icon="🔄" title="Follow-Up Sequence — Where the Money Is">
          <SectionImg src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80" alt="Email Follow Up Sequence Strategy" />
          <Warning>⚠️ Critical Fact: Studies consistently show 80% of sales happen after the fifth contact. Most email responses do not come from the first email. Your follow-up sequence is where carriers are actually won.</Warning>
          <p className="font-black mt-4 mb-3" style={{ color: NAVY }}>Recommended Follow-Up Sequence:</p>
          <div className="flex flex-col gap-0 mt-3 rounded-xl overflow-hidden shadow-sm">
            {FOLLOWUPS.map(([day, title, desc], i) => (
              <div key={i} className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${i !== FOLLOWUPS.length - 1 ? "border-b-2" : ""}`} style={{ borderColor: "#f4f6fb" }}>
                <span className="text-xs font-black text-white px-3 py-1.5 rounded-lg flex-shrink-0 text-center min-w-[55px]" style={{ background: RED }}>{day}</span>
                <div>
                  <h4 className="text-sm font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Highlight>📧 Sample First Follow-Up: "Hi [Name], I sent you a note last week about dispatching support for your [equipment] operation out of [state]. I did not want to assume you saw it given how busy things get on the road. I will keep this brief — are you currently satisfied with your load situation, or is there room to improve your rates and consistency?"</Highlight>
        </Block>

        <Block icon="📞" title="Converting Email Inquiries to Signed Agreements">
          <SectionImg src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1000&q=80" alt="Converting Email to Phone Call Carrier" />
          <p>When a carrier responds positively to your email, move them to a phone call as quickly as possible. Email is good for initial outreach but relationships close on phone calls.</p>
          <Success>✅ Reply Template: "Thank you for getting back to me. I would love to learn more about your operation and share exactly how we can help. Would [specific day and time] work for a 10-minute call?"</Success>
          <Highlight>💡 Once on the phone follow your carrier discovery and proposal process from Module 5. Email gets them to the call. The call closes the deal.</Highlight>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 8</h2>
          {TAKEAWAYS.map(([icon, bold, rest]) => (
            <div key={bold} className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">{bold}</strong>{rest}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 sm:p-8 text-center mb-5" style={{ background: "linear-gradient(135deg, #cc0000 0%, #aa0000 100%)" }}>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">🚀 Ready To Continue?</h2>
          <p className="text-sm text-red-200 mb-4">Module 9 is next — FMCSA and Safer Web. Your free access to hundreds of thousands of registered carriers — the gold mine of carrier data.</p>
          <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer"
            className="inline-block rounded-full px-8 py-3 text-sm font-black text-white transition-colors hover:bg-white hover:text-[#25d366]"
            style={{ background: "#25d366", border: "3px solid #25d366" }}>
            💬 Join The Full Course — WhatsApp Us
          </a>
        </div>

        {/* COPYRIGHT */}
        <div className="text-center py-4" style={{ background: NAVY }}>
          <p className="text-xs text-slate-300">© 2026 Tycoon Dispatch Academy — All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import LectureSlider from "./LectureSlider";

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

function ReqCard({ icon, title, children, tags, footer }) {
  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${RED}` }}>
      <span className="text-3xl sm:text-4xl block mb-3">{icon}</span>
      <h3 className="text-base font-black mb-2.5" style={{ color: NAVY }}>{title}</h3>
      {children}
      {tags && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((t) => (
            <span key={t} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f4f6fb", color: NAVY }}>{t}</span>
          ))}
        </div>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

const HARDWARE = [
  {
    icon: "🖥️", title: "Computer — Non Negotiable",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Your entire dispatching operation runs on your computer. Minimum specifications:</p>,
    tags: ["Intel Core i5 8th Gen+", "8GB RAM minimum", "256GB SSD", "15 inch screen minimum"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">A second monitor is highly recommended — load board on one screen, CRM and email on another. Dramatically increases productivity and reduces errors.</p>,
  },
  {
    icon: "🌐", title: "Internet Connection",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Stable high speed internet is essential. Minimum recommended:</p>,
    tags: ["10 Mbps download", "5 Mbps upload"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">Stability matters more than raw speed. Dropped connections during broker negotiations are costly. Fiber optic preferred. Always have mobile data as backup for outages.</p>,
  },
  {
    icon: "🎧", title: "Headset with Microphone",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">You will spend significant time on phone calls with brokers and carriers. A quality headset ensures clear audio without background noise.</p>,
    tags: ["USB or 3.5mm jack", "Noise canceling preferred"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">Brands like Jabra, Sennheiser, or mid-range Logitech work perfectly. Clear audio = professional image.</p>,
  },
  {
    icon: "📱", title: "Smartphone",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Essential for WhatsApp communications with carriers, two-factor authentication on platforms, and mobility when you step away from your desk.</p>,
    tags: ["Any modern Android or iPhone", "WhatsApp installed"],
  },
  {
    icon: "🔋", title: "UPS — Uninterruptible Power Supply",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">In Pakistan, power outages are a real operational risk. A UPS protects your equipment from power surges and gives you 15–30 minutes during outages.</p>,
    footer: <Warning>⚠️ Critical: You work during Pakistan evening and night — WAPDA load shedding during this period directly threatens your income. A UPS is not optional — it is essential.</Warning>,
  },
];

const SOFTWARE = [
  {
    icon: "📋", title: "Load Board Subscriptions",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Your primary tool for finding freight. Top options:</p>,
    tags: ["DAT — $45–$150/month", "Truckstop — Similar to DAT", "123Loadboard — $35/month"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">DAT is the industry standard — start here. Budget $50–$150/month for load board access. Covered in detail in a dedicated lecture.</p>,
  },
  {
    icon: "📞", title: "Dialer — USA Phone Number",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">You cannot use a Pakistani SIM to call American brokers and carriers professionally. You need a US VoIP phone number.</p>,
    tags: ["$20–$50/month", "USA number included"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">We cover the three best dialers in a dedicated lecture. Budget $20–$50/month for your dialer subscription.</p>,
  },
  {
    icon: "📧", title: "Professional Business Email",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Personal Gmail or Yahoo addresses appear unprofessional to American brokers. You need a business email.</p>,
    tags: ["name@yourcompany.com", "Google Workspace $6–$12/month", "Microsoft 365 $6/month"],
  },
  {
    icon: "📊", title: "CRM Software",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Track carriers, equipment, lanes, contacts, load history, and follow-ups. Start free — upgrade later.</p>,
    tags: ["HubSpot CRM — Free", "Trello — Free", "Pipedrive — $15/month", "Zoho CRM — $14/month"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">Start with HubSpot free tier — it is robust enough for beginners managing up to 10 carriers.</p>,
  },
  {
    icon: "📄", title: "Document Management",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">You will send and receive PDFs constantly — rate cons, BOLs, COIs, and more.</p>,
    tags: ["Adobe Acrobat Reader — Free", "DocuSign — Free basic tier", "HelloSign — Free basic tier"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">For electronic signatures on rate confirmations and dispatch agreements — free tiers are sufficient for starting out.</p>,
  },
  {
    icon: "💬", title: "Communication Tools",
    body: <p className="text-[13px] text-slate-600 leading-relaxed mb-2">Multiple channels for different types of communication:</p>,
    tags: ["Gmail — Formal broker emails", "WhatsApp — Quick carrier comms", "Slack — Team communication later"],
    footer: <p className="text-[13px] text-slate-600 leading-relaxed">Keep communication organized — formal matters go via email, quick updates via WhatsApp.</p>,
  },
];

const SKILLS = [
  { icon: "🗣️", title: "English Communication", desc: "Functional English — not perfect, not native level, but clear and professional. You need to deliver scripted dialogue clearly and respond to common replies. Most Pakistani intermediate English speakers can achieve this standard within weeks of practice. Tycoon Dispatch Academy provides scripts for every scenario." },
  { icon: "🤝", title: "Negotiation", desc: "A completely learnable skill. At its core — you know what your carrier needs to make a load profitable and you negotiate with the broker to get as close to that number as possible. We teach specific negotiation frameworks that you practice until they become natural." },
  { icon: "📋", title: "Organization", desc: "Managing multiple carriers, multiple loads in various stages, and multiple broker relationships requires systematic organization. Your CRM, spreadsheets, and disciplined record-keeping habits make the difference between chaos and professionalism." },
  { icon: "⏰", title: "Time Management", desc: "You work during US daytime hours from Pakistan — your evening and night. This requires discipline in maintaining a consistent schedule and protecting your work hours from distractions and family interruptions." },
  { icon: "💻", title: "Basic Computer Skills", desc: "Navigate websites, manage files, send emails with attachments, and use online platforms comfortably. If you can use Facebook and YouTube confidently, you already have the baseline computer skills needed for dispatching." },
];

const TIME_ITEMS = [
  ["During Training", "2–3 hours daily for 30–45 days. Time needed to absorb course material, practice scripts, get familiar with load boards, and set up all your systems properly."],
  ["Active Dispatching", "6–8 hours per day during US business hours. For Pakistan this means approximately 8:00 PM to 4:00 AM Pakistan Standard Time — covering US Central and Eastern time zones."],
  ["Weekends", "The trucking industry operates 7 days a week. Many dispatchers work 6 days and take one day off. Some work 7 days when starting out to build momentum faster."],
];

const MONTHLY_COSTS = [
  ["Load Board — DAT Basic", "$45–$150", "cost"],
  ["Dialer and Phone System", "$20–$50", "cost"],
  ["Business Email", "$6–$12", "cost"],
  ["CRM — Entry Level", "$0–$15", "free"],
  ["Document Tools", "$0–$15", "free"],
];

const ONE_TIME_COSTS = [
  ["US LLC Formation", "$150–$500", "cost"],
  ["US Bank Account — Mercury", "$0 — Free", "free"],
  ["Hardware if needed", "$300–$700", "cost"],
];

function CostTable({ rows, totalLabel, totalValue }) {
  return (
    <div className="w-full mt-3 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-[13px] font-bold text-white px-4 py-3" style={{ background: NAVY }}>Item</th>
            <th className="text-left text-[13px] font-bold text-white px-4 py-3" style={{ background: NAVY }}>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([item, cost, kind], i) => (
            <tr key={item} className={i % 2 === 1 ? "bg-slate-50" : ""}>
              <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">{item}</td>
              <td className="px-4 py-3 text-[13px] font-black border-b border-slate-100" style={{ color: kind === "free" ? GREEN : RED }}>{cost}</td>
            </tr>
          ))}
          <tr style={{ background: NAVY }}>
            <td className="px-4 py-3 text-[13px] font-black text-white">{totalLabel}</td>
            <td className="px-4 py-3 text-[13px] font-black" style={{ color: "#f5a623" }}>{totalValue}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const TAKEAWAYS = [
  ["💻", "Hardware is minimal", " — a decent computer, stable internet, a headset, and a UPS. Total investment under $700 if you need to buy everything new."],
  ["🛠️", "Software costs $71–$242 per month", " — one dispatched load covers this entirely. The ROI is immediate."],
  ["🧠", "Skills are learnable", " — English scripts, negotiation frameworks, and organizational systems are all taught in this course. You do not need to figure anything out alone."],
  ["⏰", "Time commitment is real", " — 6–8 hours during US business hours means Pakistani night shift. Be honest with yourself about this before starting."],
  ["⚖️", "US LLC is strongly recommended", " — Tycoon Dispatch Academy handles formation in all 50 states. Covered completely in Module 23."],
];

export default function Module4Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 4 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 4 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330630903&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true" />
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 4 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 4 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Requirements for <span style={{ color: RED }}>Dispatching</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          What do you actually need to get started? This module gives you the complete honest answer — hardware, software, skills, legal setup, time commitment, and budget.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <p>One of the most common questions we receive from new students is: "What do I actually need to get started?" This is the right question to ask before investing time and money into anything. In this lecture, we are going to give you a completely honest, comprehensive answer.</p>
          <Success>✅ Great News: Compared to almost any other business that can generate this level of income, the startup requirements for truck dispatching are remarkably low. No warehouse, no inventory, no manufacturing equipment, no retail space, and no large team required.</Success>
          <p>But there are specific requirements that you must meet to operate professionally and effectively. Let us go through every single one of them.</p>
        </Block>

        {/* HARDWARE */}
        <SectionTitle>💻 Hardware Requirements</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {HARDWARE.map((r) => (
            <ReqCard key={r.title} icon={r.icon} title={r.title} tags={r.tags} footer={r.footer}>
              {r.body}
            </ReqCard>
          ))}
        </div>

        {/* SOFTWARE */}
        <SectionTitle>🛠️ Software Requirements</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {SOFTWARE.map((r) => (
            <ReqCard key={r.title} icon={r.icon} title={r.title} tags={r.tags} footer={r.footer}>
              {r.body}
            </ReqCard>
          ))}
        </div>

        {/* SKILLS */}
        <SectionTitle>🧠 Skills Requirements</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {SKILLS.map((s) => (
            <div key={s.title} className="rounded-xl p-5 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `5px solid ${NAVY}` }}>
              <span className="text-2xl block mb-2.5">{s.icon}</span>
              <h4 className="text-base font-black mb-2" style={{ color: NAVY }}>{s.title}</h4>
              <p className="text-[13px] text-slate-600 leading-relaxed m-0">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* LEGAL */}
        <Block icon="⚖️" title="Legal Requirements">
          <p>For starting as an independent dispatcher you can technically begin as an individual service provider without formal legal structure. However this limits your professionalism and income potential significantly.</p>
          <Highlight>💡 Strongly Recommended: Form a US LLC for your dispatch business as early as possible. American brokers take LLC-registered businesses far more seriously than individual contractors.</Highlight>
          <p>A US LLC gives you:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>A professional business identity that American brokers respect</li>
            <li>The ability to open a US business bank account</li>
            <li>Legal protection for your personal assets</li>
            <li>A proper tax structure for receiving US business income</li>
          </ul>
          <Warning>⚠️ Pakistan Tax: Consult a local tax advisor regarding declaration of foreign income. Pakistan has regulations regarding foreign currency income. Proper declaration protects you from future legal complications.</Warning>
          <p>Tycoon Dispatch Academy handles US LLC formation in all 50 states as part of our service offering. We cover LLC formation in complete detail in Module 23 — the final lecture of this course.</p>
        </Block>

        {/* TIME REQUIREMENTS */}
        <Block icon="⏰" title="Time Requirements — Be Honest With Yourself">
          <div className="flex flex-col gap-4 mt-3">
            {TIME_ITEMS.map(([label, desc]) => (
              <div key={label} className="rounded-lg px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5" style={{ background: "#f4f6fb", borderLeft: `5px solid ${RED}` }}>
                <span className="text-[13px] font-black min-w-[160px] flex-shrink-0" style={{ color: RED }}>{label}</span>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
          <Warning>⚠️ Night Shift Reality: This is a night shift lifestyle. Be honest with yourself and your family about this commitment before enrolling. Success requires consistency — not occasional effort.</Warning>
        </Block>

        {/* FINANCIAL */}
        <Block icon="💰" title="Financial Investment Summary">
          <p>Here is your complete cost breakdown to start and run your dispatching operation:</p>
          <p className="font-black mt-4 mb-2" style={{ color: NAVY }}>📅 Monthly Operating Costs:</p>
          <CostTable rows={MONTHLY_COSTS} totalLabel="Total Monthly" totalValue="$71–$242" />
          <p className="font-black mt-6 mb-2" style={{ color: NAVY }}>🔧 One Time Startup Costs:</p>
          <CostTable rows={ONE_TIME_COSTS} totalLabel="Total One Time" totalValue="$450–$1,200" />
          <div className="rounded-xl p-6 sm:p-7 mt-5 text-center" style={{ background: NAVY }}>
            <h3 className="text-lg sm:text-xl font-black text-white mb-3">💡 Return on Investment</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">A single dispatched load averaging $300 commission covers your entire first month of software costs.</p>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">Your entire one-time investment is recoverable within the first 2–4 weeks of active dispatching.</p>
            <div className="text-lg sm:text-2xl font-black text-white rounded-lg p-4" style={{ background: RED }}>One Load = All Monthly Software Costs Covered 💰</div>
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 4</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 5 is next — How to Find Carriers. This is where your income generating journey truly begins.</p>
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
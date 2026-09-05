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

function SectionImg({ src, alt }) {
  return (
    <div className="rounded-xl overflow-hidden mb-4 max-h-[300px]">
      <Image src={src} alt={alt} fittingType="fill" className="w-full h-[300px]" />
    </div>
  );
}

function DsaItem({ title, desc }) {
  return (
    <div className="rounded-lg p-4 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `5px solid ${RED}` }}>
      <h4 className="text-sm font-black mb-1.5" style={{ color: NAVY }}>{title}</h4>
      <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
    </div>
  );
}

const DSA_ELEMENTS = [
  ["Dispatch Fee", "The percentage of gross load revenue you charge. Clearly state the percentage — typically 8% — and confirm it applies to the gross rate before any deductions."],
  ["Services Provided", "Specify exactly what you do — load finding broker negotiation paperwork handling check calls. Be specific not vague."],
  ["Payment Terms", "How and when the carrier pays your fee. Most dispatchers invoice weekly and require payment within 7 days."],
  ["Load Approval", "Confirm that the carrier has the right to approve or reject any load before commitment. Dispatchers cannot obligate a carrier to a load without their approval."],
  ["Communication Expectations", "How quickly will you respond to carrier inquiries? How quickly must the carrier respond to load offers? Set clear timelines."],
  ["Termination", "How either party can end the agreement. Standard is 30 days written notice though many agreements allow immediate termination for cause."],
];

const ONBOARDING = [
  ["📋", "Collect Carrier Information", "MC and DOT numbers, insurance details, equipment specifics, driver contacts, preferred lanes, home base, days available, rate expectations, and ELD system used."],
  ["✅", "Verify Carrier Information", "Check FMCSA for active authority, verify current insurance through Carrier411, review CSA scores for serious violations, confirm equipment matches FMCSA registration."],
  ["📄", "Get Documents on File", "Copy of operating authority, Certificate of Insurance, W9 form from the carrier, voided check or bank details for payment processing."],
  ["🤝", "Broker Setup", "Begin carrier setup process with your most frequently used brokers immediately after onboarding. Send COI, authority paperwork, and complete online carrier profiles on broker portals."],
];

const COMM = [
  ["⚡", "Response Time", "Respond to carrier messages within 1 hour during active hours. Carriers on the road need timely information — an unanswered question about a load could mean a missed opportunity."],
  ["📢", "Proactive Updates", "Do not wait for the carrier to ask about their next load. Reach out proactively. \"Your delivery is Thursday — I am already working on your next load from Atlanta.\""],
  ["🔍", "Transparency on Rates", "Always tell the carrier exactly what rate you negotiated. Never hide the broker rate or your commission. Transparency builds trust — deception destroys it permanently."],
  ["😔", "Deliver Bad News Honestly", "If you cannot find a good load tell the carrier honestly and explain what you are doing about it. Carriers respect honesty far more than excuses or silence."],
  ["🌙", "After-Hours Protocol", "Set clear expectations about after-hours availability upfront. Carriers need to know who to contact in an emergency. Clear boundaries prevent resentment on both sides."],
];

const PROBLEMS = [
  ["🚛 TONU — Truck Ordered Not Used", [
    "Document the situation immediately — cancellation time carrier position and costs incurred",
    "Contact the broker and demand TONU compensation — typically $150 to $300",
    "Find a replacement load immediately — your carrier needs to keep moving",
    "Communicate the situation to the carrier promptly and keep them updated",
  ]],
  ["⏰ Detention — Driver Waiting at Facility", [
    "Instruct the driver to document arrival time precisely from the moment they arrive",
    "After the free time window expires contact the broker formally",
    "Notify detention in writing via email with timestamp",
    "Submit detention invoice with documented timestamps and facility signature if possible",
  ]],
  ["❌ Load Cancellations by Carrier", [
    "Notify the broker immediately and professionally — never leave brokers guessing",
    "Apologize professionally and offer solutions — another carrier if available",
    "Proactive communication preserves broker relationships even in difficult situations",
  ]],
];

const LOYALTY = [
  ["📦", "Consistently Find Good Loads", "Performance is everything. Carriers stay with dispatchers who keep them loaded at good rates. This is the foundation — everything else builds on it."],
  ["🧠", "Know Their Preferences Deeply", "Memorize each carrier's preferred lanes home base days off and equipment quirks. Reference this knowledge in every interaction — it shows you truly know their business."],
  ["🎉", "Recognize Milestones", "Congratulate carriers on new equipment purchases authority anniversaries and income milestones. Small personal recognitions build significant loyalty over time."],
  ["⚔️", "Advocate Fiercely", "When brokers are slow to pay or make unreasonable demands advocate for your carrier aggressively. Carriers should always feel you are fighting for them."],
  ["📈", "Grow With Them", "When a carrier purchases a second truck be the first to offer to expand your dispatching relationship to cover the new unit. Carrier growth is your growth."],
];

const EXPECTATIONS = [
  ["Income Expectations", "Be honest about realistic income potential per mile for their equipment and lanes. Do not overpromise and underdeliver — that destroys trust faster than anything."],
  ["Load Volume", "How many loads per week can you realistically find for their equipment and lane preferences? Be conservative in promises and exceed expectations in delivery."],
  ["Rate Fluctuation", "Explain that spot rates fluctuate with market conditions. A carrier who was not prepared for rate swings will blame the dispatcher when rates drop."],
  ["Payment Timeline", "Walk through the complete payment process — delivery POD invoice broker payment terms factoring — so the carrier understands the full timeline before expecting funds."],
];

const TAKEAWAYS = [
  ["📋", "Always have a signed DSA", " — never book a single load without a legally binding dispatch service agreement in place. No exceptions."],
  ["✅", "Thorough onboarding protects everyone", " — collecting verifying and filing all carrier documents before the first load prevents problems that are far harder to resolve later."],
  ["📞", "Proactive communication builds trust", " — respond within 1 hour give unprompted updates be transparent about rates and deliver bad news honestly. This is what separates great dispatchers from average ones."],
  ["⚠️", "Handle problems immediately", " — TONU detention and cancellations handled quickly and professionally preserve relationships. Problems ignored destroy them."],
  ["🏆", "Retention beats acquisition", " — a carrier retained for years generates far more income than constantly replacing churned carriers. Invest in existing relationships first."],
];

export default function Module13Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 13 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 13 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2332356734&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 13 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 13 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Dealing With <span style={{ color: RED }}>Carriers</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          Finding a carrier is the beginning. Keeping a carrier — and building the kind of relationship where they trust you completely and recommend you to other carriers — is what builds a sustainable high-income dispatching operation.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1000&q=80" alt="Dispatcher Carrier Relationship" />
          <p>Many new dispatchers focus intensely on acquisition and neglect relationship management. This is a costly mistake. Acquiring a new carrier requires significant effort — prospecting calling pitching negotiating the agreement and onboarding. Retaining an existing carrier requires consistent performance and professional communication.</p>
          <Highlight>💡 ROI Reality: The ROI on retention is far superior to acquisition. A carrier who stays with you for 2 years generates far more total commission than the effort required to find and sign them — compared to constantly replacing churned carriers.</Highlight>
        </Block>

        {/* DSA */}
        <Block icon="📋" title="The Dispatch Service Agreement">
          <SectionImg src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&q=80" alt="Dispatch Service Agreement Contract" />
          <p>Before you book a single load for any carrier you must have a signed Dispatch Service Agreement. This is a legal contract between your dispatch company and the carrier that establishes the terms of your working relationship.</p>
          <Warning>⚠️ Never operate without signed agreements. Disputes without contracts are resolved entirely against you. Get a lawyer-reviewed DSA template before you sign your first carrier.</Warning>
          <p className="font-black mt-4 mb-3" style={{ color: NAVY }}>Key Elements of a Dispatch Service Agreement:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
            {DSA_ELEMENTS.map(([title, desc]) => <DsaItem key={title} title={title} desc={desc} />)}
          </div>
        </Block>

        {/* ONBOARDING */}
        <Block icon="🚛" title="Carrier Onboarding Process">
          <SectionImg src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1000&q=80" alt="Carrier Onboarding Checklist" />
          <p>When a new carrier signs with you follow a thorough onboarding process before booking their first load:</p>
          <div className="flex flex-col gap-0 mt-4 rounded-xl overflow-hidden shadow-sm">
            {ONBOARDING.map(([icon, title, desc], i) => (
              <div key={i} className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${i !== ONBOARDING.length - 1 ? "border-b-2" : ""}`} style={{ borderColor: "#f4f6fb" }}>
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <h4 className="text-sm font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Success>✅ Pre-Approval Advantage: Getting your carrier pre-approved with multiple brokers before their truck is available ensures you can book quickly when the right load appears. Never wait until the carrier is available to start broker setup.</Success>
        </Block>

        {/* COMMUNICATION */}
        <Block icon="📞" title="Communication Standards">
          <SectionImg src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1000&q=80" alt="Professional Dispatcher Communication" />
          <p>Professional consistent communication is the foundation of a strong carrier relationship.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            {COMM.map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-xl p-5 shadow-sm transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${NAVY}` }}>
                <span className="text-3xl block mb-2.5">{icon}</span>
                <h4 className="text-sm font-black mb-2" style={{ color: NAVY }}>{title}</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* PROBLEMS */}
        <Block icon="⚠️" title="Handling Disputes and Problems">
          <SectionImg src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80" alt="Handling Carrier Disputes Professionally" />
          <p>Problems will occur. How you handle them defines your reputation as a dispatcher.</p>
          <div className="flex flex-col gap-3.5 mt-4">
            {PROBLEMS.map(([title, steps]) => (
              <div key={title} className="bg-white rounded-xl p-5 shadow-sm" style={{ borderLeft: `6px solid ${RED}` }}>
                <h4 className="text-sm font-black mb-2.5" style={{ color: RED }}>{title}</h4>
                <ol className="pl-5 space-y-1.5">
                  {steps.map((s, i) => <li key={i} className="text-[13px] text-slate-600 leading-relaxed">{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </Block>

        {/* LOYALTY */}
        <Block icon="🏆" title="Building Long-Term Loyalty">
          <SectionImg src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1000&q=80" alt="Long Term Carrier Loyalty Strategy" />
          <p>The carriers who stay with you for years are the foundation of a high-income dispatching operation. Here is what builds that lasting loyalty:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            {LOYALTY.map(([icon, title, desc]) => (
              <div key={title} className="rounded-xl p-5 transition-transform hover:-translate-y-1" style={{ background: "#f4f6fb", borderBottom: `4px solid ${RED}` }}>
                <span className="text-3xl block mb-2.5">{icon}</span>
                <h4 className="text-sm font-black mb-2" style={{ color: NAVY }}>{title}</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* EXPECTATIONS */}
        <Block icon="🎯" title="Managing Carrier Expectations">
          <p>The most common source of carrier-dispatcher conflict is misaligned expectations. Set expectations correctly from day one on these four areas:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
            {EXPECTATIONS.map(([title, desc]) => <DsaItem key={title} title={title} desc={desc} />)}
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 13</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 14 is next — Dealing With Brokers. Learn how to build the broker relationships that give your carriers access to the best freight on the market.</p>
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
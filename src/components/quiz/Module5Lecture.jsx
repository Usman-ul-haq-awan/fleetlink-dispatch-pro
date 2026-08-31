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

const WANTS = [
  ["📦", "Consistent Load Volume", "Every hour a truck sits empty costs money. They want a dispatcher who consistently finds good loads and keeps them moving without gaps."],
  ["💰", "Good Rates", "Carriers want maximum revenue per mile. A dispatcher who consistently negotiates above-market rates is worth their fee many times over."],
  ["🗺️", "Preferred Lanes", "Many carriers have preferred home lanes — routes that bring them back near their home base. Respecting lane preferences builds loyalty."],
  ["📉", "Minimal Deadhead", "Empty miles are wasted money. Carriers want dispatchers who plan load sequences intelligently to minimize empty repositioning miles."],
  ["📞", "Professional Communication", "Carriers want a dispatcher who is reachable, responsive, and professional. They do not want to wonder where their paperwork is."],
  ["🔍", "Transparency", "No hidden fees, clear agreements, honest communication about rates and market conditions at all times."],
  ["⚡", "Quick Problem Resolution", "When issues arise — detention, cancellations, delivery problems — carriers want a dispatcher who handles them quickly and professionally."],
];

const CARRIERS = [
  { num: "Type 01", img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80", name: "👤 Owner-Operators (Solo)", desc: "Individual truck owners who drive their own truck. May have 1 to 3 trucks. The ideal target for new dispatchers.", desc2: "They desperately need dispatching support — they cannot drive and find loads simultaneously. Decision-making is immediate — you talk directly to the decision-maker.", tag: "✅ Best For Beginners" },
  { num: "Type 02", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", name: "🚛 Small Fleets — 2 to 10 Trucks", desc: "Small fleet owners need dispatching support but may already have some systems in place.", desc2: "Excellent clients because once you sign them you are dispatching multiple trucks generating multiple commissions simultaneously. Slightly more selective than owner-operators.", tag: "✅ Good for Growing Dispatchers" },
  { num: "Type 03", img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80", name: "🆕 New Carriers — Recently Registered", desc: "Every week hundreds of new carriers register with FMCSA and obtain operating authority for the first time.", desc2: "These new operators are hungry for business and have not yet established relationships with dispatchers. They are highly receptive to being approached and signed quickly.", tag: "✅ High Conversion Rate" },
  { num: "Type 04", img: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80", name: "🏢 Medium to Large Fleets — 10+ Trucks", desc: "These operations typically have in-house dispatchers or formal contracts with established companies.", desc2: "As a new dispatcher do not target large fleets initially. Your resources and reputation are not yet sufficient to compete. Focus here after 12 to 18 months of established operation.", tag: "⏳ Target After 12–18 Months" },
];

const PORTFOLIO = [
  ["🚛", "Diversity of Equipment", "Dry van, reefer, flatbed — different equipment gives you access to different load markets."],
  ["🗺️", "Diversity of Location", "Carriers spread across different regions allow you to serve different lane markets."],
  ["⚖️", "Diversity of Size", "Mix of owner-operators and small fleets balances stability with growth potential."],
  ["🤝", "Depth of Relationship", "A few carriers with deep trust are worth more than many shallow connections."],
];

const FUNNEL = [
  ["Prospecting", "Identifying carriers who could potentially become your clients using FMCSA databases, load boards, websites, social media, and cold calling lists to build a database of prospects."],
  ["Initial Contact", "Making the first contact by phone, email, or social media. The goal is NOT to close a deal — it is to introduce yourself, briefly explain your value, and create enough interest for a real conversation."],
  ["Discovery", "Understanding the carrier's specific situation — equipment, preferred lanes, current pain points, and income goals. This information allows you to make a compelling specific proposal."],
  ["Proposal", "Presenting your dispatching service as the solution to their specific needs — your fee, your services, your commitment, and your specific plan for their lanes and equipment."],
  ["Agreement", "Signing a dispatch service agreement. This formalizes the relationship, establishes your commission rate, outlines both parties' responsibilities, and protects both parties legally."],
  ["Activation", "Finding the first load for the carrier. This is the moment of truth — your carrier will judge you quickly on the quality and rate of the first few loads you book. Make this count."],
  ["Retention", "Consistently performing at a high level to maintain the relationship long-term. Retained carriers are far more valuable than new ones — no ramp-up period, maximum trust, maximum loyalty."],
];

const METHODS = [
  { num: "Method 01", img: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=600&q=80", name: "📞 Cold Calling", desc: "Directly calling carriers using phone numbers sourced from FMCSA databases and other directories. The fastest method for generating immediate conversations. Uncomfortable initially but highly effective with scripts and practice." },
  { num: "Method 02", img: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&q=80", name: "📧 Email Outreach", desc: "Sending targeted personalized emails to carriers found through FMCSA and other databases. Allows you to reach large numbers efficiently. Response rates are lower than cold calling but the process is highly scalable." },
  { num: "Method 03", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80", name: "🏛️ FMCSA and Safer Web", desc: "Directly accessing US government databases of registered carriers. Contains contact information for hundreds of thousands of carriers. Filtering by equipment type, authority age, and location allows precise targeting." },
  { num: "Method 04", img: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600&q=80", name: "🌐 Free Carrier Websites", desc: "Several websites aggregate carrier information and make it searchable. Five of the most powerful free platforms are covered in complete detail in their own dedicated lecture." },
  { num: "Method 05", img: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80", name: "📱 Social Media", desc: "Facebook groups, LinkedIn, and Instagram communities for truckers are active spaces where carriers seek dispatchers and share industry information. Warm lead environments where relationship-building happens naturally." },
];

const DB_TAGS = [
  "📋 Carrier Name", "🔢 MC / DOT Number", "👤 Contact Name", "📞 Phone Number", "📧 Email Address",
  "🚛 Equipment Type", "🗺️ Operating States", "🔢 Number of Trucks", "📅 Authority Issue Date",
  "📆 Contact Date", "📝 Outcome / Notes", "🔔 Follow-up Date",
];

const TAKEAWAYS = [
  ["🚛", "Carriers are your clients", " — loads are always available. The constraint is having signed carriers to move those loads. Carrier acquisition is your most important skill."],
  ["👤", "Target owner-operators first", " — they are most receptive, most loyal, and most accessible for new dispatchers. Build your first 3 to 5 carriers from this segment."],
  ["🆕", "New carriers are gold", " — recently registered FMCSA carriers have no dispatcher relationships yet. They are hungry for business and highly receptive to your approach."],
  ["🔄", "Acquisition is a funnel not an event", " — from prospecting through retention is a 7 stage process. Understand each stage and you will never feel lost or frustrated."],
  ["🗂️", "Build your database before your first call", " — a well-maintained prospect database is a business asset that compounds in value over time."],
  ["📊", "Target 3 to 5 active carriers to start", " — this is manageable, income-generating, and the foundation you scale from."],
];

export default function Module5Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 5 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 5 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330669264&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 5 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 5 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          How to Find <span style={{ color: RED }}>Carriers</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          Carriers are your clients. Without carriers you have no income. This module teaches you the complete strategic system for finding, approaching, and signing carriers for your dispatching business.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1000&q=80" alt="Truck Carrier on Highway" />
          <p>If truck dispatching is a business, then carriers are your clients. Without carriers, you have no one to dispatch for. Without active, quality carriers in your portfolio, you have no income. This makes finding and signing carriers the single most critical skill a new dispatcher must develop.</p>
          <Warning>⚠️ Common Mistake: Many new dispatchers spend all their time learning load boards and ignore carrier acquisition. This is backwards. Loads are always available — the constraint is having carriers signed with you to take those loads.</Warning>
          <Highlight>💡 The Truth: There are hundreds of thousands of loads posted on DAT every single day. The constraint is NOT loads — it is having carriers signed with you to move those loads.</Highlight>
        </Block>

        {/* WHAT CARRIERS WANT */}
        <Block icon="🤝" title="Understanding What Carriers Want">
          <SectionImg src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1000&q=80" alt="Truck Driver and Carrier" />
          <p>Before you can effectively find and sign carriers, you need to understand what they actually want from a dispatcher. Carriers are businesspeople. They own expensive equipment — a truck can cost $100,000–$200,000 new. They have fuel costs, insurance costs, maintenance costs, and driver payments. They need to keep their trucks loaded and moving.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {WANTS.map(([icon, title, desc]) => (
              <div key={title} className="rounded-lg p-4 flex items-start gap-3 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `4px solid ${NAVY}` }}>
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <h4 className="text-sm font-black mb-1.5" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* TYPES OF CARRIERS */}
        <SectionTitle>🚛 Types of Carriers to Target</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {CARRIERS.map((c) => (
            <div key={c.num} className="bg-white rounded-xl overflow-hidden shadow-md transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${RED}` }}>
              <Image src={c.img} alt={c.name} fittingType="fill" className="w-full h-[180px]" />
              <div className="p-5">
                <span className="inline-block text-[11px] font-black text-white px-3 py-1 rounded-full mb-2.5" style={{ background: RED }}>{c.num}</span>
                <h3 className="text-base font-black mb-2" style={{ color: NAVY }}>{c.name}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{c.desc}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{c.desc2}</p>
                <span className="inline-block text-[11px] font-black px-2.5 py-1 rounded-lg" style={{ background: "#f0fff4", color: "#1a7a3a", border: `1px solid ${GREEN}` }}>{c.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* PORTFOLIO */}
        <Block icon="📊" title="The Carrier Portfolio Concept">
          <SectionImg src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1000&q=80" alt="Carrier Portfolio Strategy" />
          <p>As a dispatcher think of your active carriers as a portfolio — like an investment portfolio. You want diversity and depth.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {PORTFOLIO.map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-lg p-5 text-center shadow-sm transition-transform hover:-translate-y-1" style={{ borderBottom: `4px solid ${RED}` }}>
                <span className="text-3xl block mb-2.5">{icon}</span>
                <h4 className="text-sm font-black mb-1.5" style={{ color: NAVY }}>{title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
          <Success>✅ Ideal Starting Portfolio: 3 to 5 active carriers. This is manageable for one dispatcher and generates meaningful income. As you systematize your operation you scale up from there.</Success>
        </Block>

        {/* FUNNEL */}
        <Block icon="🔄" title="The Carrier Acquisition Funnel">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Carrier Acquisition Funnel" />
          <p>Finding a carrier is not a single event — it is a process. Understanding this process prevents frustration and premature giving up.</p>
          <div className="rounded-xl overflow-hidden mt-4" style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
            {FUNNEL.map(([title, desc], i) => (
              <div key={title} className="flex items-start gap-4 sm:gap-5 px-5 sm:px-6 py-4 transition-colors hover:bg-slate-50 border-b last:border-b-0 border-slate-100">
                <span className="text-base font-black text-white w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: RED }}>{i + 1}</span>
                <div>
                  <h4 className="text-sm sm:text-base font-black mb-1.5" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* METHODS */}
        <SectionTitle>🎯 The Five Core Methods for Finding Carriers</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {METHODS.map((m) => (
            <div key={m.num} className="bg-white rounded-xl overflow-hidden shadow-md transition-transform hover:-translate-y-1">
              <Image src={m.img} alt={m.name} fittingType="fill" className="w-full h-[160px]" />
              <div className="p-5" style={{ borderTop: `4px solid ${RED}` }}>
                <span className="inline-block text-[11px] font-black text-white px-3 py-1 rounded-full mb-2.5" style={{ background: NAVY }}>{m.num}</span>
                <h3 className="text-base font-black mb-2" style={{ color: NAVY }}>{m.name}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* DATABASE */}
        <Block icon="🗂️" title="Building Your Carrier Prospect Database">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Carrier Database Spreadsheet" />
          <p>Before you make your first call or send your first email, build a prospect database. This is a spreadsheet or CRM with the following information for each carrier:</p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {DB_TAGS.map((t) => (
              <span key={t} className="text-xs font-bold px-3.5 py-2 rounded-full" style={{ background: "#f4f6fb", color: NAVY, border: `2px solid ${NAVY}` }}>{t}</span>
            ))}
          </div>
          <Highlight>💡 A well-maintained prospect database is a business asset. Many dispatching relationships begin after the third, fourth, or even fifth contact — not the first. Without a database you lose track of these opportunities forever.</Highlight>
        </Block>

        {/* SCRIPT */}
        <Block icon="🗣️" title="What to Say When You Find a Carrier">
          <p>Every new dispatcher panics about what to say on the first contact. Here is your foundational opening script — refined further in the cold calling lecture:</p>
          <div className="rounded-xl p-6 sm:p-7 my-4" style={{ background: NAVY }}>
            <h3 className="text-base sm:text-lg font-black mb-3" style={{ color: RED }}>📞 Opening Script — First Contact</h3>
            <div className="rounded-r-lg px-5 py-5 text-sm text-white leading-relaxed italic" style={{ background: "rgba(255,255,255,0.1)", borderLeft: `4px solid ${RED}` }}>
              "Hi, my name is [Name] and I am calling from [Your Dispatch Company Name]. I work with [truck type] owner-operators helping them find consistent, high-paying loads. I noticed you are running [general area/lane] and wanted to see if you are currently looking for dispatching support or if your load situation is solid right now."
            </div>
            <p className="text-[13px] text-slate-300 mt-4 leading-relaxed">This script is professional and brief. It is non-pushy — asks rather than pitches immediately. It is relevant — references their specific equipment and area. And it is conversation-opening — invites them to share their situation naturally.</p>
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 5</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 6 is next — Finding Carriers by Cold Calling. The fastest and most direct method for signing your first carrier.</p>
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
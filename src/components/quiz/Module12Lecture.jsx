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

function LoadBoardCard({ rank, name, url, img, imgAlt, features, bestFor, children }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-8">
      <div className="p-5 sm:p-6 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #0a2a6e, #0d3080)" }}>
        <span className="text-base font-black text-white flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: RED }}>{rank}</span>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white mb-1">{name}</h3>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold hover:text-white" style={{ color: RED }}>{url.replace("https://www.", "")}</a>
        </div>
      </div>
      <div className="p-6 sm:p-7" style={{ borderTop: `4px solid ${RED}` }}>
        <div className="rounded-xl overflow-hidden mb-5">
          <Image src={img} alt={imgAlt} fittingType="fill" className="w-full h-[200px]" />
        </div>
        {children}
        <div className="flex flex-wrap gap-2 my-3">
          {features.map((f) => (
            <span key={f} className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "#f4f6fb", color: NAVY, border: "1px solid #e0e0e0" }}>{f}</span>
          ))}
        </div>
        <span className="inline-block text-xs font-black text-white px-4 py-1.5 rounded-full mt-3" style={{ background: NAVY }}>{bestFor}</span>
      </div>
    </div>
  );
}

function PriceWrap({ children }) {
  return (
    <div className="rounded-lg p-4 my-4" style={{ background: "#f4f6fb" }}>
      <h4 className="text-[13px] font-black mb-2.5 uppercase" style={{ color: NAVY }}>💰 Pricing Plans</h4>
      {children}
    </div>
  );
}

function PriceItem({ plan, cost }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-200 last:border-b-0">
      <span className="text-[13px] text-slate-600">{plan}</span>
      <span className="text-[13px] font-black" style={{ color: RED }}>{cost}</span>
    </div>
  );
}

const EVAL_ITEMS = [
  ["💰", "Rate Per Mile", "Compare posted rate against DAT rate analytics for the lane. Is it at market above market or below? Never book without checking the lane average first."],
  ["📍", "Deadhead Distance", "How far does your carrier travel empty to reach pickup? Excessive deadhead erodes profitability significantly. Factor empty miles into your total RPM calculation."],
  ["⏰", "Pickup and Delivery Timing", "Do the windows work with your carrier's current location HOS situation and preferences? Unrealistic timing creates problems for everyone."],
  ["📏", "Total Distance", "Short loads under 200 miles often have lower RPM. Make sure the absolute dollar amount justifies the time and commitment from your carrier."],
  ["⭐", "Broker Reliability", "Check the broker's DAT credit score and payment history before booking. Especially critical for new broker relationships — one bad broker can create weeks of payment problems."],
  ["📦", "Commodity Concerns", "Is this a commodity your carrier is equipped and comfortable handling? Any special requirements — food grade HAZMAT white-glove delivery — that your carrier cannot meet?"],
];

const WORKFLOW = [
  ["Know Your Carrier's Position", "Where are they now? When are they available for next pickup? What is their preferred destination?"],
  ["Open Primary Load Board", "Enter origin location — current carrier position or delivery destination — and pickup date on DAT."],
  ["Filter for Equipment Type", "Select the correct trailer type for your carrier. Never search with the wrong equipment type selected."],
  ["Sort by Rate Per Mile", "Highest RPM loads first. Start with the best paying options and work down only if needed."],
  ["Check Rate Analytics", "For the top 5 to 10 loads verify the posted rate against lane averages. Know your negotiating position before calling."],
  ["Evaluate Load Details", "Deadhead timing commodity broker rating. Eliminate loads that fail the evaluation framework before calling."],
  ["Call the Broker", "Negotiate rate if below market. Confirm load availability timeline and all special requirements."],
  ["Book the Load", "Get the rate confirmation sent and signed before your carrier moves. Never move without a signed rate con."],
  ["Communicate to Carrier", "Confirm pickup details special instructions and broker contact information. Leave nothing assumed."],
  ["Monitor Until Delivery", "Stay in contact throughout the load until delivery is confirmed and POD is obtained and submitted."],
];

const DAT_STEPS = [
  "Select your equipment type — match your carrier's specific trailer",
  "Enter origin location — where your carrier is available",
  "Set pickup date to match carrier availability",
  "Set destination or leave open to see all available loads",
  "Sort by rate per mile — highest first",
  "Filter out brokers with poor credit ratings",
  "Check rate analytics before making any calls",
  "Contact brokers on highest-paying best-timed loads first",
];

const TAKEAWAYS = [
  ["📊", "DAT is your primary load board", " — start here every time. The rate analytics feature alone justifies the subscription cost many times over."],
  ["🔄", "Subscribe to multiple boards", " — different brokers use different platforms. DAT plus Truckstop gives you access to virtually every load in the US market."],
  ["📈", "Always negotiate from data", " — check DAT rate analytics before every broker call. Never guess what a lane should pay when the data is right in front of you."],
  ["⚖️", "Evaluate every load before booking", " — rate per mile deadhead timing broker rating and commodity. The right load maximizes carrier profitability and your commission."],
  ["🔟", "Follow the 10-step workflow", " — systematic load finding prevents mistakes and ensures every load you book is the best available option for your carrier at that moment."],
];

export default function Module12Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 12 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 12 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2332356737&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 12 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 12 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          How to Find Loads Through <span style={{ color: RED }}>Load Boards</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          If carriers are one half of your dispatching business loads are the other half. Mastery of load boards is the core operational skill that keeps your carriers moving and your income growing.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80" alt="Load Board Dashboard Dispatcher" />
          <p>If carriers are one half of your dispatching business loads are the other half. Without loads your carriers sit idle you earn no commission and the relationship deteriorates quickly. Finding consistently good loads — high-paying well-located and suitable for your carrier's equipment — is the core operational skill of truck dispatching.</p>
          <Highlight>💡 Load boards are your primary tool for finding loads. In this lecture we cover the major load boards in depth — how they work how to search effectively how to evaluate loads and how to develop a systematic load-finding process that keeps your carriers moving profitably.</Highlight>
        </Block>

        <Block icon="📋" title="What is a Load Board?">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Load Board Online Marketplace" />
          <p>A load board is an online marketplace where freight brokers and shippers post available loads that need to be transported. Carriers dispatchers and brokers search these postings to find freight matching available trucks.</p>
          <p>Today's load boards are comprehensive market intelligence tools — they not only list available loads but also show historical rate data by lane current market conditions carrier availability data and broker performance ratings.</p>
          <Success>✅ Evolution of Load Boards: What began as physical bulletin boards at truck stops became phone-based matching services and then evolved into sophisticated online platforms with real-time data rate analytics market intelligence and mobile apps.</Success>
        </Block>

        {/* DAT */}
        <LoadBoardCard
          rank={1} name="DAT Load Board — Industry Standard" url="https://www.dat.com"
          img="https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80" imgAlt="DAT Load Board Search Interface"
          features={["🔍 Real-time load search", "📊 Rate analytics by lane", "⭐ Broker credit scores", "🚛 Post trucks feature", "📈 Market conditions data", "📱 Mobile app"]}
          bestFor="✅ Best For: All dispatchers — primary load board — non-negotiable">
          <p>DAT is the largest and most comprehensive load board in North America. With hundreds of thousands of loads posted daily across all equipment types and all US lanes DAT is the starting point for every professional dispatcher.</p>
          <PriceWrap>
            <PriceItem plan="DAT One Essential — basic load search" cost="~$45/month" />
            <PriceItem plan="DAT One Advanced — rate analytics and market data" cost="~$100/month" />
            <PriceItem plan="DAT One Premium — full analytics suite" cost="~$150/month" />
          </PriceWrap>
          <Highlight>💡 Rate Analytics Power: DAT's rate view shows the average high and low rates for a specific lane over the past 7 15 or 30 days — derived from millions of actual transactions. When a broker offers $2.20/mile on a lane averaging $2.50 you have data to justify pushing for a higher rate.</Highlight>
          <Warning>⚠️ Broker Credit Scores: Check every new broker's credit score before booking. Score 85 or above — reliable payment. Score below 70 — proceed with caution or avoid entirely.</Warning>
          <p className="font-black mt-4 mb-2.5" style={{ color: NAVY }}>How to Search Effectively on DAT:</p>
          <ol className="pl-5 space-y-1.5 my-2">
            {DAT_STEPS.map((s, i) => <li key={i} className="text-sm text-slate-600 leading-relaxed">{s}</li>)}
          </ol>
        </LoadBoardCard>

        {/* TRUCKSTOP */}
        <LoadBoardCard
          rank={2} name="Truckstop.com — Strong Competitor" url="https://www.truckstop.com"
          img="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80" imgAlt="Truckstop Load Board Platform"
          features={["🔍 Extensive load search", "📊 Rate check tool", "📈 Freight market analysis", "✅ Carrier compliance tools", "📦 Book Now feature", "🔗 TMS integration"]}
          bestFor="✅ Best For: Reefer and flatbed dispatchers — Southeast and Gulf Coast lanes">
          <p>Truckstop is DAT's primary competitor and the second-largest load board in North America. Many dispatchers subscribe to both DAT and Truckstop simultaneously because different brokers prefer different platforms — a load posted on Truckstop may not appear on DAT and vice versa.</p>
          <PriceWrap>
            <PriceItem plan="Basic access plan" cost="~$55/month" />
            <PriceItem plan="Higher tiers with analytics" cost="~$100+/month" />
          </PriceWrap>
          <Success>✅ When Truckstop Excels: Many reefer and flatbed loads appear on Truckstop that do not appear on DAT. Dispatchers focusing on temperature-controlled freight or specialized loads benefit significantly from Truckstop. Also strong in Southeast and Gulf Coast regions.</Success>
        </LoadBoardCard>

        {/* 123LOADBOARD */}
        <LoadBoardCard
          rank={3} name="123Loadboard — Beginner Friendly" url="https://www.123loadboard.com"
          img="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80" imgAlt="123Loadboard Interface"
          features={["📱 Best mobile app", "📊 Rate check tool", "⛽ Fuel cost calculator", "📏 Mileage calculator", "🚛 Carrier finder feature", "💰 Affordable pricing"]}
          bestFor="✅ Best For: New dispatchers — affordable starting point">
          <p>123Loadboard is particularly popular among smaller carriers and newer dispatchers because of its affordable pricing and user-friendly interface. One of the best mobile apps in the load board market.</p>
          <PriceWrap>
            <PriceItem plan="Free tier — limited searches" cost="Free" />
            <PriceItem plan="Premium plan" cost="~$35/month" />
            <PriceItem plan="Premium Plus" cost="~$55/month" />
          </PriceWrap>
          <Highlight>💡 Recommended Strategy: Start with 123Loadboard while in training and early operation. As your carrier portfolio grows and income increases add DAT then Truckstop. Build your load board stack progressively.</Highlight>
        </LoadBoardCard>

        {/* NEXT GEN */}
        <Block icon="🚀" title="Next Generation Platforms">
          <SectionImg src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1000&q=80" alt="Digital Freight Marketplace" />
          <p className="font-black mb-1.5" style={{ color: NAVY }}>Convoy — www.convoy.com</p>
          <p>Convoy uses machine learning to match loads with carriers automatically. It guarantees loads to carriers and works primarily with shippers directly — cutting out traditional brokers. More automated and less negotiation-heavy than traditional load boards. Valuable as a supplementary load source for consistent predictable freight on specific lanes.</p>
          <p className="font-black mt-4 mb-1.5" style={{ color: NAVY }}>Uber Freight — www.uberfreight.com</p>
          <p>Uber Freight applies the Uber model to commercial trucking — app-based matching transparent pricing streamlined transactions. Shippers post loads with fixed prices. No negotiation required but also no ability to push for higher rates.</p>
          <Highlight>💡 Use Uber Freight and Convoy as supplementary sources — when your carrier is in an area with limited traditional load board availability or when you need a quickly-booked load without negotiation time.</Highlight>
        </Block>

        {/* EVALUATION */}
        <Block icon="⚖️" title="Load Evaluation Framework">
          <SectionImg src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&q=80" alt="Load Evaluation Checklist" />
          <p>Not every load is worth booking. Before committing your carrier to any load evaluate it against these criteria:</p>
          <div className="flex flex-col gap-3 mt-4">
            {EVAL_ITEMS.map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-3.5 rounded-lg p-4 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `5px solid ${NAVY}` }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <h4 className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* WORKFLOW */}
        <Block icon="🔄" title="The Complete Load-Finding Workflow">
          <SectionImg src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1000&q=80" alt="Load Finding Workflow System" />
          <p>Here is the systematic 10-step process for finding loads for an active carrier:</p>
          <div className="flex flex-col gap-0 mt-4 rounded-xl overflow-hidden shadow-sm">
            {WORKFLOW.map(([title, desc], i) => (
              <div key={i} className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${i !== WORKFLOW.length - 1 ? "border-b-2" : ""}`} style={{ borderColor: "#f4f6fb" }}>
                <span className="text-sm font-black text-white flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: RED }}>{i + 1}</span>
                <div>
                  <h4 className="text-sm font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 12</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 13 is next — Dealing With Carriers. Learn how to build the carrier relationships that make your dispatching business durable and high-income.</p>
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
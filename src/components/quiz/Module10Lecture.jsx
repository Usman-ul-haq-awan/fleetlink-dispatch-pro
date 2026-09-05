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

function WebsiteCard({ num, name, url, img, imgAlt, features, bestFor, children }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-8" style={{ borderTop: `6px solid ${RED}` }}>
      <div className="p-5 sm:p-6 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #0a2a6e, #0d3080)" }}>
        <span className="text-lg font-black text-white flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: RED }}>{num}</span>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white mb-1">{name}</h3>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold hover:text-white" style={{ color: RED }}>{url.replace("https://www.", "")}</a>
        </div>
      </div>
      <div className="p-6 sm:p-7">
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

const ROUTINE = [
  ["Mon + Tue", "FMCSA Deep Pull", "Export new carriers from your target states registered in the past 30 days. Import into CRM. Begin cold calling this fresh list immediately."],
  ["Wednesday", "123Loadboard + Trulos", "Check truck postings on both platforms. Contact every carrier with a matching truck posting in your target lanes. These are warm leads — prioritize them over cold prospects."],
  ["Thursday", "Direct Freight + Getloaded", "Search both platforms for truck postings. Contact relevant carriers. Add non-urgent leads to your CRM for systematic email follow-up."],
  ["Friday", "Carrier411 Enrichment", "Use Carrier411 to fill in missing contact information for carriers identified through other methods but not fully reachable yet."],
  ["All Week", "Follow Up and Call", "Cold call all new prospects from Monday and Tuesday pull. Follow up systematically with all carriers contacted in previous weeks using your CRM schedule."],
];

const TAKEAWAYS = [
  ["🌐", "Five free platforms", " — 123Loadboard, Trulos, Direct Freight, Getloaded, and Carrier411 give you thousands of additional carrier prospects at zero cost beyond FMCSA."],
  ["🔥", "Truck postings are warm leads", " — a carrier posting truck availability is actively seeking freight right now. Contact them immediately before another dispatcher does."],
  ["⚔️", "Less competition on smaller platforms", " — Direct Freight and Getloaded have far fewer dispatchers competing for the same carriers compared to DAT and Truckstop."],
  ["✅", "Always verify with Carrier411", " — before signing any carrier run their MC number through Carrier411. Two minutes of verification protects you from carriers who cannot legally haul loads."],
  ["📅", "Use the weekly routine", " — systematic daily use of these platforms combined with FMCSA cold calling and email creates a carrier acquisition engine that never runs dry."],
];

export default function Module10Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 10 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 10 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2332026227&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 10 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 10 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          5 Free Websites to <span style={{ color: RED }}>Find Carriers</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          While FMCSA is the gold standard, five additional free platforms give you access to warm carrier leads every day. These are sources your competitors do not know about.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1000&q=80" alt="Free Carrier Finding Websites" />
          <p>While FMCSA is the gold standard for carrier data it is not the only free resource available to dispatchers. Several websites have been built specifically to help connect dispatchers, load boards, and carriers — and many of these are completely free to use at a level sufficient for finding real carriers to work with.</p>
          <Highlight>💡 These five free websites collectively give you access to thousands of carrier prospects at zero cost. When combined with FMCSA, cold calling, and email outreach they form a comprehensive carrier acquisition engine.</Highlight>
        </Block>

        {/* WEBSITE 1 */}
        <WebsiteCard
          num={1}
          name="123Loadboard"
          url="https://www.123loadboard.com"
          img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
          imgAlt="123Loadboard Platform"
          features={["🚛 Truck posting search", "📍 Location filtering", "🔧 Equipment type filter", "🛣️ Lane preferences", "💰 Free basic tier"]}
          bestFor="✅ Best For: Finding warm leads — carriers actively seeking loads today">
          <p>123Loadboard is a load board that also functions as a carrier-finding platform. While its primary purpose is posting and finding loads it has a carrier search feature that allows dispatchers to find available trucks in specific areas.</p>
          <p>Carriers post their available trucks on 123Loadboard specifying their location, equipment type, and the lanes they want to run. These truck postings are essentially carriers advertising their availability and willingness to take loads.</p>
          <div className="rounded-r-lg p-4 my-3" style={{ background: "#f0f4ff", borderLeft: `4px solid ${NAVY}` }}>
            <p className="text-[13px] font-bold leading-relaxed m-0" style={{ color: NAVY }}>💡 Pro Tip: Check truck postings in backhaul regions and remote industrial areas. Carriers in these positions are especially motivated to work with a dispatcher who can find them consistent freight out of challenging areas.</p>
          </div>
          <Success>✅ Warm Lead Advantage: When you see a truck posting you have a warm lead — a carrier with an empty truck who needs a load RIGHT NOW. Contact them immediately. They are not cold prospects — they are actively seeking freight.</Success>
        </WebsiteCard>

        {/* WEBSITE 2 */}
        <WebsiteCard
          num={2}
          name="Trulos"
          url="https://www.trulos.com"
          img="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
          imgAlt="Trulos Freight Matching Platform"
          features={["🔍 Find Trucks feature", "📦 Post loads for carriers", "🗺️ Lane preferences visible", "📅 Availability dates", "💰 100% Free"]}
          bestFor="✅ Best For: New dispatchers — zero budget carrier acquisition">
          <p>Trulos is a free freight matching platform designed specifically to help carriers find loads and allow dispatchers and brokers to find carriers. Unlike the major paid load boards Trulos emphasizes free access as its core value proposition.</p>
          <p>Trulos has a Find Trucks feature where you can search for available trucks by equipment type, origin state and city, destination lane preferences, and date of availability.</p>
          <div className="rounded-r-lg p-4 my-3" style={{ background: "#f0f4ff", borderLeft: `4px solid ${NAVY}` }}>
            <p className="text-[13px] font-bold leading-relaxed m-0" style={{ color: NAVY }}>💡 Reverse Strategy: Trulos allows you to post load opportunities and have carriers contact YOU — reversing the outreach dynamic entirely. Post a load from a specific location and attract carriers in that area who are looking for freight.</p>
          </div>
          <Success>✅ Genuinely Free: Trulos requires no credit card. For a new dispatcher building their initial carrier pipeline without a large budget Trulos provides real value at absolutely zero cost.</Success>
        </WebsiteCard>

        {/* WEBSITE 3 */}
        <WebsiteCard
          num={3}
          name="Direct Freight Services"
          url="https://www.directfreight.com"
          img="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80"
          imgAlt="Direct Freight Services Platform"
          features={["🚛 Truck search by location", "📊 Market rate information", "📦 Load posting capability", "📞 Carrier contact info", "💰 Free basic account"]}
          bestFor="✅ Best For: Less competitive outreach — better response rates">
          <p>Direct Freight is a load board and freight matching platform that has been operating for many years. It offers a free basic membership that gives access to limited searches and carrier contact features.</p>
          <p>Direct Freight's Find Trucks feature allows searching for available truck postings by equipment type, location, and availability date. The database covers a meaningful segment of owner-operators who prefer smaller less competitive platforms.</p>
          <div className="rounded-r-lg p-4 my-3" style={{ background: "#f0f4ff", borderLeft: `4px solid ${NAVY}` }}>
            <p className="text-[13px] font-bold leading-relaxed m-0" style={{ color: NAVY }}>💡 Less Competition Advantage: When carriers post on DAT or Truckstop they receive dozens of calls simultaneously. Carriers who post on Direct Freight are on a less trafficked platform — meaning fewer dispatchers competing to contact them. Your outreach has a better chance of being heard.</p>
          </div>
        </WebsiteCard>

        {/* WEBSITE 4 */}
        <WebsiteCard
          num={4}
          name="Getloaded"
          url="https://www.getloaded.com"
          img="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80"
          imgAlt="Getloaded Legacy Platform"
          features={["🚛 Truck search functionality", "🗺️ Lane preferences", "📞 Carrier contact details", "🆓 Free registration"]}
          bestFor="✅ Best For: Reaching experienced veteran owner-operators">
          <p>Getloaded is one of the older freight matching platforms — operating since the early days of internet-based trucking. While considered a legacy platform compared to modern DAT and Truckstop systems it maintains an active user base of carriers and dispatchers who have used it for years.</p>
          <div className="rounded-r-lg p-4 my-3" style={{ background: "#f0f4ff", borderLeft: `4px solid ${NAVY}` }}>
            <p className="text-[13px] font-bold leading-relaxed m-0" style={{ color: NAVY }}>💡 Experienced Carrier Gold Mine: The trucking industry is full of experienced owner-operators who have been in the business 15 to 20 years. Many continue to use Getloaded out of habit. These experienced carriers are often highly desirable clients — they know their lanes, have broker relationships, and are operationally efficient.</p>
          </div>
          <Warning>⚠️ Profile Matters: Complete your dispatcher profile professionally on Getloaded. Some carriers will look up your company information before responding to your contact. A complete professional profile converts better.</Warning>
        </WebsiteCard>

        {/* WEBSITE 5 */}
        <WebsiteCard
          num={5}
          name="Carrier411"
          url="https://www.carrier411.com"
          img="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80"
          imgAlt="Carrier411 Safety Database"
          features={["🔍 Carrier search by state", "🛡️ Insurance verification", "📊 Safety scores", "📞 Phone and email data", "📅 Authority grant date", "💰 Free basic lookup"]}
          bestFor="✅ Best For: Verification and filling missing contact data">
          <p>Carrier411 is unique in the dispatcher toolkit. While the other four websites are primarily load boards or freight matching platforms Carrier411 is specifically a carrier safety and information database. It aggregates carrier data from FMCSA and other sources in a searchable user-friendly format.</p>
          <p>For each carrier Carrier411 provides basic company information, MC and DOT numbers, insurance status, safety scores, phone and email contact information, and authority grant date.</p>
          <Success>✅ Contact Data Advantage: The contact information on Carrier411 is often more complete and current than what appears directly in FMCSA exports — making it an excellent supplementary source for filling in missing phone numbers and emails from your FMCSA list.</Success>
          <div className="rounded-r-lg p-4 my-3" style={{ background: "#f0f4ff", borderLeft: `4px solid ${NAVY}` }}>
            <p className="text-[13px] font-bold leading-relaxed m-0" style={{ color: NAVY }}>💡 Verification Power: Before signing any dispatch service agreement run the carrier MC number through Carrier411 to confirm their insurance is current, authority is active, and safety record is acceptable. This takes 2 minutes and protects you from committing to a carrier who cannot legally haul loads.</p>
          </div>
        </WebsiteCard>

        {/* WEEKLY ROUTINE */}
        <Block icon="📅" title="Weekly Carrier Prospecting Routine">
          <SectionImg src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80" alt="Weekly Carrier Prospecting Schedule" />
          <p>Rather than using these websites randomly build a systematic weekly routine. This ensures you are always prospecting from multiple sources simultaneously maintaining a diverse and constantly refreshed pipeline.</p>
          <div className="flex flex-col gap-0 mt-4 rounded-xl overflow-hidden shadow-sm">
            {ROUTINE.map(([day, title, desc], i) => (
              <div key={i} className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${i !== ROUTINE.length - 1 ? "border-b-2" : ""}`} style={{ borderColor: "#f4f6fb" }}>
                <span className="text-xs font-black text-white px-3.5 py-1.5 rounded-lg flex-shrink-0 text-center min-w-[90px]" style={{ background: RED }}>{day}</span>
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
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 10</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 11 is next — Finding Carriers Through Social Media. Facebook groups, LinkedIn, TikTok, and Instagram — the growing channel most dispatchers completely ignore.</p>
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
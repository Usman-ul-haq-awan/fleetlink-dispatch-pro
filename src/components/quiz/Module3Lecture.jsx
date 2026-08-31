import React from "react";
import LectureSlider from "./LectureSlider";

const NAVY = "#0a2a6e";
const RED = "#cc0000";

function Block({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 sm:p-8 mb-5 shadow-sm" style={{ borderLeft: `6px solid ${RED}` }}>
      <h2 className="text-lg sm:text-xl font-black mb-3 pb-3 border-b-2 border-slate-100" style={{ color: NAVY }}>{icon} {title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
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

const QUICK_REF = [
  ["FTL", "Full Truckload"], ["LTL", "Less Than Truckload"], ["RPM", "Rate Per Mile"],
  ["DH", "Deadhead Miles"], ["OTR", "Over The Road"], ["BOL", "Bill of Lading"],
  ["RC", "Rate Confirmation"], ["COI", "Certificate of Insurance"], ["NOA", "Notice of Assignment"],
  ["POD", "Proof of Delivery"], ["FSC", "Fuel Surcharge"], ["TONU", "Truck Ordered Not Used"],
  ["HOS", "Hours of Service"], ["ELD", "Electronic Logging Device"], ["MC#", "Motor Carrier Number"],
  ["DOT", "Dept of Transportation"], ["FMCSA", "Federal Motor Carrier Safety Admin"], ["CSA", "Compliance Safety Accountability"],
  ["PU", "Pickup"], ["DEL", "Delivery"], ["CRM", "Customer Relationship Mgmt"], ["DAT", "Largest USA Load Board"],
];

const CATEGORIES = [
  {
    icon: "📦", title: "Category 1 — Load and Freight Terminology",
    sub: "Terms you will use when discussing shipments, cargo types, and freight with brokers",
    terms: [
      { badge: "FREIGHT", name: "Load", desc: "Any shipment of goods that needs to be transported from one location to another. When a broker says \"I have a load\" they mean they have freight that needs to move.", ex: "💬 Example: \"I found a load on DAT going from Chicago to Dallas.\"" },
      { badge: "FREIGHT", name: "Freight", desc: "Another word for cargo or goods being transported. Can also refer to the charges associated with transporting them — freight charges.", ex: "💬 Example: \"The freight is electronics — handle with care.\"" },
      { badge: "FREIGHT", name: "Commodity", desc: "The specific type of goods being transported. Knowing the commodity is important because some require special handling, insurance coverage, or equipment.", ex: "💬 Example: \"What is the commodity?\" \"Steel coils, 42,000 lbs.\"" },
      { badge: "FREIGHT", name: "Full Truckload (FTL)", desc: "A shipment large enough to fill an entire trailer. FTL is the primary segment dispatchers work in. The shipper pays for the entire trailer regardless of whether it is completely full.", ex: "💬 Example: \"This is an FTL load — 44,000 lbs of packaged goods.\"" },
      { badge: "FREIGHT", name: "Less Than Truckload (LTL)", desc: "Multiple smaller shipments from different shippers consolidated into one trailer. Dispatchers generally focus on FTL loads — LTL is handled by specialized carriers and brokers.", ex: "💬 Example: \"We do not handle LTL — our carriers are FTL only.\"" },
      { badge: "FREIGHT", name: "Dry Van Load", desc: "A load transported in a standard enclosed dry van trailer. No temperature control required. Most common load type — best for beginners.", ex: "💬 Example: \"Dry van load, 53-foot, picking up Monday morning.\"" },
    ],
  },
  {
    icon: "🗺️", title: "Category 2 — Routing and Geography Terms",
    sub: "Terms related to routes, locations, miles, and driver schedules",
    terms: [
      { badge: "ROUTING", name: "Lane", desc: "The route between two points — an origin and a destination. High-demand lanes like Midwest to Southeast typically offer better rates and more consistent load availability.", ex: "💬 Example: \"My carrier loves the Chicago to Dallas lane.\"" },
      { badge: "ROUTING", name: "Origin and Destination", desc: "Origin is the pickup location. Destination is the delivery location. Always confirm both before booking any load.", ex: "💬 Example: \"Origin: Chicago IL. Destination: Dallas TX.\"" },
      { badge: "ROUTING", name: "Deadhead Miles (DH)", desc: "Miles a truck travels without a load — also called empty miles. Deadhead costs the carrier fuel and time without revenue. Minimizing deadhead is one of a dispatcher's most important skills.", ex: "💬 Example: \"How many DH miles to the next pickup? 45 miles — that is acceptable.\"" },
      { badge: "ROUTING", name: "OTR (Over The Road)", desc: "Long-haul trucking across multiple states — drivers spend days or weeks away from home. OTR drivers cover the most miles and carry the largest loads.", ex: "💬 Example: \"My carrier runs OTR — he is available for cross-country loads.\"" },
      { badge: "ROUTING", name: "Home Time", desc: "Time a driver spends at home. Good dispatchers balance maximizing loads with respecting drivers' need for home time — keeping carriers happy and loyal.", ex: "💬 Example: \"My driver needs home time in Atlanta every two weeks.\"" },
      { badge: "ROUTING", name: "Pickup (PU) and Delivery (DEL)", desc: "PU is collecting the freight at origin. DEL is dropping off at destination. Always note the exact times — late pickups and deliveries can result in penalties.", ex: "💬 Example: \"PU: Monday 08:00 — DEL: Wednesday 14:00.\"" },
    ],
  },
  {
    icon: "💰", title: "Category 3 — Rate and Payment Terms",
    sub: "The financial language of trucking — know these terms to negotiate like a professional",
    terms: [
      { badge: "RATES", name: "Rate Per Mile (RPM)", desc: "The amount paid per mile driven. Always calculate RPM to compare load profitability. Higher RPM loads are more profitable all other things being equal.", ex: "💬 Example: \"$3,000 for 1,200 miles = $2.50 RPM. Is that acceptable?\"" },
      { badge: "RATES", name: "Spot Rate", desc: "Current market rate for a one-time load at a specific moment. Spot rates fluctuate based on supply and demand. More loads than trucks — rates go up. More trucks than loads — rates go down.", ex: "💬 Example: \"What is the spot rate on this lane today?\"" },
      { badge: "RATES", name: "Contract Rate", desc: "A pre-negotiated rate for loads on a specific lane over an agreed period. Provides stability and predictability for both carrier and shipper.", ex: "💬 Example: \"We have a contract rate of $2.80 RPM on this lane.\"" },
      { badge: "RATES", name: "Fuel Surcharge (FSC)", desc: "Additional charge on top of the base freight rate to compensate for fuel costs. Fluctuates with diesel prices. Listed separately on rate confirmations.", ex: "💬 Example: \"Base rate $2,800 + FSC $150 = All-in $2,950.\"" },
      { badge: "RATES", name: "Dispatch Fee", desc: "Your commission as a dispatcher — typically 5–12% of gross load revenue. Negotiated and agreed upon in the dispatch service agreement with the carrier.", ex: "💬 Example: \"Our dispatch fee is 8% — on a $3,000 load that is $240.\"" },
      { badge: "RATES", name: "All-In Rate", desc: "A rate that includes all charges — base rate plus any accessorial charges — in one total number. Simplifies billing and avoids disputes.", ex: "💬 Example: \"Can we do $3,200 all-in including fuel surcharge?\"" },
    ],
  },
  {
    icon: "⚡", title: "Category 4 — Accessorial Charges",
    sub: "Extra charges beyond the base rate — every dispatcher must know these to protect carrier income",
    terms: [
      { badge: "ACCESSORIAL", name: "Detention", desc: "When a driver waits at pickup or delivery beyond the agreed free time — typically 2 hours. Detention charges compensate for lost time — typically $50–$100 per hour.", ex: "💬 Example: \"Driver has been waiting 3 hours — that is 1 hour of detention at $75/hr = $75 extra.\"" },
      { badge: "ACCESSORIAL", name: "Layover", desc: "When a driver must stay at a location overnight due to circumstances beyond their control. Layover pay is typically $150–$300 per day.", ex: "💬 Example: \"The facility is closed — driver needs layover pay for tonight.\"" },
      { badge: "ACCESSORIAL", name: "TONU", desc: "Truck Ordered Not Used — broker cancels after carrier positions for pickup. TONU compensation typically $150–$300. Always include TONU protection in your rate confirmation.", ex: "💬 Example: \"Load got cancelled — we need TONU pay of $200.\"" },
      { badge: "ACCESSORIAL", name: "Lumper", desc: "A worker who unloads freight at the destination. Lumper fees typically $50–$200. Usually paid by the shipper but must be clarified at booking to avoid disputes.", ex: "💬 Example: \"Does this facility use lumpers? Who pays the lumper fee?\"" },
    ],
  },
  {
    icon: "📄", title: "Category 5 — Documentation Terms",
    sub: "The paperwork language of trucking — these documents protect you, your carrier, and your income",
    terms: [
      { badge: "DOCUMENTS", name: "Rate Confirmation (RC)", desc: "Official contract between broker and carrier confirming all load details — origin, destination, commodity, rate, times, and special requirements. Never move a load without a signed RC.", ex: "💬 Example: \"Please send the rate con before my driver heads to pickup.\"" },
      { badge: "DOCUMENTS", name: "Bill of Lading (BOL)", desc: "Official shipping document traveling with the freight. Lists what is shipped, who shipped it, where it is going, and its condition at pickup. Required to invoice for payment.", ex: "💬 Example: \"Driver has the signed BOL — delivery confirmed.\"" },
      { badge: "DOCUMENTS", name: "Proof of Delivery (POD)", desc: "Signed BOL or delivery receipt confirming successful delivery. Required by most brokers before releasing payment to the carrier.", ex: "💬 Example: \"Please send the POD so we can process your invoice.\"" },
      { badge: "DOCUMENTS", name: "Certificate of Insurance (COI)", desc: "Document proving the carrier has valid liability and cargo insurance meeting broker requirements. Every broker requires COI before authorizing the first load.", ex: "💬 Example: \"Please email us your COI before we can dispatch this load.\"" },
      { badge: "DOCUMENTS", name: "Notice of Assignment (NOA)", desc: "Document notifying the broker that payment must go to the carrier's factoring company. After receiving NOA the broker must pay the factoring company — not the carrier directly.", ex: "💬 Example: \"My carrier factors — I am sending you their NOA now.\"" },
      { badge: "DOCUMENTS", name: "W9 Form", desc: "IRS tax form providing the dispatch company's legal name, address, and EIN. Brokers require this from dispatchers to process payments properly.", ex: "💬 Example: \"Here is our W9 — please add us to your approved vendor list.\"" },
    ],
  },
  {
    icon: "🏛️", title: "Category 6 — Regulatory Terms",
    sub: "Government and compliance language — know these to verify carriers and stay professional",
    terms: [
      { badge: "REGULATORY", name: "FMCSA", desc: "Federal Motor Carrier Safety Administration — the US government agency regulating commercial trucking. Maintains databases of all registered carriers, safety scores, and insurance. Dispatchers use FMCSA extensively to find and verify carriers.", ex: "💬 Example: \"I verified your MC number on FMCSA — everything looks good.\"" },
      { badge: "REGULATORY", name: "MC Number", desc: "Motor Carrier Number — unique identification assigned by FMCSA to authorized carriers and brokers. Every legitimate carrier has an MC number. Always verify before working with a new carrier.", ex: "💬 Example: \"What is your MC number? I need to verify it before we proceed.\"" },
      { badge: "REGULATORY", name: "DOT Number", desc: "Department of Transportation identification number for safety purposes. All commercial vehicles must display their DOT number. Used to look up carrier safety records.", ex: "💬 Example: \"Can you give me your DOT number so I can check your safety rating?\"" },
      { badge: "REGULATORY", name: "Hours of Service (HOS)", desc: "Federal regulations limiting driver driving hours before mandatory rest. A property-carrying driver can drive 11 hours within a 14-hour window after 10 consecutive hours off duty. Critical for planning realistic pickup and delivery times.", ex: "💬 Example: \"Driver has used 9 of his 11 hours — we need a realistic delivery window.\"" },
      { badge: "REGULATORY", name: "CSA Score", desc: "Compliance Safety Accountability — FMCSA's scoring system for carrier safety performance. Lower scores are better. Brokers check CSA scores before working with carriers. Always verify your carriers maintain acceptable scores.", ex: "💬 Example: \"What is your CSA score? Brokers require it to be below 65.\"" },
      { badge: "REGULATORY", name: "ELD", desc: "Electronic Logging Device — automatically records driver hours of service. All commercial trucks are required to use ELDs. Helps dispatchers track driver availability accurately.", ex: "💬 Example: \"Check your ELD — how many driving hours do you have left today?\"" },
    ],
  },
  {
    icon: "💻", title: "Category 7 — Load Board and Technology Terms",
    sub: "Digital tools and platforms every dispatcher uses daily",
    terms: [
      { badge: "TECHNOLOGY", name: "Load Board", desc: "Online platform where brokers post available loads and dispatchers search for freight. Major load boards include DAT, Truckstop, and 123Loadboard. Your primary tool for finding loads daily.", ex: "💬 Example: \"I found 3 good loads on DAT for your lane this morning.\"" },
      { badge: "TECHNOLOGY", name: "DAT Load Board", desc: "The largest and most comprehensive load board in North America. Thousands of loads posted daily across all equipment types. Industry standard — every professional dispatcher uses DAT.", ex: "💬 Example: \"DAT shows 847 loads available on this lane today.\"" },
      { badge: "TECHNOLOGY", name: "Book It Now", desc: "Feature on some load boards allowing dispatchers to instantly reserve a load without negotiating. Rate is fixed — you confirm immediately. Useful for securing loads in competitive markets.", ex: "💬 Example: \"This load has Book It Now at $2.75 RPM — should I book it?\"" },
      { badge: "TECHNOLOGY", name: "CRM", desc: "Customer Relationship Management software — tracks all carrier relationships, load history, communication records, and follow-up schedules. Essential organizational tool for professional dispatchers managing multiple carriers.", ex: "💬 Example: \"I logged this carrier in our CRM — follow up in 3 days.\"" },
    ],
  },
];

function TermCard({ t }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${RED}` }}>
      <span className="inline-block text-[11px] font-black text-white px-3 py-1 rounded-full mb-2.5" style={{ background: NAVY }}>{t.badge}</span>
      <h3 className="text-base font-black mb-2.5" style={{ color: RED }}>{t.name}</h3>
      <p className="text-[13px] text-slate-600 leading-relaxed m-0">{t.desc}</p>
      <div className="rounded-md px-3 py-2 mt-2.5 text-xs italic" style={{ background: "#f4f6fb", color: NAVY }}>{t.ex}</div>
    </div>
  );
}

const TAKEAWAYS = [
  ["📚", "Language is credibility", " — brokers and carriers judge your professionalism instantly by the terms you use. Master this vocabulary before your first call."],
  ["💰", "Protect your carrier's income", " — knowing terms like TONU, Detention, and Layover means you can charge for every minute of your carrier's time."],
  ["📄", "Documents are your protection", " — RC, BOL, COI, NOA, POD — never skip any document no matter how urgent the situation seems."],
  ["🏛️", "Always verify carriers", " — MC number, DOT number, CSA score, and insurance on FMCSA before working with any new carrier."],
  ["📊", "RPM is your profitability compass", " — always calculate rate per mile to compare loads and advise your carriers on which loads are worth taking."],
];

export default function Module3Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 3 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 3 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330597726&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true" />
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 3 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 3 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Terms Used in <span style={{ color: RED }}>USA Trucking</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          Every industry has its own language. Master this vocabulary and you will communicate with American brokers and carriers like a seasoned professional from your very first call.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <p>Every industry has its own language — a specialized vocabulary that professionals use to communicate quickly, precisely, and without confusion. The American trucking industry is no different. As a truck dispatcher operating from Pakistan, you will be communicating daily with American brokers, carriers, and drivers.</p>
          <Warning>⚠️ If you do not understand their terminology, you will appear inexperienced, waste time asking for clarifications, and lose credibility — which directly costs you money.</Warning>
          <p>This lecture is your comprehensive glossary of the terms you will hear, read, and use every single day as a professional truck dispatcher. We have organized them by category so they are easier to absorb and remember. Bookmark this page and keep it open during every call and load board session.</p>
        </Block>

        {/* QUICK REFERENCE */}
        <div className="bg-white rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg sm:text-xl font-black mb-4 pb-2.5 border-b-2 border-slate-100" style={{ color: NAVY }}>⚡ Quick Reference — Most Used Abbreviations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {QUICK_REF.map(([abbr, full]) => (
              <div key={abbr} className="rounded-lg px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: "#f4f6fb" }}>
                <span className="text-[13px] font-black min-w-[55px]" style={{ color: RED }}>{abbr}</span>
                <span className="text-xs text-slate-600">{full}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORIES */}
        {CATEGORIES.map((cat) => (
          <div key={cat.title} className="mb-10">
            <div className="rounded-xl p-4 sm:p-5 mb-5 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 100%)" }}>
              <span className="text-2xl sm:text-3xl">{cat.icon}</span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white m-0">{cat.title}</h2>
                <p className="text-xs text-slate-300 mt-1 m-0">{cat.sub}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cat.terms.map((t) => <TermCard key={t.name} t={t} />)}
            </div>
          </div>
        ))}

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 3</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 4 is next — Requirements for Dispatching. Learn exactly what you need to set up and start your dispatching operation from Pakistan.</p>
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
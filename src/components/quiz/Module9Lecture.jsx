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

const PORTALS = [
  ["🔍", "FMCSA Licensing and Insurance", "li.fmcsa.dot.gov", "Search for carriers with active authority, filter by operation type, and access contact information. Your primary source for building carrier prospect lists. Filter by state and equipment type."],
  ["🏛️", "Safer Web", "safer.fmcsa.dot.gov", "Search by MC number, DOT number, or company name for detailed carrier profiles including contact info, equipment type, insurance status, and safety scores. Best for individual carrier verification."],
  ["📊", "FMCSA Company Snapshot", "safer.fmcsa.dot.gov/CompanySnapshot", "Comprehensive overview of any carrier — number of trucks, number of drivers, authority status, insurance details, and safety rating. Use this before signing any dispatch agreement."],
  ["📈", "CSA Safety Measurement System", "ai.fmcsa.dot.gov", "Detailed carrier safety performance data across seven BASIC categories. Use this to verify carriers have acceptable safety records before committing to work with them."],
];

const STEPS = [
  ["Go to FMCSA L&I Portal", "Navigate to li.fmcsa.dot.gov. This portal allows you to search for active carriers and access their contact information in bulk."],
  ["Select Search Type", "Choose \"Active and Authorized for Property\" to filter for carriers currently licensed to haul freight. This eliminates inactive authorities, broker-only registrations, and passenger carriers."],
  ["Filter by State", "Select the states you want to target. Texas for Southwest lanes, Illinois for Midwest, Georgia for Southeast. Start with 3 to 5 states that represent your target lanes."],
  ["Filter by Equipment Type", "Under operation classification filter for specific types of operations. Narrow your search to the equipment type you want to dispatch — dry van, reefer, or flatbed."],
  ["Export Results as CSV", "Download your search results as a CSV spreadsheet file. Open in Excel or Google Sheets for further filtering and organization."],
  ["Clean Your Data", "Filter for carriers with 1 to 5 power units — owner-operators and small fleets. Remove records without phone numbers or email addresses. What remains is your targeted prospect list."],
  ["Supplement with Safer Web", "For carriers with minimal information in the export look them up individually on Safer Web to access more complete contact details and verify their company information."],
];

const SNAPSHOTS = [
  ["Operation Type", "What type of carrier they are — for-hire, private, or exempt — and what equipment they operate. Tells you immediately if they are relevant to your dispatching focus."],
  ["Power Units", "How many trucks they have. 1 power unit = solo owner-operator. 5 power units = small fleet with 5 trucks. Filter for 1 to 10 power units for your target market."],
  ["Drivers", "How many drivers are registered with the carrier. Cross-reference with power units — if they have 5 trucks and 1 driver that is worth clarifying."],
  ["Insurance Status", "Current insurance coverage levels and the insurance company. A carrier with lapsed insurance cannot legally operate — verify this is active before proceeding."],
  ["Safety Rating", "If audited — Satisfactory, Conditional, or Unsatisfactory. Most small carriers show \"Not Rated\" — they have not yet been audited. Conditional or Unsatisfactory ratings are red flags."],
  ["CSA Scores", "Safety Measurement System scores across seven categories. High scores indicate safety concerns. Brokers may refuse carriers with very high CSA scores — avoid these carriers."],
];

const VERIFY = [
  ["Active Operating Authority", "They can legally haul freight. Check their authority status is \"ACTIVE\" — not inactive, revoked, or pending. No active authority means no legal loads."],
  ["Valid Insurance", "Current cargo and liability insurance meeting broker requirements. Verify the insurance is active and the coverage amounts meet standard broker minimums — typically $1M liability and $100K cargo."],
  ["Acceptable Safety Record", "No pattern of serious violations. Carriers with Conditional or Unsatisfactory ratings will struggle to get loads from quality brokers — making them very difficult to dispatch profitably."],
  ["Equipment Matches What They Told You", "Verify truck count and type against what they told you. A carrier claiming 5 trucks but showing 1 power unit needs clarification. Verify before signing — not after."],
];

const DB_STEPS = [
  "Choose target states — start with 3 to 5 states representing lanes you want to cover",
  "Export active for-hire carriers from those states via FMCSA L&I portal",
  "Filter for 1 to 10 power units — owner-operators and small fleets only",
  "Sort by authority grant date — newest first for warmest leads at the top",
  "Remove records without contact information — phone and email required",
  "Import into your CRM with equipment type and state tags for organization",
  "Enrich records via Safer Web for carriers with incomplete contact information",
  "Begin outreach — cold calling and email simultaneously for maximum reach",
  "Refresh your list monthly — new carriers register every week and your pipeline must stay fresh",
];

const LIMITATIONS = [
  ["Phone Number Accuracy", "Numbers are sometimes outdated — carriers do not always update their FMCSA info", "Search carrier name on Google or LinkedIn for current contact information"],
  ["Email Completeness", "FMCSA does not always have email addresses on file", "Supplement with Carrier411 and direct Google searches for missing emails"],
  ["Equipment Detail", "FMCSA equipment classification is somewhat broad — not always specific", "Always confirm equipment specifics in your initial conversation with the carrier"],
  ["Contact Name", "Records often have company name but not the specific person to contact", "When calling start with \"Could I speak with the owner or dispatcher please?\""],
];

const TAKEAWAYS = [
  ["🏛️", "FMCSA is the backbone of carrier acquisition", " — free, comprehensive, government-maintained, and continually updated. Every professional dispatcher uses it."],
  ["🆕", "New carriers are your warmest leads", " — filter by authority grant date for carriers registered in the last 30 to 90 days. They are hungry, receptive, and not yet committed to a dispatcher."],
  ["✅", "Always verify before signing", " — active authority, valid insurance, acceptable safety record, and equipment verification. Never skip this step regardless of how promising a carrier seems."],
  ["🗂️", "Build systematically and refresh monthly", " — new carriers register every week. A monthly FMCSA refresh ensures your pipeline never goes stale."],
  ["📊", "The difference between beginners and experts", " is not access — everyone has the same FMCSA. It is how systematically and intelligently you extract and use this data."],
];

export default function Module9Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 9 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 9 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2331870185&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 9 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 9 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          FMCSA and <span style={{ color: RED }}>Safer Web</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          The most powerful free carrier database in the world — maintained by the US federal government. Hundreds of thousands of carrier records completely free and searchable.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80" alt="FMCSA Government Database Interface" />
          <p>Imagine having access to a database containing the name, phone number, email address, equipment type, insurance status, safety record, and operating history of every single trucking company and owner-operator legally operating in the United States. Hundreds of thousands of records. Completely free. Searchable by state, equipment type, authority status, and dozens of other filters.</p>
          <Success>✅ This database exists. It is maintained by the US federal government. It is called the FMCSA database — and it is the most powerful free tool available to any truck dispatcher anywhere in the world.</Success>
          <p>In this lecture we walk you through FMCSA and its companion tool Safer Web — from understanding what they are to navigating them professionally and building targeted carrier lists.</p>
        </Block>

        <Block icon="🏛️" title="What is the FMCSA?">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Federal Motor Carrier Safety Administration" />
          <p>The Federal Motor Carrier Safety Administration is a US government agency responsible for regulating commercial motor vehicles — trucks and buses — that operate in interstate commerce. Its mission is to reduce crashes, injuries, and fatalities involving large trucks and buses.</p>
          <p>To fulfill this mission the FMCSA maintains comprehensive records of every carrier that registers to operate commercially in the US. Registration is mandatory — no carrier can legally operate in interstate commerce without FMCSA registration.</p>
          <Highlight>💡 This mandatory registration requirement is what makes the FMCSA database so comprehensive and valuable for dispatchers. Every legitimate carrier is in this database.</Highlight>
          <p className="font-black mt-4 mb-2" style={{ color: NAVY }}>Every registered carrier has on file:</p>
          <ul className="pl-5 space-y-1.5 my-2">
            <li><strong>MC Number</strong> — their unique operating authority identifier</li>
            <li><strong>DOT Number</strong> — their safety identification number</li>
            <li><strong>Contact Information</strong> — business name, address, phone number</li>
            <li><strong>Equipment Type</strong> — what type of trucks they operate</li>
            <li><strong>Insurance Information</strong> — current coverage details</li>
            <li><strong>Safety Performance History</strong> — CSA scores and violations</li>
            <li><strong>Operating Authority Status</strong> — active, inactive, or revoked</li>
          </ul>
        </Block>

        {/* PORTALS */}
        <SectionTitle>🌐 Key FMCSA Portals for Dispatchers</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {PORTALS.map(([icon, name, url, desc]) => (
            <div key={name} className="bg-white rounded-xl p-5 shadow-sm transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${RED}` }}>
              <span className="text-3xl block mb-3">{icon}</span>
              <h3 className="text-sm font-black mb-1" style={{ color: NAVY }}>{name}</h3>
              <span className="text-[11px] font-bold block mb-2.5" style={{ color: RED }}>{url}</span>
              <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
            </div>
          ))}
        </div>

        {/* STEP BY STEP */}
        <Block icon="📋" title="Step-by-Step — Using FMCSA to Find Carriers">
          <SectionImg src="https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1000&q=80" alt="Step by Step FMCSA Guide" />
          <div className="flex flex-col gap-0 mt-4 rounded-xl overflow-hidden shadow-sm">
            {STEPS.map(([title, desc], i) => (
              <div key={i} className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${i !== STEPS.length - 1 ? "border-b-2" : ""}`} style={{ borderColor: "#f4f6fb" }}>
                <span className="text-sm font-black text-white flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: RED }}>{i + 1}</span>
                <div>
                  <h4 className="text-sm font-black mb-1.5" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* NEW CARRIERS */}
        <Block icon="🥇" title="Finding New Carriers — The Gold Mine">
          <SectionImg src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1000&q=80" alt="New Carrier Authority FMCSA" />
          <p>One of the most powerful filtering strategies in FMCSA is finding newly registered carriers. Carriers who have just received their operating authority are the warmest prospects you will ever find.</p>
          <Success>✅ New carriers are extremely hungry for loads, very receptive to dispatcher outreach, making important decisions about how to operate, and not yet locked into existing dispatcher relationships.</Success>
          <Highlight>🎯 How to Find New Carriers: In the FMCSA L&I system filter by authority grant date. Search for carriers who received authority within the last 30 to 90 days. These are your warmest leads — a carrier who just got their MC number 3 weeks ago and has been struggling to find quality loads consistently is the definition of a warm prospect.</Highlight>
        </Block>

        {/* COMPANY SNAPSHOT */}
        <Block icon="📊" title="Understanding the FMCSA Company Snapshot">
          <SectionImg src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1000&q=80" alt="FMCSA Company Snapshot Analysis" />
          <p>When you look up a carrier on Safer Web you get access to their company snapshot — a comprehensive profile that tells you everything you need to know before approaching them.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {SNAPSHOTS.map(([title, desc]) => (
              <div key={title} className="rounded-lg p-4 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `5px solid ${NAVY}` }}>
                <h4 className="text-[13px] font-black mb-1.5 uppercase tracking-wide" style={{ color: RED }}>{title}</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* VERIFICATION CHECKLIST */}
        <Block icon="✅" title="Carrier Verification Checklist — Before You Sign">
          <SectionImg src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&q=80" alt="Carrier Verification Checklist" />
          <p>Beyond finding new carriers Safer Web is essential for verifying carriers before you commit to working with them. Check all four of these before signing any dispatch service agreement:</p>
          <div className="flex flex-col gap-3 mt-4">
            {VERIFY.map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `5px solid ${GREEN}` }}>
                <span className="text-xl flex-shrink-0">✅</span>
                <div>
                  <h4 className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* BUILDING DATABASE */}
        <Block icon="🗂️" title="Building a FMCSA-Based Carrier Database">
          <SectionImg src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80" alt="Building Carrier Database Spreadsheet" />
          <p>Here is the complete systematic process for building a professional carrier database using FMCSA. Follow this every month to maintain a fresh pipeline.</p>
          <div className="flex flex-col gap-2.5 mt-4">
            {DB_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-3.5" style={{ background: "#f4f6fb" }}>
                <span className="text-[13px] font-black text-white flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: NAVY }}>{i + 1}</span>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0" dangerouslySetInnerHTML={{ __html: step.replace(/<strong>(.*?)<\/strong>/g, '<strong style="color:#0a2a6e">$1</strong>') }} />
              </div>
            ))}
          </div>
        </Block>

        {/* LIMITATIONS TABLE */}
        <Block icon="⚠️" title="FMCSA Data Limitations and How to Overcome Them">
          <SectionImg src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1000&q=80" alt="FMCSA Data Limitations Solutions" />
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: NAVY }}>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3.5">Limitation</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3.5">The Problem</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3.5">How to Overcome It</th>
                </tr>
              </thead>
              <tbody>
                {LIMITATIONS.map((row, i) => (
                  <tr key={row[0]} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="px-4 py-3 text-[13px] font-bold border-b border-slate-100 align-top" style={{ color: RED }}>{row[0]}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100 align-top">{row[1]}</td>
                    <td className="px-4 py-3 text-[13px] font-bold border-b border-slate-100 align-top" style={{ color: "#1a7a3a" }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 9</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 10 is next — Five Free Websites to Find Carriers. Expand your carrier acquisition toolkit beyond FMCSA with five powerful platforms your competitors do not know about.</p>
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
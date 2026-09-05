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

function DialerCard({ icon, name, tagline, headerClass, img, imgAlt, children }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-8" style={{ borderTop: `6px solid ${RED}` }}>
      <div className={`p-6 sm:p-7 flex items-center gap-4 ${headerClass}`}>
        <span className="text-4xl sm:text-5xl flex-shrink-0">{icon}</span>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-1">{name}</h3>
          <p className="text-xs sm:text-[13px] text-white/80 m-0">{tagline}</p>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <div className="rounded-xl overflow-hidden mb-5">
          <Image src={img} alt={imgAlt} fittingType="fill" className="w-full h-[200px]" />
        </div>
        {children}
      </div>
    </div>
  );
}

function FeatGrid({ features }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
      {features.map((f) => (
        <div key={f} className="rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2" style={{ background: "#f4f6fb", color: NAVY }}>
          <span style={{ color: GREEN }}>✅</span> {f}
        </div>
      ))}
    </div>
  );
}

function Pricing({ plans }) {
  return (
    <div className="rounded-xl p-4 my-4" style={{ background: "#f4f6fb" }}>
      <h4 className="text-[13px] font-black mb-2.5 uppercase tracking-wide" style={{ color: NAVY }}>💰 Pricing Plans</h4>
      {plans.map(([plan, cost]) => (
        <div key={plan} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "#e0e0e0" }}>
          <span className="text-[13px] text-slate-600">{plan}</span>
          <span className="text-[13px] font-black" style={{ color: RED }}>{cost}</span>
        </div>
      ))}
    </div>
  );
}

const COMPARISON = [
  ["Starting Price", "$15/month", "$18/month", "$20/month"],
  ["Power Dialer", "no", "yes", "addon"],
  ["Voicemail Drop", "no", "yes", "yes"],
  ["CRM Integration", "yes", "yes", "extensive"],
  ["Auto-Attendant", "no", "no", "yes"],
  ["Team Features", "Basic", "Moderate", "Advanced"],
  ["Setup Difficulty", "Very Easy", "Easy", "Moderate"],
  ["Call Quality", "Excellent", "Very Good", "Excellent"],
  ["Best For", "Beginners", "Growing", "Established Teams"],
];

const TIPS = [
  ["Use wired ethernet connection", "instead of WiFi wherever possible — eliminates wireless interference that causes choppy audio and dropped calls."],
  ["Close all unnecessary browser tabs and applications", " — video streaming and downloads consume bandwidth and directly degrade call quality during negotiations."],
  ["Use a quality headset", " — the microphone quality in a dedicated headset far exceeds laptop built-in microphones. Your audio quality is your professional image."],
  ["Quiet environment is essential", " — background noise from family members, traffic, or TV is very audible on VoIP calls and significantly reduces carrier and broker perception of your professionalism."],
  ["Test before important calls", " — each dialer has a test call feature. Use it regularly, especially after internet disruptions, to verify your audio quality before calling carriers."],
];

const SETUP_STEPS = [
  ["Create Account", "Go to openphone.com and create an account with your email address. Use your business email if you have one."],
  ["Select Your Plan", "Choose the Starter plan at $15/month — this is sufficient to begin dispatching professionally."],
  ["Enter Payment Details", "Use an international Visa or Mastercard — HBL, MCB, UBL cards with international payments enabled all work."],
  ["Choose Your US Number", "Select your US phone number and area code. Choose based on your target lanes — Texas (214/972) or Illinois (312/773) for Midwest corridor."],
  ["Download the App", "Download OpenPhone on your computer and smartphone. Log in on both devices so you never miss a callback."],
  ["Test Your Audio", "Use the in-app test call feature to verify your audio quality before calling any real carriers."],
  ["Record Voicemail Greeting", "Record a professional voicemail message: \"You have reached [Name] at [Company]. Please leave your name and number and I will call you back within one hour.\""],
  ["Import Carrier Contacts", "Import your first carrier prospect list using the contacts feature. You are now ready to start calling."],
];

const TAKEAWAYS = [
  ["📱", "A US phone number is non-negotiable", " — Pakistani numbers are not answered by American carriers. This is table stakes for professional dispatching."],
  ["🌱", "Start with OpenPhone", " — simplest setup, best for beginners making 30 to 80 calls per day. Up and running in 30 minutes for $15 per month."],
  ["⚡", "Graduate to CallHippo", " — when you are making 100+ calls per day the power dialer and voicemail drop features double your effective outreach rate."],
  ["🏢", "Move to RingCentral for teams", " — when you have 5+ carriers and are hiring junior dispatchers the team management and auto-attendant features are worth every dollar."],
  ["🔧", "Call quality is your professional image", " — wired internet, quiet environment, quality headset, and regular audio testing are essential regardless of which dialer you use."],
];

const OPENPHONE_FEATURES = [
  "US and Canadian phone numbers — any area code",
  "Calls, texts, and voicemail in one app",
  "Works on desktop, iOS, and Android",
  "Call recording capability",
  "Voicemail transcription — text version of voicemails",
  "Shared phone numbers for teams",
  "Contact management built in",
  "HubSpot and Slack integration",
  "Auto-reply for missed calls",
  "Business hours settings",
];

const CALLHIPPO_FEATURES = [
  "US and international phone numbers",
  "Power Dialer — auto dials list sequentially",
  "Predictive Dialer — dials multiple simultaneously",
  "Call recording and monitoring",
  "Real-time dashboard and statistics",
  "CRM integrations — HubSpot, Zoho, Pipedrive",
  "Voicemail Drop — one click prerecorded voicemail",
  "Call whisper — coach agents live",
  "Smart call routing",
  "Detailed analytics and reporting",
];

const RINGCENTRAL_FEATURES = [
  "US and international numbers",
  "Unlimited calling US and Canada",
  "HD voice quality — best on this list",
  "Video conferencing for client meetings",
  "Auto-attendant — professional call routing",
  "AI call transcription and analysis",
  "Call coaching and monitoring for teams",
  "Full CRM integration suite",
  "Fax capabilities — still used in US",
  "99.999% uptime guarantee",
];

export default function Module7Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 7 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 7 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330680661&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 7 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 7 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Three Recommended <span style={{ color: RED }}>Dialers</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          You cannot call American carriers from a Pakistani SIM professionally. You need a US phone number and a reliable VoIP dialer. Here are the three best options for Pakistani dispatchers.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1000&q=80" alt="VoIP Calling Setup for Dispatchers" />
          <p>In the previous lecture we established the importance of cold calling and gave you the scripts and frameworks to do it effectively. Now we need to address a practical question that every Pakistani dispatcher faces: How do you call American phone numbers professionally from Pakistan?</p>
          <Warning>⚠️ You Cannot Use a Pakistani SIM: Pakistani numbers are immediately suspicious to American carriers and brokers. Call quality and cost are also problematic. You need a US phone number.</Warning>
          <Highlight>💡 Solution — VoIP Dialers: Voice over Internet Protocol dialers allow you to make and receive calls over the internet using a US phone number — regardless of your physical location in Pakistan.</Highlight>
        </Block>

        <Block icon="🇺🇸" title="Why a US Phone Number Matters">
          <SectionImg src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1000&q=80" alt="US Phone Number Professional Credibility" />
          <p>When your carrier or broker sees an incoming call from a US number — they pick up. They do not know and do not need to know that you are in Pakistan. As far as they are concerned you are a professional dispatcher calling from your office.</p>
          <Warning>⚠️ Foreign Number Problem: When they see a +92 Pakistani number many will not answer. Those that do answer may immediately become skeptical about the professionalism of the operation.</Warning>
          <Success>✅ A US phone number establishes instant credibility. It is table stakes for professional dispatching from Pakistan. Non-negotiable.</Success>
        </Block>

        {/* DIALER 1 — OpenPhone */}
        <DialerCard
          icon="📱"
          name="OpenPhone"
          tagline="Best for Beginners — Setup in 30 Minutes — $15/month"
          headerClass="bg-gradient-to-br from-indigo-600 to-violet-700"
          img="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80"
          imgAlt="OpenPhone VoIP App Interface">
          <p>OpenPhone is a modern cloud-based business phone system designed specifically for small businesses and startups. It is extremely popular among Pakistani dispatchers and remote workers because of its straightforward setup process, clean interface, and reasonable pricing.</p>
          <p className="font-black mb-2" style={{ color: NAVY }}>Key Features:</p>
          <FeatGrid features={OPENPHONE_FEATURES} />
          <Pricing plans={[
            ["Starter — 1 number, unlimited US/Canada calls", "$15/user/month"],
            ["Business — call recording and analytics", "$23/user/month"],
            ["Scale — advanced team features", "$35/user/month"],
          ]} />
          <p>The voicemail transcription feature is particularly useful — you can quickly read all voicemails without listening to each one, saving significant time when managing high call volumes.</p>
          <Highlight>🎯 Area Code Tip: Choose an area code from a US state you plan to work heavily. Illinois (312/773) or Texas (214/972) for Midwest-Southeast corridor. Local area codes slightly improve answer rates.</Highlight>
          <Warning>⚠️ Limitation: OpenPhone does not have auto-dialing or power dialer features. You dial each number individually. Perfect for 30–80 calls per day. For 150+ calls you will eventually need CallHippo.</Warning>
          <span className="inline-block text-xs font-black text-white px-4 py-1.5 rounded-full mt-2" style={{ background: NAVY }}>✅ Best For: New Dispatchers — 0 to 80 calls per day</span>
        </DialerCard>

        {/* DIALER 2 — CallHippo */}
        <DialerCard
          icon="⚡"
          name="CallHippo"
          tagline="Best for Growing Dispatchers — Power Dialer — $18/month"
          headerClass="bg-gradient-to-br from-[#0a2a6e] to-blue-800"
          img="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80"
          imgAlt="CallHippo Power Dialer Dashboard">
          <p>CallHippo is a more feature-rich VoIP solution designed for sales teams and businesses that make high volumes of outbound calls. It bridges the gap between a basic business phone system and a full sales dialer — perfect for dispatchers scaling their carrier acquisition.</p>
          <p className="font-black mb-2" style={{ color: NAVY }}>Key Features:</p>
          <FeatGrid features={CALLHIPPO_FEATURES} />
          <Pricing plans={[
            ["Basic — standard calling features", "$18/user/month"],
            ["Bronze — includes power dialer", "$30/user/month"],
            ["Silver — includes predictive dialer", "$42/user/month"],
            ["Platinum — full feature set", "$48/user/month"],
          ]} />
          <Success>✅ Game Changer — Voicemail Drop: Record your voicemail script once professionally. When a call goes to voicemail — click one button and your prerecorded message plays automatically. You have moved to the next call before the voicemail finishes. This feature alone can double your effective outreach rate.</Success>
          <Highlight>📊 Power Dialer Math: Manual dialing — 50 calls per session. With CallHippo power dialer — 100 to 150 calls in the same time. Not because you talk faster — because dead time between calls is automated away.</Highlight>
          <span className="inline-block text-xs font-black text-white px-4 py-1.5 rounded-full mt-2" style={{ background: NAVY }}>✅ Best For: Growing Dispatchers — 80 to 150+ calls per day</span>
        </DialerCard>

        {/* DIALER 3 — RingCentral */}
        <DialerCard
          icon="🏢"
          name="RingCentral"
          tagline="Best for Established Teams — Enterprise Grade — $20/month"
          headerClass="bg-gradient-to-br from-[#cc0000] to-red-800"
          img="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
          imgAlt="RingCentral Professional Office Setup">
          <p>RingCentral is the most comprehensive and professional business communications platform on this list. It is a complete unified communications solution used by major American companies — meaning brokers and carriers are very familiar with the call quality and professionalism it delivers.</p>
          <p className="font-black mb-2" style={{ color: NAVY }}>Key Features:</p>
          <FeatGrid features={RINGCENTRAL_FEATURES} />
          <Pricing plans={[
            ["Core — essential business communications", "$20/user/month"],
            ["Advanced — analytics and integrations", "$25/user/month"],
            ["Ultra — full enterprise feature set", "$35/user/month"],
          ]} />
          <Highlight>🏆 Auto-Attendant Power: "Thank you for calling Tycoon Dispatch Academy Dispatch — please hold while we connect you to a dispatcher." This single feature adds enormous professional credibility when brokers and carriers call your company number.</Highlight>
          <Warning>⚠️ Not for Beginners: RingCentral is overkill for a solo dispatcher starting out. Use OpenPhone or CallHippo first. Migrate to RingCentral when you have 5+ carriers and are building a team.</Warning>
          <span className="inline-block text-xs font-black text-white px-4 py-1.5 rounded-full mt-2" style={{ background: NAVY }}>✅ Best For: Established Operations — 5+ Carriers — Building a Team</span>
        </DialerCard>

        {/* COMPARISON TABLE */}
        <Block icon="📊" title="Complete Comparison — All Three Dialers">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Dialer Comparison Analysis" />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: NAVY }}>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3">Feature</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3">OpenPhone</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3">CallHippo</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 py-3">RingCentral</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row[0]} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="px-4 py-3 text-[13px] font-bold border-b border-slate-100" style={{ color: NAVY }}>{row[0]}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">{row[1]}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">{row[2]}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 border-b border-slate-100">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>

        {/* TECHNICAL TIPS */}
        <Block icon="🔧" title="Technical Tips for Best Call Quality">
          <SectionImg src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80" alt="Call Quality Setup Tips" />
          <p>Regardless of which dialer you choose, call quality depends heavily on your internet connection and environment. Follow these tips for maximum professional quality:</p>
          <div className="flex flex-col gap-3 mt-4">
            {TIPS.map(([bold, rest], i) => (
              <div key={i} className="rounded-lg p-4 flex items-start gap-3 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `5px solid ${NAVY}` }}>
                <span className="text-xs font-black text-white flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: RED }}>{i + 1}</span>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0"><strong>{bold}</strong>{rest}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* SETUP STEPS */}
        <Block icon="🚀" title="OpenPhone Setup — Step by Step Guide">
          <SectionImg src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80" alt="OpenPhone Setup Walkthrough" />
          <p>Since we recommend OpenPhone for beginners, here is your complete setup walkthrough. Total time: 30 to 60 minutes.</p>
          <div className="flex flex-col gap-0 mt-4 rounded-xl overflow-hidden shadow-sm">
            {SETUP_STEPS.map(([title, desc], i) => (
              <div key={i} className={`flex items-start gap-4 p-5 transition-colors hover:bg-slate-50 ${i !== SETUP_STEPS.length - 1 ? "border-b-2" : ""}`} style={{ borderColor: "#f4f6fb" }}>
                <span className="text-sm font-black text-white flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: NAVY }}>{i + 1}</span>
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
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 7</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 8 is next — Finding Carriers Through Emails. A scalable systematic outreach method that perfectly complements your cold calling.</p>
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
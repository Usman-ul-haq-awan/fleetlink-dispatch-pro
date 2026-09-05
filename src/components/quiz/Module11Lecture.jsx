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

function PlatformCard({ icon, name, subtitle, headerClass, img, imgAlt, children }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-8">
      <div className={`p-5 sm:p-6 flex items-center gap-4 ${headerClass}`}>
        <span className="text-4xl flex-shrink-0">{icon}</span>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-1">{name}</h3>
          <p className="text-[13px] text-white/80 m-0">{subtitle}</p>
        </div>
      </div>
      <div className="p-6 sm:p-7" style={{ borderTop: `4px solid ${RED}` }}>
        <div className="rounded-xl overflow-hidden mb-5">
          <Image src={img} alt={imgAlt} fittingType="fill" className="w-full h-[200px]" />
        </div>
        {children}
      </div>
    </div>
  );
}

function MsgBox({ label, children }) {
  return (
    <div className="rounded-lg p-5 my-4" style={{ background: NAVY }}>
      <h4 className="text-[13px] font-black mb-2.5 uppercase tracking-wide" style={{ color: RED }}>{label}</h4>
      <p className="text-[13px] text-white leading-relaxed italic m-0">{children}</p>
    </div>
  );
}

function ContentIdea({ icon, title, desc }) {
  return (
    <div className="rounded-lg p-4 transition-transform hover:translate-x-1" style={{ background: "#f4f6fb", borderLeft: `4px solid ${RED}` }}>
      <span className="text-2xl block mb-2">{icon}</span>
      <h4 className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{title}</h4>
      <p className="text-xs text-slate-600 leading-relaxed m-0">{desc}</p>
    </div>
  );
}

const FB_GROUPS = [
  "Owner Operators Trucking", "Truck Drivers USA", "Flatbed Truckers", "Reefer Truckers",
  "OTR Truckers", "Trucking Business", "Hot Shot Trucking", "New Trucking Authority",
  "Truck Dispatcher Needed", "Find a Dispatcher",
];

const FB_DO = [
  "Answer questions about freight rates and lanes",
  "Share useful market information weekly",
  "Congratulate carriers on milestones",
  "Comment genuinely on posts",
  "Engage for 1 to 2 weeks before any outreach",
  "Post educational content naturally",
];

const FB_DONT = [
  "Join and immediately pitch services",
  "Post \"I am a dispatcher — contact me\"",
  "Spam the group with promotional posts",
  "Message carriers before establishing presence",
  "Make every comment about your services",
];

const IG_IDEAS = [
  ["📊", "Rate Market Updates", "Weekly rate updates for specific lanes — valuable data carriers actually need."],
  ["📋", "Infographic Carousels", "\"5 ways a dispatcher saves you money\" — shareable educational content."],
  ["🎬", "Educational Reels", "\"What happens when your truck goes to inspection — here is what a dispatcher does.\""],
  ["❓", "Q&A Content", "Answer common carrier questions about dispatching fees, lane selection, and broker negotiations."],
];

const TIKTOK_IDEAS = [
  ["🚛", "Signs You Need a Dispatcher", "Direct appeal to carriers — high engagement and inbound inquiry driver."],
  ["💰", "How Dispatchers Negotiate", "Inside look at rate negotiation — builds trust and demonstrates value."],
  ["📉", "What is Deadhead", "\"Why deadhead is killing your profit\" — highly relatable to owner-operators."],
  ["🆕", "New Authority First 90 Days", "Guide for new carriers — exactly when they need a dispatcher most."],
];

const TAKEAWAYS = [
  ["📘", "Facebook groups are your primary platform", " — join 20 to 30 trucking groups, engage authentically for 1 to 2 weeks before any direct outreach, then message carriers with relevant targeted messages."],
  ["💼", "LinkedIn reaches business-minded fleet owners", " — connect first, ask questions second, offer services third. Never pitch on the first message."],
  ["🎬", "TikTok creates inbound leads", " — one viral video can generate dozens of carrier inquiries. Create content that speaks directly to carrier pain points and they will find you."],
  ["💬", "WhatsApp is your cultural advantage", " — Pakistani and South Asian diaspora truckers respond more naturally to Pakistani dispatchers. Use this connection strategically."],
  ["📊", "Track every social media lead", " — your CRM data over time shows which platforms generate the best carriers for your specific lanes and equipment focus."],
];

export default function Module11Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 11 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 11 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2332194335&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 11 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 11 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Finding Carriers Through <span style={{ color: RED }}>Social Media</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          The trucking community has a massive online presence on Facebook, LinkedIn, Instagram, and TikTok. Most dispatchers completely ignore it — which means the opportunity is wide open for you.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1000&q=80" alt="Social Media Carrier Acquisition Strategy" />
          <p>Ten years ago social media was irrelevant to truck dispatching. Today it is a significant and growing channel for carrier acquisition — and one that most dispatchers either ignore completely or use ineffectively.</p>
          <Highlight>💡 The Opportunity: The trucking community has a massive online presence. Facebook groups for truckers, LinkedIn profiles of owner-operators, YouTube channels of truck drivers, and TikTok accounts of fleet owners are all active, accessible, and full of potential carrier clients.</Highlight>
          <p>The key is knowing where to look and how to engage professionally. This lecture covers exactly that — platform by platform.</p>
        </Block>

        <Block icon="🎯" title="Why Social Media Works for Carrier Acquisition">
          <SectionImg src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1000&q=80" alt="Social Media Warm Outreach" />
          <p>Traditional outreach — cold calling and email — reaches carriers through their professional contact information. Social media reaches them in their personal digital space where they are more relaxed, more communicative, and more receptive to relationship-building.</p>
          <Success>✅ Warm Outreach Advantage: When you engage authentically in a trucking community on Facebook before ever pitching, carriers may already know your name by the time you reach out directly. This is warm outreach — far more effective than cold contact.</Success>
          <Highlight>💡 Inbound Leads: Social media allows carriers to find YOU. When you establish a professional presence as a dispatcher on relevant platforms carriers who are actively looking for dispatching support will discover and contact you. Inbound leads are the highest quality leads because the carrier has already decided they want dispatching help.</Highlight>
        </Block>

        {/* FACEBOOK */}
        <PlatformCard
          icon="📘" name="Facebook" subtitle="Primary Platform — Most Active Trucking Community Online"
          headerClass="bg-gradient-to-br from-[#1877f2] to-[#0d5dbf]"
          img="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=800&q=80" imgAlt="Facebook Groups Trucking Community">
          <p>Facebook remains the most active social platform for the trucking community. There are thousands of Facebook groups dedicated to truck drivers, owner-operators, and the trucking business.</p>
          <p className="font-black mb-2.5" style={{ color: NAVY }}>Search Facebook Groups Using These Terms:</p>
          <div className="flex flex-wrap gap-2 my-3">
            {FB_GROUPS.map((g) => (
              <span key={g} className="text-xs font-bold px-3.5 py-1.5 rounded-full" style={{ background: "#f4f6fb", color: NAVY, border: `1px solid ${NAVY}` }}>{g}</span>
            ))}
          </div>
          <p>Join 20 to 30 relevant groups. Focus on groups where owner-operators and small fleet owners — not just drivers — are active participants.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            <div className="rounded-lg p-4" style={{ background: "#f0fff4", border: `2px solid ${GREEN}` }}>
              <h4 className="text-sm font-black mb-3" style={{ color: "#1a7a3a" }}>✅ DO This in Groups</h4>
              <ul className="pl-4 space-y-1.5">
                {FB_DO.map((d) => <li key={d} className="text-[13px] text-slate-600 leading-relaxed">{d}</li>)}
              </ul>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#fff3f3", border: `2px solid ${RED}` }}>
              <h4 className="text-sm font-black mb-3" style={{ color: RED }}>❌ NEVER Do This</h4>
              <ul className="pl-4 space-y-1.5">
                {FB_DONT.map((d) => <li key={d} className="text-[13px] text-slate-600 leading-relaxed">{d}</li>)}
              </ul>
            </div>
          </div>
          <MsgBox label="📝 Sample Expert Post That Builds Credibility">
            "I have been dispatching dry van carriers for several years and one thing I wish more owner-operators knew is the importance of tracking detention time from the moment arrival is logged. Most carriers leave significant detention revenue uncollected because the documentation is not in order. Happy to share the specific process we use — anyone interested?"
          </MsgBox>
          <MsgBox label="📩 Sample Direct Message Script">
            "Hi [Name], I saw your post about struggling to find quality backhaul loads out of [State]. I am a truck dispatcher specializing in that corridor and I think I could help. Would you be open to a quick 10-minute conversation to see if it would be a good fit? No commitment — just a conversation."
          </MsgBox>
        </PlatformCard>

        {/* LINKEDIN */}
        <PlatformCard
          icon="💼" name="LinkedIn" subtitle="Professional Outreach — Small Fleet Owners and Business-Minded Carriers"
          headerClass="bg-gradient-to-br from-[#0a66c2] to-[#084e94]"
          img="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" imgAlt="LinkedIn Professional Carrier Outreach">
          <p>LinkedIn is underutilized by dispatchers but is one of the most effective platforms for professional carrier acquisition — especially for small fleet owners who view their trucking operation as a business.</p>
          <p className="font-black mb-2.5" style={{ color: NAVY }}>LinkedIn Search Strategies:</p>
          <ul className="pl-5 space-y-1.5 my-2">
            <li><strong>Search by title:</strong> "Owner Operator Trucking", "Fleet Owner", "Trucking Company Owner", "Motor Carrier Owner"</li>
            <li><strong>Search by industry:</strong> Select "Transportation, Logistics, Supply Chain and Storage" — filter by company size 1 to 10 employees</li>
            <li><strong>Search by location:</strong> Filter results by US states to target geographic areas relevant to your service</li>
          </ul>
          <MsgBox label="📩 Connection Request Message">
            "Hi [Name], I am a truck dispatcher specializing in [equipment type] carriers across [regions]. I noticed your profile and wanted to connect — I enjoy building relationships with owner-operators in the industry. Would love to connect."
          </MsgBox>
          <MsgBox label="📩 Follow-Up After They Connect">
            "Thank you for connecting! I always like learning from owner-operators about what is working well and what challenges they face. How long have you been running your own authority, and what lanes do you primarily work?"
          </MsgBox>
          <Highlight>💡 Networking First: Let the conversation develop naturally before offering your services. Ask questions, listen, understand their situation — then present your solution when the timing is right.</Highlight>
        </PlatformCard>

        {/* INSTAGRAM & TIKTOK */}
        <PlatformCard
          icon="📸" name="Instagram and TikTok" subtitle="Content Strategy — Build Authority and Attract Inbound Carrier Leads"
          headerClass="bg-gradient-to-br from-[#e1306c] to-[#833ab4]"
          img="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80" imgAlt="Instagram TikTok Content Strategy Dispatching">
          <p>Instagram and TikTok require a different approach — content creation. You build an audience by creating educational, entertaining, or informative content about trucking and dispatching. Over time carriers who watch your content reach out to you directly.</p>
          <p className="font-black mt-4 mb-3" style={{ color: NAVY }}>Instagram Content Ideas:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {IG_IDEAS.map(([icon, title, desc]) => <ContentIdea key={title} icon={icon} title={title} desc={desc} />)}
          </div>
          <p className="font-black mt-5 mb-3" style={{ color: NAVY }}>TikTok Video Ideas — These Can Go Viral:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TIKTOK_IDEAS.map(([icon, title, desc]) => <ContentIdea key={title} icon={icon} title={title} desc={desc} />)}
          </div>
          <Success>✅ TikTok Algorithm Power: A well-made video about trucking rates or dispatcher value can reach tens of thousands of truck drivers organically — without any existing following. One viral video can generate dozens of inbound carrier inquiries.</Success>
        </PlatformCard>

        {/* WHATSAPP */}
        <PlatformCard
          icon="💬" name="WhatsApp Groups" subtitle="Community Building — Pakistani and South Asian Diaspora Trucking Networks"
          headerClass="bg-gradient-to-br from-[#25d366] to-[#128c7e]"
          img="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=800&q=80" imgAlt="WhatsApp Trucking Groups">
          <p>Many trucking communities especially those with Pakistani or South Asian diaspora drivers in the US communicate heavily through WhatsApp groups. These are active spaces where drivers and carriers discuss loads, rates, and the industry.</p>
          <Highlight>💡 How to Find WhatsApp Groups: Discover them through Facebook groups and LinkedIn connections. When you engage authentically in Facebook trucking groups members will often share WhatsApp community links. Ask directly — "Is there a WhatsApp group for this community?"</Highlight>
          <Success>✅ Cultural Advantage: As a Pakistani dispatcher you have a natural cultural connection with Pakistani and South Asian truck drivers and owner-operators in the US. This shared cultural background makes relationship-building faster and more natural — use this advantage.</Success>
        </PlatformCard>

        {/* TRACKING */}
        <Block icon="📊" title="Tracking Social Media Outreach">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Social Media Outreach Tracking CRM" />
          <p>Social media outreach must be tracked like any other prospecting activity. In your CRM create a source field and mark every carrier contact with how you found them.</p>
          <ul className="pl-5 space-y-1.5 my-2">
            <li>Facebook Group — [Group Name]</li>
            <li>LinkedIn Connection</li>
            <li>TikTok DM</li>
            <li>Instagram DM</li>
            <li>WhatsApp Group — [Group Name]</li>
          </ul>
          <Highlight>📈 Over time this data tells you which platforms generate the best carrier leads for your specific operation — allowing you to invest more time where results are strongest and less time where they are weakest.</Highlight>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 11</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 12 is next — How to Find Loads Through Various Load Boards. The other critical skill of a professional dispatcher — securing the best freight for your carriers.</p>
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
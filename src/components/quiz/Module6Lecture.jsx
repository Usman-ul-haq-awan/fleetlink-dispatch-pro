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

function ScriptBox({ title, children, note }) {
  return (
    <div className="rounded-xl p-6 sm:p-7 my-4" style={{ background: NAVY }}>
      <h3 className="text-base sm:text-lg font-black mb-3" style={{ color: RED }}>{title}</h3>
      <div className="rounded-r-lg px-5 py-5 text-sm text-white leading-relaxed italic" style={{ background: "rgba(255,255,255,0.08)", borderLeft: `4px solid ${RED}` }}>
        {children}
      </div>
      {note && <p className="text-[13px] text-slate-300 mt-3 leading-relaxed">{note}</p>}
    </div>
  );
}

const SETUP = [
  ["🖥️", "Clean Desk", "Remove all clutter. Only your computer, headset, water, and script on your desk."],
  ["📋", "CRM Open", "Ready for note-taking after every call. Log immediately — not later."],
  ["📄", "Script Visible", "Printed or displayed on screen. Do not try to memorize — read naturally at first."],
  ["🎧", "Headset Ready", "Test audio before starting. Bad audio quality = unprofessional first impression."],
  ["🚫", "No Distractions", "Close all unnecessary browser tabs. Put phone on silent. Tell family you are working."],
];

const TIMES = [
  ["8:00 PM – 11:30 PM PKT", "8:00 AM – 11:30 AM US Central Time — Morning peak hours. Carriers are fresh and receptive. Best for first contact calls."],
  ["2:00 AM – 5:30 AM PKT", "1:00 PM – 4:30 PM US Central Time — Afternoon hours. Good for follow-up calls and catching carriers after lunch."],
];

const OBJECTIONS = [
  ['❓ "Your fee is too high."', '"I understand that concern. But let me put it in perspective — if I get you $2.50 per mile on a lane where you were getting $2.10, that extra $0.40 per mile on a 2,000 mile week is $800 more in your pocket. My 8% fee on $3,000 is $240. You net $560 more than before, plus you save all the time you spent finding loads yourself. Does that math make sense?"'],
  ['❓ "I have been burned by dispatchers before."', '"I hear that a lot and I completely understand. There are a lot of bad dispatchers out there. What I can offer you is a trial period — let us work together for two weeks. No long-term commitment. If I do not deliver better loads at better rates than you were getting, you walk away with nothing lost. Would that be fair?"'],
  ['❓ "I only run a specific lane."', '"That is exactly the kind of information I need. Tell me more about your lane — where exactly are you picking up and where are you delivering? ... Yes, I regularly find loads on that corridor. In fact I can share current rate data on that lane right now if you have a moment."'],
  ['❓ "Your English is hard to understand."', '"I apologize for any difficulty — let me speak more slowly. I work with several American carriers and I can assure you that once we establish our working relationship, communication becomes very smooth. Would you be willing to give me just a few more minutes?"'],
];

const VOLUME = [
  ["Beginner", "First 2 weeks", "30–50 calls/day"],
  ["Developing", "Weeks 3–6", "50–80 calls/day"],
  ["Experienced", "Month 2 onwards", "80–150 calls/day"],
];

const EXERCISES = [
  ["Script Rehearsal", "Record yourself delivering the opening script 10 times. Listen back. Identify where you sound hesitant or unnatural. Practice until it sounds confident and conversational."],
  ["Mirror Practice", "Stand in front of a mirror and practice your script while maintaining eye contact with yourself. Builds physical confidence that translates into vocal confidence."],
  ["Graduated Exposure", "Day 1: 10 calls. Day 2: 20 calls. By end of week 1: 50+ calls per day. The initial anxiety substantially reduces by day 5. Consistency is everything."],
  ["Role Play", "Practice with a fellow student or family member playing the role of a carrier. Have them respond with various objections and practice your responses until they feel natural."],
];

const TAKEAWAYS = [
  ["📞", "Cold calling is the fastest method", " — a qualified conversation within the first hour of dialing. No other method comes close for speed of carrier acquisition."],
  ["🚛", "Trucking is phone-first", " — cold calls are not intrusive in this industry. Carriers answer their phones because calls mean loads which mean money."],
  ["📋", "Build your list first", " — 200 to 500 prospects from FMCSA before your first call. A strong list prevents momentum loss from running out of numbers."],
  ["🗣️", "Scripts remove fear", " — you do not need to improvise. Master the scripts provided and every scenario has a proven professional response ready."],
  ["📊", "Volume is everything", " — start at 30 to 50 calls per day and build to 80 to 150. Every rejection is one call closer to a signed carrier generating ongoing income."],
  ["📝", "Log every call immediately", " — your CRM database is a business asset. Most carriers sign after multiple contacts — your database captures these future opportunities."],
];

export default function Module6Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 6 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 6 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330669267&color=%23cc0000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true" />
          <p className="text-xs text-slate-300 mt-2.5">📖 Read along with the lecture content below while listening. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch.</p>
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 6 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 6 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Finding Carriers by <span style={{ color: RED }}>Cold Calling</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          The fastest method for building your carrier portfolio. Uncomfortable at first — but completely learnable, highly effective, and directly tied to your income as a dispatcher.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <SectionImg src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1000&q=80" alt="Dispatcher Making Cold Calls" />
          <p>Cold calling is the method that makes most new dispatchers nervous. The idea of calling a stranger in America, speaking in English, and trying to convince them to work with you feels daunting. We understand this completely.</p>
          <p>But we also know, from years of operating in this industry, that cold calling is the single most effective and fastest method for building a carrier portfolio.</p>
          <Warning>⚠️ The Reality: Email gets maybe 2–5% response rate. Social media takes time to build. Cold calling can generate a qualified conversation within the first hour of dialing.</Warning>
          <Success>✅ The Truth: The discomfort is real but temporary. The skills are completely learnable. The results are real and directly tied to the number of calls you make.</Success>
        </Block>

        <Block icon="📞" title="Why Cold Calling Works in Trucking">
          <SectionImg src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1000&q=80" alt="Phone Call in Trucking Industry" />
          <p>The trucking industry runs on phone calls. Unlike many modern industries that have shifted heavily to digital communication, trucking remains a phone-first business. Brokers call carriers. Carriers call shippers. Dispatchers call everyone.</p>
          <Highlight>💡 Key Insight: When your phone rings in trucking it gets answered — because a phone call could mean a load, which means money. Cold calls are not seen as intrusive in trucking the way they are in other industries.</Highlight>
          <p>Additionally many owner-operators and small fleet owners are on the road all day with limited time for emails or social media. The phone is how they do business. Reaching them by phone is reaching them where they live professionally.</p>
        </Block>

        <Block icon="📋" title="Building Your Cold Calling List">
          <SectionImg src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80" alt="Building Carrier Database" />
          <p>Before you make a single call you need a list. Your cold calling list should come from these sources:</p>
          <ul className="pl-5 space-y-2 my-2">
            <li><strong style={{ color: NAVY }}>FMCSA Database (Free):</strong> The FMCSA Licensing and Insurance portal allows you to search carriers by state, equipment type, and authority status. Filter for active authority, specific states, and recently issued authority — new carriers are especially receptive.</li>
            <li><strong style={{ color: NAVY }}>Carrier411.com:</strong> Provides carrier contact information with filtering capabilities. Good supplementary source to FMCSA.</li>
            <li><strong style={{ color: NAVY }}>Load Boards:</strong> Some load boards allow you to see carrier postings — trucks looking for loads. These carriers are actively seeking loads making them warm leads not cold prospects.</li>
          </ul>
          <Highlight>🎯 Target: Build an initial list of 200–500 carriers before you start calling. This gives you a solid pipeline and prevents the psychological problem of running out of numbers to call.</Highlight>
        </Block>

        <Block icon="🖥️" title="Setting Up Your Calling Environment">
          <SectionImg src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&q=80" alt="Professional Calling Setup Desk" />
          <p className="font-black mb-3" style={{ color: NAVY }}>Physical Setup — Your Workspace:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SETUP.map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-lg p-4 flex items-start gap-3 shadow-sm transition-transform hover:translate-x-1" style={{ borderLeft: `4px solid ${NAVY}` }}>
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <h4 className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-black mt-6 mb-3" style={{ color: NAVY }}>Best Hours to Call — Pakistan Time:</p>
          <div className="flex flex-col gap-3">
            {TIMES.map(([time, desc]) => (
              <div key={time} className="rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5" style={{ background: "#f4f6fb", borderLeft: `5px solid ${RED}` }}>
                <span className="text-[13px] font-black flex-shrink-0 sm:min-w-[220px]" style={{ color: RED }}>{time}</span>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
          <Warning>⚠️ Avoid: 12:00 PM – 1:00 PM US local time — lunch hour. Carriers are less available and less receptive during this window.</Warning>

          <p className="font-black mt-5 mb-2" style={{ color: NAVY }}>Mindset Before You Dial:</p>
          <Success>✅ Accept This Now: Most calls will result in no, not interested, or voicemail. This is completely normal. In cold calling a 5–10% positive engagement rate is excellent. If you make 100 calls and 8 carriers express genuine interest — that is a great day. Each carrier you sign generates ongoing commission income forever.</Success>
        </Block>

        <Block icon="🗣️" title="The Cold Calling Scripts — Complete Framework">
          <SectionImg src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1000&q=80" alt="Cold Calling Script Dispatcher" />
          <p>Master these scripts before improvising. Every scenario has a proven response — use them exactly as written until they feel natural, then adapt them to your style.</p>

          <ScriptBox title={'📞 Opening Script — Decision Maker Answers'} note="Then pause and listen — let them respond. Never rush past the pause. The silence is where the conversation begins.">
            "Hi, is this [Carrier Name or owner's name if known]? ... Great, my name is [Your Name], I am calling from [Your Dispatch Company]. I help [dry van / reefer / flatbed] owner-operators find consistent, high-paying loads across [specific lanes or general USA]. I wanted to reach out and see if you are currently working with a dispatcher or if you are handling your own loads right now?"
          </ScriptBox>

          <ScriptBox title={'📞 If They Say: "I Handle My Own Loads"'} note="Pause again. This question plants a seed of doubt about their current approach without attacking them for it.">
            "Understood, and I respect that — a lot of owner-operators prefer to do that when they are starting out. Can I ask — are you finding it difficult to keep your truck loaded while you are also driving? Because that is the challenge most owner-operators face — they are great drivers but the load-finding and broker negotiation takes time away from what they do best, which is driving."
          </ScriptBox>

          <ScriptBox title={'📞 If They Say: "I Work With a Dispatcher Already"'} note="This response respects their current relationship while opening the door to comparison. Five minutes feels low-commitment and achievable.">
            "That is great to hear — it sounds like you understand the value of having dispatching support. Can I ask — are you satisfied with your current setup? Are you getting the rates and lane consistency you want? ... I ask because we specialize in [specific equipment/lane] and we consistently get our carriers above-market rates. Would you be open to a quick conversation just to compare? If what you have is working perfectly, great — but if there is room to improve, it would be worth 5 minutes."
          </ScriptBox>

          <ScriptBox title={'📞 If They Say: "I Am Not Interested"'} note="Never argue with a no. Instead gather information about why — this market research makes your future calls stronger and more targeted.">
            "Absolutely, I completely understand. Could I just leave you my information in case your situation changes? And can I ask — is there anything specific that makes dispatching support not a fit for you right now? I am always looking to understand what owner-operators need."
          </ScriptBox>

          <ScriptBox title={'📞 Leaving an Effective Voicemail'} note="Keep voicemails under 30 seconds. Be clear, confident, and specific. A specific mention of their equipment type or lane shows you did your research.">
            "Hi [Name], this is [Your Name] calling from [Company]. I specialize in dispatching [equipment type] carriers on [general lanes] and I consistently get my carriers above-market rates. I wanted to connect and see if there might be an opportunity to work together. My number is [number] — I am available [time range US time]. No pressure — just a quick conversation. Hope to hear from you."
          </ScriptBox>
        </Block>

        {/* OBJECTIONS */}
        <SectionTitle>💪 Handling Common Objections</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {OBJECTIONS.map(([q, a]) => (
            <div key={q} className="bg-white rounded-xl p-5 shadow-md transition-transform hover:-translate-y-1" style={{ borderTop: `4px solid ${RED}` }}>
              <div className="text-[13px] font-black mb-2.5 px-3 py-2 rounded-md" style={{ color: RED, background: "#fff3f3" }}>{q}</div>
              <p className="text-[13px] text-slate-600 leading-relaxed m-0">{a}</p>
            </div>
          ))}
        </div>

        {/* VOLUME */}
        <Block icon="📊" title="Call Volume and Tracking">
          <SectionImg src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80" alt="Call Tracking CRM Dashboard" />
          <p>Consistent call volume is the engine of carrier acquisition. Here are your daily targets at each stage:</p>
          <div className="overflow-hidden rounded-lg mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: NAVY }}>
                  <th className="text-left text-[13px] font-bold text-white px-4 sm:px-5 py-3.5">Stage</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 sm:px-5 py-3.5">Timeline</th>
                  <th className="text-left text-[13px] font-bold text-white px-4 sm:px-5 py-3.5">Daily Call Target</th>
                </tr>
              </thead>
              <tbody>
                {VOLUME.map((row, i) => (
                  <tr key={row[0]} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="px-4 sm:px-5 py-3 text-[13px] text-slate-600 border-b border-slate-100">{row[0]}</td>
                    <td className="px-4 sm:px-5 py-3 text-[13px] text-slate-600 border-b border-slate-100">{row[1]}</td>
                    <td className="px-4 sm:px-5 py-3 text-[13px] font-black border-b border-slate-100" style={{ color: RED }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Highlight>📋 After Every Call Log Immediately: Date and time — Carrier name and contact — Outcome — Notes on equipment, lanes, concerns — Follow-up action and date. Most carriers do not commit on the first call — your database is how you capture these future opportunities.</Highlight>
        </Block>

        {/* EXERCISES */}
        <Block icon="🏋️" title="Overcoming Cold Calling Fear — Practice Exercises">
          <SectionImg src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80" alt="Practicing Cold Calling Skills" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXERCISES.map(([title, desc], i) => (
              <div key={title} className="rounded-xl p-5 transition-transform hover:-translate-y-1" style={{ background: "#f4f6fb", borderBottom: `4px solid ${NAVY}` }}>
                <span className="inline-block text-[11px] font-black text-white px-3 py-1 rounded-full mb-2.5" style={{ background: RED }}>Exercise {String(i + 1).padStart(2, "0")}</span>
                <h4 className="text-sm font-black mb-2" style={{ color: NAVY }}>{title}</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 6</h2>
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
          <p className="text-sm text-red-200 mb-4">Module 7 is next — Three Recommended Dialers. The tools that make your cold calling faster, more professional, and more productive.</p>
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
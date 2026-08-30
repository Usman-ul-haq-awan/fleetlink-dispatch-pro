import React, { useState, useEffect, useRef } from "react";

const SLIDES = [
  {
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEgKK4jegJ-YZ7001HTavMYo1n3-ajDQhJSot2B52C_1DNBV8LFSdTnEDDkZlqAOq5Y_zeo2mUtpYLp_uQTCEEfQlg24TSQfccmqCM8wsz98oPN0iJcmksi1uBSCbYXNYDbf_WdG4P0SHFGorBKj2VateYSDd56ajfSnHnca0dcNx5w0A2_8KBBHxedmffM=s1600",
    title: ["Truck Dispatching ", "USA"],
    text: "Complete information about truck dispatching, logistics and transportation industry in USA.",
    cta: "Explore Now",
  },
  {
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEgV535qbmU8TW2XSKJvl8NzX55ZvMG_mswbu1MyiLHPvC1-sMnU7XFH134h7Yh88D3Oqw1uZWX-jV4_xXUiT9N2AJkZEkaPJbTr4Ms3S5vVXnbZjciJRABwzStBGP0jWQpHne0R0sNNF9SX5JMzticFkqkGVTsxM-grCV8Kp6iTqStvlcey51s3EIihK1g=s1600",
    title: ["Logistics ", "Solutions"],
    text: "Learn dispatching workflows, freight operations and transport management.",
    cta: "Learn More",
  },
  {
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEiBJwUiYa6YQWrLedz25_LibIc3bOv5agsviL-2Y--7YvKFrJrXYq2X_VyaLmD8y_buiKJjgrUJfTTK1EXI6x65mwUlVvHYbvXO3g3V9FlE54nJOID-4DBc4jLbNANdf585Xz9JhGdUFuSwoqdYH8B6hO8oVkVRpe3dF4gSj8h7C8YXkWF2Rvk7ednN0bU=s1600",
    title: ["Grow Your ", "Career"],
    text: "Step into the world of trucking and logistics with practical guidance.",
    cta: "Get Started",
  },
];

const NAVY = "#0a2a6e";
const RED = "#cc0000";

function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const touchStart = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const go = (n) => setIdx(((n % SLIDES.length) + SLIDES.length) % SLIDES.length);

  return (
    <div
      className="w-full overflow-hidden relative select-none"
      style={{ background: NAVY }}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) go(idx + (diff > 0 ? 1 : -1));
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {SLIDES.map((s, i) => (
          <div key={i} className="min-w-full relative">
            <img src={s.img} alt={s.title.join("")} className="w-full h-[340px] sm:h-[480px] md:h-[550px] object-cover object-center block" />
            <div
              className="absolute inset-0 flex items-center px-6 sm:px-12 md:px-16"
              style={{ background: "linear-gradient(to right, rgba(10,42,110,0.85) 0%, rgba(10,42,110,0.5) 50%, rgba(10,42,110,0.2) 100%)" }}
            >
              <div className="max-w-xl text-white">
                <h1 className="text-2xl sm:text-3xl md:text-[42px] font-black leading-tight mb-3 sm:mb-4" style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>
                  {s.title[0]}<span style={{ color: RED }}>{s.title[1]}</span>
                </h1>
                <p className="text-sm md:text-base mb-5 sm:mb-6 leading-relaxed" style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.5)" }}>{s.text}</p>
                <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer"
                  className="inline-block rounded-full px-7 py-3 text-sm font-black text-white transition-colors hover:bg-white hover:text-[#cc0000]"
                  style={{ background: RED, border: `3px solid ${RED}` }}>
                  💬 {s.cta}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 py-3" style={{ background: NAVY }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Slide ${i + 1}`}
            className="w-3 h-3 rounded-full border-2 transition-colors"
            style={{
              background: i === idx ? RED : "rgba(255,255,255,0.4)",
              borderColor: i === idx ? RED : "rgba(255,255,255,0.7)",
            }} />
        ))}
      </div>
    </div>
  );
}

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

function PlayerCard({ icon, title, children }) {
  return (
    <div className="rounded-xl p-5 flex-1 min-w-[230px] transition-transform hover:-translate-y-1" style={{ background: "#f4f6fb", borderTop: `4px solid ${RED}` }}>
      <span className="text-3xl block mb-2">{icon}</span>
      <h4 className="text-sm font-black mb-2" style={{ color: NAVY }}>{title}</h4>
      <p className="text-xs text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}

export default function Module1Lecture() {
  return (
    <div className="font-sans">
      <HeroSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 1 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 1 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330476169&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true" />
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 1 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          What Is <span style={{ color: RED }}>Truck Dispatching?</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          Build your rock-solid foundation. Understand the entire USA trucking ecosystem, where a dispatcher fits, and why this is one of the most lucrative remote careers available to Pakistanis today.
        </p>
        <div className="flex justify-center flex-wrap gap-6 sm:gap-8 mt-8">
          {[["$900B+", "USA Trucking Industry"], ["70%", "Freight Moved by Trucks"], ["3.5M+", "Truck Drivers in USA"], ["$10K", "Monthly Dispatcher Income"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <h3 className="text-xl sm:text-2xl font-black" style={{ color: RED }}>{n}</h3>
              <p className="text-xs text-slate-300 uppercase tracking-wide">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 1 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-16" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is currently being produced. Check back soon or WhatsApp us to join the live batch.</p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <p>Welcome to the very first lecture of the Tycoon Dispatch Academy Official Truck Dispatching Training Program. Before we dive into tools, software, cold calling scripts, and income strategies, we need to build a rock-solid foundation. And that foundation starts with one simple but powerful question: What exactly is truck dispatching?</p>
          <p>By the end of this lecture, you will have a complete understanding of what truck dispatching is, how the entire trucking ecosystem works, where a dispatcher fits inside that ecosystem, and why this is one of the most lucrative remote career opportunities available to Pakistanis today.</p>
        </Block>

        <Block icon="🇺🇸" title="The American Trucking Industry — Backbone of the US Economy">
          <p>To understand truck dispatching, you first need to understand the industry it lives inside. The United States of America is the world's largest consumer economy. Every single day, millions of products move from factories, warehouses, and ports to retailers, distribution centers, and individual homes.</p>
          <Highlight>🚛 Critical Fact: Approximately 70% of all freight in the United States is moved by trucks. Not trains. Not ships. Not airplanes. Trucks.</Highlight>
          <p>The American Trucking Associations (ATA) reports that the trucking industry generates over $900 billion in revenue annually and employs over 3.5 million truck drivers plus millions more in supporting roles — including dispatchers, brokers, logistics coordinators, and fleet managers.</p>
          <p>This is not a small niche industry. This is the circulatory system of the entire American economy. And inside this massive machine, there is a critical role that can be performed from anywhere in the world — including Pakistan — using just a laptop and an internet connection. That role is truck dispatching.</p>
        </Block>

        <Block icon="👨‍💼" title="What Is a Truck Dispatcher?">
          <p>A truck dispatcher is a professional who acts as the operational manager and business representative for truck drivers and trucking companies called carriers. The dispatcher's job is to:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Find available freight loads that need to be transported</li>
            <li>Match those loads with available trucks and drivers</li>
            <li>Negotiate the best possible rates for each load</li>
            <li>Handle all the paperwork and documentation</li>
            <li>Communicate with brokers on behalf of the carrier</li>
            <li>Ensure smooth pickup and delivery of every load</li>
            <li>Manage multiple carriers simultaneously to maximize income</li>
          </ol>
          <Highlight>💡 Think of a dispatcher as a middleman with deep expertise — connecting carriers who have trucks with brokers who have freight, managing the relationship, and earning a commission for every successfully completed load.</Highlight>
        </Block>

        <Block icon="🌐" title="The Trucking Ecosystem — All The Players">
          <p>To fully grasp what a dispatcher does, you need to understand every player in the trucking ecosystem:</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <PlayerCard icon="🏭" title="The Shipper">Any company or individual that needs to transport goods from one location to another. Amazon, food manufacturers, steel companies, pharmaceutical companies — the shipper is the origin of every load.</PlayerCard>
            <PlayerCard icon="🤝" title="The Freight Broker">A licensed intermediary between shippers and carriers. Licensed by FMCSA, brokers post loads on load boards. They make money by keeping the margin between what the shipper pays and what they pay the carrier.</PlayerCard>
            <PlayerCard icon="🚛" title="The Carrier">A trucking company or individual truck owner (owner-operator) that physically transports freight. Carriers need a constant supply of loads to keep their trucks moving and profitable.</PlayerCard>
            <PlayerCard icon="👨‍✈️" title="The Driver">Physically operates the truck. Works for carriers as employees or independent contractors. Drivers focus on driving efficiently, staying safe, and maximizing their miles.</PlayerCard>
            <PlayerCard icon="💻" title="The Dispatcher — YOU">Works on behalf of the carrier. Ensures trucks are always loaded, moving, and earning maximum revenue. Finds loads, negotiates rates, handles paperwork, and manages logistics from anywhere in the world.</PlayerCard>
          </div>
        </Block>

        <Block icon="💰" title="How Does The Money Flow?">
          <p>Here is a real example to understand the financial flow in truck dispatching:</p>
          <div className="rounded-xl p-5 sm:p-6 my-4 text-white" style={{ background: NAVY }}>
            <h3 className="text-base font-black mb-3" style={{ color: RED }}>📦 Real Load Example</h3>
            <p className="text-sm text-slate-300 mb-2">A manufacturer in Chicago needs to ship 40,000 pounds of electronics to a warehouse in Dallas. They contact their freight broker and agree to pay $3,500 for this load.</p>
            <p className="text-sm text-slate-300 mb-2">The broker posts this load on a load board. You — the dispatcher — find this load, identify a carrier with a dry van truck available in Chicago, and negotiate with the broker. The broker agrees to pay $3,000 to the carrier keeping $500 as their margin.</p>
            <p className="text-sm text-slate-300">You charge the carrier an 8–10% dispatch fee on the gross load value:</p>
            <div className="text-xl sm:text-2xl font-black text-center py-3 rounded-lg mt-3" style={{ background: RED }}>Your Commission = $240–$300 for ONE load 💰</div>
          </div>
          <Highlight>📊 Scale This Up: 5 carriers × 2 loads per week × $250 average commission = $2,500 per week = <strong>$10,000 per month</strong>. This is a realistic income for a trained, active dispatcher.</Highlight>
        </Block>

        <Block icon="🕐" title="What Does a Dispatcher Do Day to Day?">
          <p>Here is what a typical working day looks like for a truck dispatcher operating from Pakistan:</p>
          <div className="flex flex-col gap-3 mt-3">
            {[
              ["8:00 PM – 10:00 PM PKT", "Open load boards — DAT, Truckstop. Review available loads matching your carriers' equipment. Check emails for broker communications. Follow up on loads booked previously."],
              ["10:00 PM – 2:00 AM PKT", "Prime US business hours. Make calls to brokers about posted loads. Cold call new carriers. Negotiate rates. Send and receive rate confirmations. Coordinate pickup and delivery schedules."],
              ["2:00 AM – 4:00 AM PKT", "Wind down active negotiations. Update your CRM with all carrier and load information. Respond to urgent emails. Plan loads for the following day."],
            ].map(([time, desc]) => (
              <div key={time} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5 rounded-lg p-4" style={{ background: "#f4f6fb", borderLeft: `5px solid ${NAVY}` }}>
                <span className="text-xs font-black sm:min-w-[180px] flex-shrink-0" style={{ color: RED }}>{time}</span>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Highlight>⏰ Perfect Alignment: Pakistan evening and night hours align perfectly with US daytime business hours — making truck dispatching an ideal remote career for Pakistanis.</Highlight>
        </Block>

        <Block icon="🇵🇰" title="Why Truck Dispatching From Pakistan?">
          <p>You might wonder — why would American brokers and carriers work with a dispatcher based in Pakistan? The answer is simple: they do not care where you are physically located as long as you deliver results.</p>
          <p>Trucking is a results-driven industry. If you find great loads, negotiate competitive rates, handle paperwork efficiently, and keep communication professional — you are a valuable dispatcher regardless of your time zone or country.</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Cost of living is low — modest dollar income creates significant local purchasing power</li>
            <li>English proficiency is relatively high compared to many developing countries</li>
            <li>IT infrastructure in major cities supports remote work effectively</li>
            <li>Time zone alignment with US business hours during Pakistani evenings is nearly perfect</li>
            <li>Young, educated, ambitious workforce hungry for real income opportunities</li>
          </ul>
          <Highlight>🏆 Tycoon Dispatch Academy Official has operated in the US trucking industry for over 3 years. We have personally trained dispatchers who now earn $2,000–$10,000 per month from Pakistan. This is documented, repeated, scalable success.</Highlight>
        </Block>

        <Block icon="📋" title="Types of Dispatch Services">
          <p>As you grow in this field, you will encounter different types of dispatching arrangements:</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <PlayerCard icon="📊" title="Percentage-Based">You charge 5–12% of each load's gross value. Most common for independent dispatchers. Directly ties your income to your performance.</PlayerCard>
            <PlayerCard icon="💵" title="Flat Fee">Fixed weekly or monthly fee per truck regardless of loads booked. Simpler for carriers to budget but potentially less lucrative for you.</PlayerCard>
            <PlayerCard icon="🔀" title="Hybrid Model">A base monthly fee plus a smaller percentage per load. Balances stability with performance incentive. Best of both worlds.</PlayerCard>
          </div>
          <Highlight>💡 Beginner Recommendation: Start with percentage-based dispatching. It requires no upfront commitment from the carrier and directly motivates maximum performance.</Highlight>
        </Block>

        <Block icon="🧠" title="The Dispatcher's Mindset">
          <p>Truck dispatching is a business, not a job. You are not an employee — you are a service provider building relationships, managing accounts, and growing revenue. This requires:</p>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              ["💪", "Persistence", "You will face rejection on cold calls. Loads will fall through. Persistence separates successful dispatchers from those who quit after two weeks."],
              ["👔", "Professionalism", "Every interaction with a broker or carrier represents your business. Communication must always be clear, prompt, and professional."],
              ["📚", "Continuous Learning", "Rates fluctuate, regulations update, new tools emerge. Successful dispatchers never stop learning and adapting."],
              ["📋", "Organization", "Managing multiple carriers with multiple loads simultaneously requires exceptional organization. It is not optional — it is essential."],
              ["⏳", "Patience", "Income does not always start on day one. But it builds consistently for those who commit to the process and trust the system."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-lg p-4 w-full sm:w-[calc(50%-6px)] shadow-sm transition-transform hover:-translate-y-1" style={{ borderBottom: `4px solid ${RED}` }}>
                <span className="text-2xl block mb-2">{icon}</span>
                <h4 className="text-sm font-black mb-1.5" style={{ color: NAVY }}>{title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 1</h2>
          {[
            ["🚛", "70% of all US freight moves by truck", " — making trucking the backbone of the American economy and creating massive demand for dispatchers."],
            ["💼", "A dispatcher is a service provider", " — working on behalf of carriers to find loads, negotiate rates, handle paperwork, and manage broker relationships."],
            ["💰", "Income potential is $2,000–$10,000/month", " — based on number of carriers managed and loads dispatched per week."],
            ["🌍", "Location does not matter", " — dispatching is 100% remote and Pakistan's time zone aligns perfectly with US business hours."],
            ["🧠", "Mindset is everything", " — persistence, professionalism, organization, and patience are the real ingredients of dispatching success."],
          ].map(([icon, bold, rest]) => (
            <div key={bold} className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">{bold}</strong>{rest}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 sm:p-8 text-center mb-5" style={{ background: "linear-gradient(135deg, #cc0000 0%, #aa0000 100%)" }}>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">🚀 Ready To Continue Your Journey?</h2>
          <p className="text-sm text-red-200 mb-4">Module 2 is next — Types of Trucks. Know your equipment and you know your business.</p>
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
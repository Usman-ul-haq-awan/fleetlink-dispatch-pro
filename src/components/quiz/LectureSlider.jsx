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

export default function LectureSlider() {
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
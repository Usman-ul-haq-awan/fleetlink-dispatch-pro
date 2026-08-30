import React, { useState, useEffect, useCallback } from "react";
import { Image } from "@/components/ui/image";
import { MessageCircle, ArrowDown } from "lucide-react";

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80",
    alt: "Free Dispatcher Tools",
    title: <>Free Tools for <span className="text-red-500">Truck Dispatchers</span></>,
    body: "Professional dispatching calculators and tools — built by Tycoon Dispatch Academy. 100% free, no sign-up needed. Bookmark this page.",
    primary: { label: "Browse Tools", href: "#tools", icon: ArrowDown },
    secondary: { label: "WhatsApp Us", href: "https://wa.me/923114111899", icon: MessageCircle },
  },
  {
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80",
    alt: "Dispatch Profit Calculator",
    title: <>Dispatch <span className="text-red-500">Profit Calculator</span></>,
    body: "Enter your load rate, miles, fuel cost, dispatch fee and factoring fee. See your net profit and margin instantly — before you commit to a load.",
    primary: { label: "Use Calculator", href: "#profit-calculator", icon: ArrowDown },
    secondary: { label: "WhatsApp Us", href: "https://wa.me/923114111899", icon: MessageCircle },
  },
  {
    img: "https://images.unsplash.com/photo-1504376379689-8d54347b26c6?w=1600&q=80",
    alt: "More Tools Coming Soon",
    title: <>More Tools <span className="text-red-500">Coming Soon</span></>,
    body: "Invoice Generator, Income Calculator, Mileage Estimator, Load Tracker and more. WhatsApp us to get notified when new tools go live.",
    primary: { label: "Get Notified", href: "https://wa.me/923114111899", icon: MessageCircle },
    secondary: { label: "See What's Coming", href: "#tools", icon: ArrowDown },
  },
];

export default function ToolsSlider() {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  const show = useCallback((n) => {
    setCurrent((p) => {
      if (n >= total) return 0;
      if (n < 0) return total - 1;
      return n;
    });
  }, [total]);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % total), 4000);
    return () => clearInterval(t);
  }, [total]);

  const move = (dir) => show(current + dir);

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0a2a6e]"
      onTouchStart={(e) => (window._ttTouch = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = window._ttTouch - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1);
      }}
    >
      <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative min-w-full overflow-hidden">
            <div className="w-full h-[320px] md:h-[550px]">
              <Image src={slide.img} alt={slide.alt} fittingType="fill" className="w-full h-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a2a6e]/90 via-[#0a2a6e]/50 to-[#0a2a6e]/20 md:items-center flex items-end p-5 md:p-16 pb-10 md:pb-0">
              <div className="max-w-xl text-white">
                <h1 className="text-[22px] md:text-[42px] font-black leading-tight mb-2 md:mb-4 drop-shadow-lg" style={{ fontFamily: "Arial, sans-serif" }}>
                  {slide.title}
                </h1>
                <p className="text-[13px] md:text-base text-slate-100 mb-4 md:mb-6 leading-relaxed drop-shadow">{slide.body}</p>
                <div className="flex flex-wrap gap-3">
                  <a href={slide.primary.href} className="inline-flex items-center gap-2 bg-red-600 hover:bg-white hover:text-red-600 text-white px-6 md:px-9 py-2.5 md:py-3.5 rounded-full text-sm font-bold border-2 border-red-600 transition-colors">
                    {slide.primary.icon && <slide.primary.icon className="w-4 h-4" />}
                    {slide.primary.label}
                  </a>
                  <a href={slide.secondary.href} className="inline-flex items-center gap-2 bg-transparent hover:bg-white hover:text-[#0a2a6e] text-white px-6 md:px-9 py-2.5 md:py-3.5 rounded-full text-sm font-bold border-2 border-white transition-colors">
                    {slide.secondary.icon && <slide.secondary.icon className="w-4 h-4" />}
                    {slide.secondary.label}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full border-2 transition-colors ${
              i === current ? "bg-red-600 border-red-600" : "bg-white/50 border-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
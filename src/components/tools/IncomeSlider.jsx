import React, { useState, useEffect } from "react";
import { Image } from "@/components/ui/image";
import { MessageCircle, ArrowDown } from "lucide-react";

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80",
    alt: "Dispatcher Income",
    title: <>How Much Can a <span className="text-red-500">Dispatcher Make?</span></>,
    body: "Stop guessing. Enter your numbers and see your exact monthly and annual dispatcher income — before you even start.",
    primary: { label: "Calculate My Income", href: "#income-calc", icon: ArrowDown },
    secondary: { label: "WhatsApp Us", href: "https://wa.me/923114111899", icon: MessageCircle },
  },
  {
    img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1600&q=80",
    alt: "Commission Based Income",
    title: <>Your Income Grows With <span className="text-red-500">Every Truck</span></>,
    body: "The more carriers you manage the more you earn. This calculator shows your income at every level — 1 truck to 20 trucks.",
    primary: { label: "See The Numbers", href: "#income-calc", icon: ArrowDown },
    secondary: { label: "WhatsApp Us", href: "https://wa.me/923114111899", icon: MessageCircle },
  },
  {
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&q=80",
    alt: "Pakistani Dispatcher Income",
    title: <>Earning in <span className="text-red-500">USD from Pakistan</span></>,
    body: "Pakistani dispatchers earn in US dollars. See your monthly income in both USD and PKR equivalent — and what it means for your life.",
    primary: { label: "Calculate Now", href: "#income-calc", icon: ArrowDown },
    secondary: { label: "WhatsApp Us", href: "https://wa.me/923114111899", icon: MessageCircle },
  },
];

export default function IncomeSlider() {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % total), 4500);
    return () => clearInterval(t);
  }, [total]);

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0a2a6e]"
      onTouchStart={(e) => (window._tiTouch = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = window._tiTouch - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) setCurrent((c) => (diff > 0 ? (c + 1) % total : (c - 1 + total) % total));
      }}
    >
      <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative min-w-full overflow-hidden">
            <div className="w-full h-[300px] md:h-[500px]">
              <Image src={slide.img} alt={slide.alt} fittingType="fill" className="w-full h-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a2a6e]/90 via-[#0a2a6e]/55 to-[#0a2a6e]/15 md:items-center flex items-end p-5 md:p-16 pb-8 md:pb-0">
              <div className="max-w-xl text-white">
                <h1 className="text-[22px] md:text-[40px] font-black leading-tight mb-3 md:mb-4 drop-shadow-lg" style={{ fontFamily: "Arial, sans-serif" }}>
                  {slide.title}
                </h1>
                <p className="text-[13px] md:text-base text-slate-100 mb-4 md:mb-6 leading-relaxed drop-shadow">{slide.body}</p>
                <div className="flex flex-wrap gap-3">
                  <a href={slide.primary.href} className="inline-flex items-center gap-2 bg-red-600 hover:bg-white hover:text-red-600 text-white px-8 py-3 rounded-full text-sm font-black border-2 border-red-600 transition-colors">
                    {slide.primary.icon && <slide.primary.icon className="w-4 h-4" />}
                    {slide.primary.label}
                  </a>
                  <a href={slide.secondary.href} className="inline-flex items-center gap-2 bg-transparent hover:bg-white hover:text-[#0a2a6e] text-white px-8 py-3 rounded-full text-sm font-black border-2 border-white transition-colors">
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
          <button key={i} onClick={() => setCurrent(i)} className={`w-3 h-3 rounded-full border-2 transition-colors ${i === current ? "bg-red-600 border-red-600" : "bg-white/50 border-white/80"}`} />
        ))}
      </div>
    </div>
  );
}
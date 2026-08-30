import React from "react";
import { Lightbulb, AlertTriangle, CheckCircle, Sparkles, TrendingUp, Flag, Rocket, BookOpen, MessageCircle } from "lucide-react";

const TIERS = [
  { icon: "🌱", name: "Beginner", trucks: "1–2 trucks", income: "$300–$700/mo", gold: false },
  { icon: "📈", name: "Growing", trucks: "3–5 trucks", income: "$700–$2,000/mo", gold: false },
  { icon: "💼", name: "Established", trucks: "6–10 trucks", income: "$2,000–$4,500/mo", gold: false },
  { icon: "🏆", name: "Professional", trucks: "10–20 trucks", income: "$4,500–$10,000+/mo", gold: true },
];

const FAQS = [
  { q: "How much does a beginner truck dispatcher make?", a: "A beginner dispatcher managing 1 to 2 trucks typically earns between $300 and $700 per month. Income grows quickly as you add more carriers and improve your load booking skills — most graduates reach $1,500+ within 6 months." },
  { q: "Can I dispatch from Pakistan and earn in USD?", a: "Yes — truck dispatching is a fully remote job. You work US hours, communicate with US brokers and carriers via phone and email, and get paid in US dollars. Pakistani dispatchers with Tycoon Tours training are actively working and earning right now." },
  { q: "What is a realistic dispatch commission rate?", a: "The standard range is 5% to 10% of the gross load rate. New dispatchers typically start at 5% to 7% and increase as they prove results. Some experienced dispatchers switch to a flat fee model of $150 to $300 per truck per week." },
  { q: "How many trucks can one dispatcher manage?", a: "A single dispatcher can typically manage 5 to 15 trucks depending on their workflow, tools and experience. With a team or virtual assistant support some dispatchers manage 20+ trucks. Starting with 1 to 3 trucks is recommended to learn the process properly." },
  { q: "How many loads per week does a truck do?", a: "Most long-haul trucks complete 1 to 2 loads per week. Regional trucks running shorter lanes can do 3 to 5 loads per week. The calculator uses your input so you can model both scenarios for your specific carriers." },
];

const TAKEAWAYS = [
  { icon: Sparkles, text: <>Income scales with trucks — every carrier you add multiplies your income. One truck might earn you $400/month. Five trucks earns you $2,000/month. The model scales linearly.</> },
  { icon: TrendingUp, text: <>Commission rate matters — the difference between 5% and 8% commission on a $3,000 load is $90 per load. Over 10 loads a week across 5 trucks that is $900 more per week — from negotiating better.</> },
  { icon: Flag, text: <>USD income in Pakistan is powerful — even $500/month USD equals over PKR 139,000 at current rates. $2,000/month puts you in the top income bracket in Pakistan while working from home.</> },
  { icon: Rocket, text: <>Start small, scale fast — do not wait until you have 10 carriers to start. Get your first carrier, learn the process, deliver results, then add more. Tycoon Tours teaches you how to do all of this step by step.</> },
  { icon: BookOpen, text: <>Training is the shortcut — dispatchers who go through structured training like the Tycoon Tours 23-module course reach profitability months faster than those who try to figure it out alone.</> },
];

export default function IncomeContent() {
  return (
    <>
      {/* Income Tiers */}
      <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border-l-4 border-red-600">
        <h2 className="text-xl font-black text-[#0a2a6e] mb-4 pb-3 border-b-2 border-slate-100">📊 Real Dispatcher Income Levels</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">These are realistic income ranges based on actual dispatching operations. Your income depends on how many trucks you manage, the quality of loads you book, and your commission rate.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIERS.map((t) => (
            <div key={t.name} className={`rounded-xl p-4 border-t-4 transition-transform hover:-translate-y-1 ${t.gold ? "border-red-600 bg-red-50" : "border-[#0a2a6e] bg-slate-50"}`}>
              <h4 className={`text-sm font-black mb-1 ${t.gold ? "text-red-600" : "text-[#0a2a6e]"}`}>{t.icon} {t.name}</h4>
              <p className="text-xs text-slate-500 mb-2">{t.trucks}</p>
              <p className={`text-lg font-black ${t.gold ? "text-red-600" : "text-[#0a2a6e]"}`}>{t.income}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border-2 border-[#0a2a6e] rounded-xl p-4 mt-4">
          <p className="text-sm text-[#0a2a6e] font-bold leading-relaxed flex gap-2"><Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" /> Most Tycoon Tours graduates start with 1–2 trucks and scale to 5+ trucks within their first year. The calculator above shows exactly what each level means for your income.</p>
        </div>
      </div>

      {/* How Commission Works */}
      <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border-l-4 border-red-600">
        <h2 className="text-xl font-black text-[#0a2a6e] mb-4 pb-3 border-b-2 border-slate-100">📋 How Dispatcher Commission Works</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">As a dispatcher you earn a percentage of every load rate your carrier gets paid by the broker. This is called your dispatch commission or dispatch fee.</p>
        <div className="bg-blue-50 border-2 border-[#0a2a6e] rounded-xl p-4 my-4">
          <p className="text-sm text-[#0a2a6e] font-bold leading-relaxed flex gap-2"><Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" /> Example: Your carrier books a load for $3,000. Your commission is 7%. You earn $210 from that single load — without driving a single mile.</p>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">The standard dispatcher commission range is 5% to 10% of the gross load rate. Some experienced dispatchers charge a flat weekly fee instead — typically $150 to $350 per truck per week regardless of load count.</p>
        <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 my-4">
          <p className="text-sm text-red-600 font-bold leading-relaxed flex gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> Never charge more than 10% as a new dispatcher — it is industry standard and carriers will walk away. Build trust first, then negotiate your rate upward as you prove your value.</p>
        </div>
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 my-4">
          <p className="text-sm text-green-700 font-bold leading-relaxed flex gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> The more loads you book per truck per week, the more you earn — even without adding new carriers. Focus on maximizing load frequency first, then scale by adding trucks.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border-l-4 border-red-600">
        <h2 className="text-xl font-black text-[#0a2a6e] mb-4 pb-3 border-b-2 border-slate-100">❓ Frequently Asked Questions</h2>
        {FAQS.map((f, i) => (
          <div key={i} className={`py-4 ${i < FAQS.length - 1 ? "border-b border-slate-100" : ""}`}>
            <h4 className="text-sm font-black text-[#0a2a6e] mb-1.5">{f.q}</h4>
            <p className="text-sm text-slate-600 leading-relaxed m-0">{f.a}</p>
          </div>
        ))}
      </div>

      {/* Takeaways */}
      <div className="bg-[#0a2a6e] rounded-2xl p-8 mb-6">
        <h2 className="text-xl font-black text-white mb-5 pb-3 border-b-2 border-white/20">✅ Key Things to Remember</h2>
        {TAKEAWAYS.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} className="flex items-start gap-4 mb-4 last:mb-0">
              <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300 leading-relaxed m-0">{t.text}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-10 text-center mb-6">
        <h2 className="text-2xl font-black text-white mb-3">🚀 Ready to Start Earning as a Dispatcher?</h2>
        <p className="text-sm text-red-200 mb-5 max-w-2xl mx-auto">Join the Tycoon Tours complete 23-module truck dispatching course. Learn everything from carrier onboarding to load booking to invoice management — and start earning in USD from Pakistan.</p>
        <a href="https://wa.me/923114111899" className="inline-flex items-center gap-2 bg-green-500 hover:bg-white hover:text-green-500 text-white px-9 py-3 rounded-full text-sm font-black border-2 border-green-500 transition-colors">
          <MessageCircle className="w-4 h-4" /> Enroll Now — WhatsApp Us
        </a>
      </div>
    </>
  );
}
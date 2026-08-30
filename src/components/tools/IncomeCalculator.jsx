import React, { useState, useMemo } from "react";
import { Truck, DollarSign, Package, BarChart3, Coins, Calendar, Wallet } from "lucide-react";

const fmtUSD = (n) => "$" + Math.round(n).toLocaleString("en-US");
const fmtPKR = (n) => "PKR " + Math.round(n).toLocaleString("en-PK");

const EXPERIENCE = [
  { value: "1", label: "Beginner (starting out)" },
  { value: "0.85", label: "Learning (first 3 months)" },
  { value: "1", label: "Working (3–12 months)" },
  { value: "1.1", label: "Experienced (1–2 years)" },
  { value: "1.2", label: "Expert (2+ years)" },
];

export default function IncomeCalculator() {
  const [v, setV] = useState({ trucks: "", loadrate: "", loadsperweek: "", commission: "", pkrrate: "278", experience: "1" });
  const set = (id, val) => setV((p) => ({ ...p, [id]: val }));

  const r = useMemo(() => {
    const trucks = parseFloat(v.trucks) || 0;
    const loadrate = parseFloat(v.loadrate) || 0;
    const lpw = parseFloat(v.loadsperweek) || 0;
    const comm = parseFloat(v.commission) || 0;
    const pkr = parseFloat(v.pkrrate) || 278;

    if (!trucks || !loadrate || !lpw || !comm) return null;

    const weeklyPerTruck = loadrate * (comm / 100) * lpw;
    const weeklyTotal = weeklyPerTruck * trucks;
    const monthlyTotal = weeklyTotal * 4.33;
    const annualTotal = monthlyTotal * 12;
    const pkrMonthly = monthlyTotal * pkr;

    const scalePoints = [1, 3, 5, 10, 15];
    const maxIncome = weeklyPerTruck * 15 * 4.33;
    const scale = scalePoints.map((t) => ({
      trucks: t,
      inc: weeklyPerTruck * t * 4.33,
      pct: maxIncome > 0 ? Math.round((weeklyPerTruck * t * 4.33 / maxIncome) * 100) : 0,
      active: t <= trucks,
    }));

    const breakdown = [
      ["Trucks managed", trucks],
      ["Avg load rate per truck", "$" + loadrate.toLocaleString()],
      ["Loads per truck per week", lpw],
      ["Commission rate", comm + "%"],
      ["Commission per load", "$" + Math.round(loadrate * (comm / 100)).toLocaleString()],
      ["Weekly income per truck", fmtUSD(weeklyPerTruck)],
      ["Total weekly income", fmtUSD(weeklyTotal)],
    ];

    let verdict;
    if (monthlyTotal >= 4000) {
      verdict = { icon: "🏆", bg: "bg-green-50", color: "text-green-700", title: "Professional level income!", text: "At this level you are running a serious dispatching business. Focus on systems and hiring support staff to scale further." };
    } else if (monthlyTotal >= 1500) {
      verdict = { icon: "📈", bg: "bg-blue-50", color: "text-blue-700", title: "Solid dispatching income.", text: "You are building a real business. Add 1–2 more carriers to break into the next income tier." };
    } else if (monthlyTotal >= 500) {
      verdict = { icon: "⚠️", bg: "bg-amber-50", color: "text-amber-700", title: "Good start — room to grow.", text: "You are earning but not yet at full potential. Focus on adding more trucks or increasing your loads per week." };
    } else {
      verdict = { icon: "🌱", bg: "bg-red-50", color: "text-red-700", title: "Early stage income.", text: "This is where everyone starts. Add your second and third carrier as quickly as possible — income grows fast from here." };
    }

    return { trucks, loadrate, lpw, comm, pkr, weeklyPerTruck, weeklyTotal, monthlyTotal, annualTotal, pkrMonthly, scale, breakdown, verdict };
  }, [v]);

  return (
    <div id="income-calc" className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border-l-4 border-[#0a2a6e] overflow-hidden">
      <div className="bg-gradient-to-br from-[#0a2a6e] to-[#0d3080] p-6 flex items-center gap-3">
        <Wallet className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-xl font-black text-white">Dispatcher Income Calculator</h2>
          <p className="text-sm text-slate-300">Fill in your numbers — results update instantly</p>
        </div>
      </div>

      <div className="p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          <Field icon={Truck} label="Number of Trucks Under You" value={v.trucks} onChange={(val) => set("trucks", val)} placeholder="e.g. 3" min={1} max={50} step={1} />
          <Field icon={DollarSign} label="Average Load Rate Per Truck ($)" value={v.loadrate} onChange={(val) => set("loadrate", val)} placeholder="e.g. 3000" min={0} step={100} />
          <Field icon={Package} label="Loads Per Truck Per Week" value={v.loadsperweek} onChange={(val) => set("loadsperweek", val)} placeholder="e.g. 2" min={1} max={7} step={1} />
          <Field icon={BarChart3} label="Your Dispatch Commission (%)" value={v.commission} onChange={(val) => set("commission", val)} placeholder="e.g. 7" min={1} max={15} step={0.5} />
          <Field icon={Coins} label="USD to PKR Rate" value={v.pkrrate} onChange={(val) => set("pkrrate", val)} placeholder="e.g. 278" min={1} step={1} />
          <div>
            <label className="text-sm text-slate-600 font-bold flex items-center gap-1.5 mb-1.5"><Calendar className="w-4 h-4" /> Experience Level</label>
            <select value={v.experience} onChange={(e) => set("experience", e.target.value)} className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0a2a6e] bg-white">
              {EXPERIENCE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {!r ? (
          <div className="bg-slate-50 rounded-xl p-7 text-center text-slate-400">
            <Wallet className="w-9 h-9 mx-auto mb-2" />
            <p className="text-sm">Enter your numbers above to calculate your dispatcher income</p>
          </div>
        ) : (
          <div>
            <hr className="border-slate-100 mb-5" />
            <div className="bg-gradient-to-br from-[#0a2a6e] to-[#0d3080] rounded-xl p-7 text-center mb-5">
              <p className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-2">Your Estimated Monthly Income</p>
              <p className="text-4xl md:text-5xl font-black text-red-500 mb-1">{fmtUSD(r.monthlyTotal)}</p>
              <p className="text-sm text-slate-400">from {r.trucks} truck{r.trucks > 1 ? "s" : ""} at {r.comm}% commission</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <Card label="Weekly Income" value={fmtUSD(r.weeklyTotal)} />
              <Card label="Monthly Income" value={fmtUSD(r.monthlyTotal)} highlight />
              <Card label="Annual Income" value={fmtUSD(r.annualTotal)} />
            </div>

            <div className="bg-[#0a2a6e] rounded-xl p-5 mb-5 flex items-center gap-4">
              <span className="text-3xl">🇵🇰</span>
              <div>
                <p className="text-xs text-slate-300 mb-1">Monthly PKR Equivalent</p>
                <p className="text-2xl font-black text-red-500">{fmtPKR(r.pkrMonthly)}</p>
                <p className="text-xs text-slate-400 mt-0.5">at $1 = PKR {r.pkr} (update rate above if needed)</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 mb-5">
              <p className="text-sm font-black text-[#0a2a6e] mb-3.5">📈 Income Growth — As You Add More Trucks</p>
              {r.scale.map((s) => (
                <div key={s.trucks} className="flex items-center gap-3 mb-2.5 last:mb-0">
                  <span className="text-xs text-slate-600 font-bold min-w-[80px]">{s.trucks} truck{s.trucks > 1 ? "s" : ""}</span>
                  <div className="flex-1 bg-slate-200 rounded h-2.5 overflow-hidden">
                    <div className="h-full rounded transition-all" style={{ width: `${s.pct}%`, background: s.active ? "#cc0000" : "#0a2a6e" }} />
                  </div>
                  <span className="text-xs font-black text-[#0a2a6e] min-w-[70px] text-right">{fmtUSD(s.inc)}/mo</span>
                </div>
              ))}
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-5 mb-5">
              <p className="text-sm font-black text-[#0a2a6e] mb-3">Income Breakdown</p>
              {r.breakdown.map((row, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100 last:border-0">
                  <span>{row[0]}</span>
                  <span className="font-bold text-slate-800">{row[1]}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-black text-[#0a2a6e] pt-1.5">
                <span>Monthly income</span>
                <span>{fmtUSD(r.monthlyTotal)}</span>
              </div>
            </div>

            <div className={`rounded-xl p-4 px-5 text-sm font-bold flex items-start gap-3 ${r.verdict.bg} ${r.verdict.color}`}>
              <span className="text-2xl flex-shrink-0">{r.verdict.icon}</span>
              <div><strong>{r.verdict.title}</strong> {r.verdict.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, min, max, step }) {
  return (
    <div>
      <label className="text-sm text-slate-600 font-bold flex items-center gap-1.5 mb-1.5"><Icon className="w-4 h-4" /> {label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min} max={max} step={step} className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0a2a6e]" />
    </div>
  );
}

function Card({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? "bg-red-50 border-2 border-red-600" : "bg-slate-50"}`}>
      <p className="text-xs text-slate-500 mb-1.5">{label}</p>
      <p className={`text-xl font-black ${highlight ? "text-red-600" : "text-[#0a2a6e]"}`}>{value}</p>
    </div>
  );
}
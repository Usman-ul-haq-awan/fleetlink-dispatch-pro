import React, { useState, useMemo } from "react";
import { Fuel } from "lucide-react";

const fieldCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const hintCls = "text-[11px] text-slate-400 mt-1";

const REF_TABLE = (() => {
  const rows = [];
  let r = 1.2;
  let c = 0;
  for (let i = 0; i < 50; i++) {
    const lo = r + i * 0.06;
    const hi = lo + 0.05;
    rows.push({ range: `$${lo.toFixed(2)} – $${hi.toFixed(2)}`, perMile: c, per1000: c * 1000 });
    c += 0.01;
  }
  rows.push({ range: "$4.20+", perMile: 0.5, per1000: 500 });
  return rows;
})();

function fmt(n) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FuelSurchargeCalculator() {
  const [current, setCurrent] = useState("");
  const [base, setBase] = useState("1.20");
  const [rate, setRate] = useState("1");
  const [miles, setMiles] = useState("");
  const [mpg, setMpg] = useState("6.5");
  const [loadRate, setLoadRate] = useState("");

  const calc = useMemo(() => {
    const c = parseFloat(current) || 0;
    const b = parseFloat(base) || 1.2;
    const r = parseFloat(rate) || 1;
    const m = parseFloat(miles) || 0;
    const mp = parseFloat(mpg) || 6.5;
    const lr = parseFloat(loadRate) || 0;
    if (!c || !m) return null;

    const overBase = Math.max(0, c - b);
    const increments = Math.floor(overBase / 0.06);
    const fscPerMile = parseFloat((increments * (r / 100)).toFixed(4));
    const totalFSC = parseFloat((fscPerMile * m).toFixed(2));
    const gallons = m / mp;
    const actualFuelCost = parseFloat((gallons * c).toFixed(2));
    const fscPct = lr > 0 ? ((totalFSC / lr) * 100).toFixed(1) : null;
    const coverage = actualFuelCost > 0 ? (totalFSC / actualFuelCost) * 100 : 0;

    let verdict = { color: "red", icon: "❌", text: "Low FSC coverage. The fuel surcharge barely covers the actual fuel cost increase. Your carrier is absorbing most of the diesel cost — renegotiate the rate or FSC terms." };
    if (coverage >= 80) verdict = { color: "green", icon: "✅", text: "Good FSC coverage. The surcharge covers most of the actual fuel cost increase. Your carrier is fairly compensated for current diesel prices." };
    else if (coverage >= 50) verdict = { color: "amber", icon: "⚠️", text: "Partial FSC coverage. The surcharge partially offsets the fuel cost. Consider negotiating a higher base rate to compensate your carrier fully." };

    return { c, b, r, m, mp, lr, overBase, increments, fscPerMile, totalFSC, gallons, actualFuelCost, fscPct, coverage, verdict };
  }, [current, base, rate, miles, mpg, loadRate]);

  const activeRowIdx = calc ? Math.min(Math.floor((calc.c - 1.2) / 0.06), REF_TABLE.length - 1) : -1;
  const maxBar = calc ? Math.max(calc.c, calc.b, 3.0) : 3.0;

  const breakdown = calc ? [
    ["Current diesel price", `$${calc.c.toFixed(2)}/gal`],
    ["Base diesel price", `$${calc.b.toFixed(2)}/gal`],
    ["Price above base", `$${calc.overBase.toFixed(2)}/gal`],
    ["$0.06 increments above base", calc.increments],
    ["Surcharge rate per increment", `$${calc.r.toFixed(2)}¢/mile`],
    ["Fuel surcharge per mile", `$${calc.fscPerMile.toFixed(3)}/mi`],
    ["Total miles", `${calc.m} mi`],
    ["Gallons used (est.)", `${calc.gallons.toFixed(1)} gal @ ${calc.mp} MPG`],
    ["Actual fuel cost (est.)", fmt(calc.actualFuelCost)],
  ] : [];

  const dieselBars = calc ? [
    { label: "Base price", val: calc.b, color: "bg-green-500" },
    { label: "Current price", val: calc.c, color: calc.c > calc.b ? "bg-red-500" : "bg-green-500" },
    { label: "Price over base", val: calc.overBase, color: "bg-blue-800" },
  ] : [];

  const verdictCls = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-blue-800 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center gap-3">
        <Fuel className="w-7 h-7 text-white" />
        <div>
          <h2 className="text-lg font-bold text-white">Fuel Surcharge Calculator</h2>
          <p className="text-xs text-blue-100">Results update instantly as you type</p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div>
            <label className={labelCls}>⛽ Current Diesel Price ($/gal)</label>
            <input type="number" min="0" step="0.01" className={fieldCls} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="e.g. 3.85" />
            <p className={hintCls}>Check today's price at eia.gov/petroleum</p>
          </div>
          <div>
            <label className={labelCls}>📊 Base Diesel Price ($/gal)</label>
            <input type="number" min="0" step="0.01" className={fieldCls} value={base} onChange={(e) => setBase(e.target.value)} />
            <p className={hintCls}>Standard EIA base is $1.20/gal</p>
          </div>
          <div>
            <label className={labelCls}>📈 Surcharge Rate (¢/mile per $0.06 increment)</label>
            <input type="number" min="0" step="0.1" className={fieldCls} value={rate} onChange={(e) => setRate(e.target.value)} />
            <p className={hintCls}>Typical rate is $0.01/mile per $0.06 diesel increase</p>
          </div>
          <div>
            <label className={labelCls}>🛣️ Total Miles</label>
            <input type="number" min="0" step="10" className={fieldCls} value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="e.g. 1200" />
          </div>
          <div>
            <label className={labelCls}>🚛 Truck MPG (optional)</label>
            <input type="number" min="0" step="0.1" className={fieldCls} value={mpg} onChange={(e) => setMpg(e.target.value)} />
            <p className={hintCls}>Average semi-truck gets 5.5–7 MPG</p>
          </div>
          <div>
            <label className={labelCls}>💵 Gross Load Rate ($)</label>
            <input type="number" min="0" step="50" className={fieldCls} value={loadRate} onChange={(e) => setLoadRate(e.target.value)} placeholder="e.g. 3000" />
            <p className={hintCls}>Optional — to see FSC as % of load rate</p>
          </div>
        </div>

        {!calc ? (
          <div className="bg-slate-50 rounded-lg p-10 text-center text-slate-400">
            <Fuel className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Enter diesel price and miles above to calculate fuel surcharge</p>
          </div>
        ) : (
          <div>
            <hr className="border-slate-100 mb-5" />

            <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl p-7 text-center mb-5">
              <p className="text-xs text-blue-100 font-bold uppercase tracking-wide mb-2">Total Fuel Surcharge for This Load</p>
              <p className="text-5xl font-bold text-red-500 mb-1">{fmt(calc.totalFSC)}</p>
              <p className="text-sm text-slate-300">
                ${calc.fscPerMile.toFixed(3)}/mile × {calc.m} miles{calc.fscPct !== null ? ` — ${calc.fscPct}% of load rate` : ""}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1.5">FSC Per Mile</p>
                <p className="text-xl font-bold text-blue-800">${calc.fscPerMile.toFixed(3)}/mi</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1.5">Diesel Over Base</p>
                <p className="text-xl font-bold text-blue-800">${calc.overBase.toFixed(2)}/gal</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1.5">Actual Fuel Cost</p>
                <p className="text-xl font-bold text-blue-800">{fmt(calc.actualFuelCost)}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-5 mb-5">
              <p className="text-sm font-bold text-blue-800 mb-3.5">⛽ Diesel Price Breakdown</p>
              {dieselBars.map((b) => (
                <div key={b.label} className="flex items-center gap-3 mb-2.5 last:mb-0">
                  <span className="text-xs text-slate-600 font-semibold min-w-[110px]">{b.label}</span>
                  <div className="flex-1 bg-slate-200 rounded h-2.5 overflow-hidden">
                    <div className={`h-full rounded ${b.color} transition-all`} style={{ width: `${maxBar > 0 ? Math.round((b.val / maxBar) * 100) : 0}%` }} />
                  </div>
                  <span className="text-xs font-bold min-w-[55px] text-right">${b.val.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
              <p className="text-sm font-bold text-blue-800 mb-3">Full Calculation Breakdown</p>
              {breakdown.map(([k, v], i) => (
                <div key={k} className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100 last:border-0">
                  <span>{k}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-blue-800 pt-2">
                <span>Total Fuel Surcharge</span>
                <span className="text-red-600 text-base">{fmt(calc.totalFSC)}</span>
              </div>
            </div>

            <div className={`rounded-lg p-4 text-sm font-semibold flex items-start gap-3 mb-5 border ${verdictCls[calc.verdict.color]}`}>
              <span className="text-2xl flex-shrink-0">{calc.verdict.icon}</span>
              <div>{calc.verdict.text}</div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-slate-50 rounded-lg p-5">
          <h3 className="font-bold text-blue-800 text-sm mb-3">📊 EIA Fuel Surcharge Reference Table</h3>
          <p className="text-xs text-slate-500 mb-3">
            The standard reference used by most carriers and brokers. Your current diesel price row is highlighted after calculating.
          </p>
          <div className="overflow-auto max-h-80 rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-blue-800 text-white sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Diesel Price Range</th>
                  <th className="text-left px-3 py-2 font-bold">FSC per Mile</th>
                  <th className="text-left px-3 py-2 font-bold">Per 1000 Miles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REF_TABLE.map((row, i) => (
                  <tr key={i} className={`even:bg-slate-50 ${i === activeRowIdx ? "bg-red-50 font-bold text-red-600" : "text-slate-600"}`}>
                    <td className="px-3 py-2">{row.range}</td>
                    <td className="px-3 py-2">${row.perMile.toFixed(2)}/mi</td>
                    <td className="px-3 py-2">${row.per1000}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
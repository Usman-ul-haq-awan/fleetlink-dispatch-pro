import React, { useState, useMemo } from "react";
import { MapPin } from "lucide-react";

const fieldCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const hintCls = "text-[11px] text-slate-400 mt-1";

const CORRIDORS = [
  { lane: "LA → Dallas", info: "~1,430 miles — High freight volume, strong rates year-round" },
  { lane: "Chicago → Atlanta", info: "~730 miles — Major Midwest to Southeast lane" },
  { lane: "NY → Miami", info: "~1,280 miles — Heavy refrigerated and retail freight" },
  { lane: "Dallas → Chicago", info: "~920 miles — Strong northbound rates, consistent volume" },
  { lane: "LA → Seattle", info: "~1,135 miles — West Coast lane, moderate rates" },
  { lane: "Atlanta → Houston", info: "~790 miles — Southeast to Texas, steady demand" },
  { lane: "Chicago → Dallas", info: "~920 miles — Southbound often soft — negotiate hard" },
  { lane: "Miami → New York", info: "~1,280 miles — Northbound strong, produce and retail" },
];

function fmt(n) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtS(n) {
  return (n < 0 ? "-" : "") + fmt(n);
}

export default function MileageEstimator() {
  const [miles, setMiles] = useState("");
  const [loadRate, setLoadRate] = useState("");
  const [diesel, setDiesel] = useState("3.85");
  const [mpg, setMpg] = useState("6.5");
  const [dispFee, setDispFee] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const [speed, setSpeed] = useState("55");
  const [stops, setStops] = useState("3");

  const calc = useMemo(() => {
    const m = parseFloat(miles) || 0;
    const lr = parseFloat(loadRate) || 0;
    const d = parseFloat(diesel) || 3.85;
    const mp = parseFloat(mpg) || 6.5;
    const df = parseFloat(dispFee) || 0;
    const oc = parseFloat(otherCosts) || 0;
    const sp = parseFloat(speed) || 55;
    const st = parseFloat(stops) || 3;
    if (!m || !lr) return null;

    const gallons = m / mp;
    const fuelCost = parseFloat((gallons * d).toFixed(2));
    const dispAmt = parseFloat((lr * (df / 100)).toFixed(2));
    const totalCosts = parseFloat((fuelCost + dispAmt + oc).toFixed(2));
    const profit = parseFloat((lr - totalCosts).toFixed(2));
    const rpm = m > 0 ? parseFloat((lr / m).toFixed(2)) : 0;
    const ppm = m > 0 ? parseFloat((profit / m).toFixed(2)) : 0;
    const driveHrs = m / sp;
    const totalHrs = driveHrs + st;
    const days = Math.floor(totalHrs / 24);
    const hrs = Math.round(totalHrs % 24);

    let verdict = { color: "red", icon: "❌", text: "Loss-making load. Total costs exceed the load rate. Do not book this load at this rate — renegotiate or decline." };
    if (ppm >= 1.0) verdict = { color: "green", icon: "✅", text: "Excellent load. Over $1.00 profit per mile — strong margin. Book it and confirm with your carrier immediately." };
    else if (ppm >= 0.5) verdict = { color: "blue", icon: "📈", text: "Decent load. $0.50–$1.00 profit per mile is acceptable. Try to negotiate $0.10–$0.20/mile more before confirming." };
    else if (profit > 0) verdict = { color: "amber", icon: "⚠️", text: "Thin margin. Under $0.50 profit per mile — push back on the broker for a better rate before committing." };

    return { m, lr, d, mp, df, oc, gallons, fuelCost, dispAmt, totalCosts, profit, rpm, ppm, driveHrs, totalHrs, days, hrs, verdict };
  }, [miles, loadRate, diesel, mpg, dispFee, otherCosts, speed, stops]);

  const timeStr = (calc) => (calc.days > 0 ? `${calc.days}d ` : "") + `${calc.hrs}h`;

  const timeline = calc ? [
    { icon: "🚛", label: "Drive time", val: `${calc.driveHrs.toFixed(1)}h`, pct: Math.round((calc.driveHrs / calc.totalHrs) * 100) },
    { icon: "⏸️", label: "Stops/rest", val: `${calc.stops.toFixed(1)}h`, pct: Math.round((calc.stops / calc.totalHrs) * 100) },
    { icon: "⏱️", label: "Total time", val: timeStr(calc), pct: 100 },
  ] : [];

  const breakdown = calc ? [
    ["Gross load rate", fmt(calc.lr)],
    ["Miles", `${calc.m.toLocaleString()} mi`],
    ["Rate per mile", `$${calc.rpm.toFixed(2)}/mi`],
    ["Gallons used (est.)", `${calc.gallons.toFixed(1)} gal @ $${calc.d.toFixed(2)}`],
    ["Fuel cost", fmt(calc.fuelCost)],
    ...(calc.dispAmt > 0 ? [[`Dispatch fee (${calc.df}%)`, fmt(calc.dispAmt)]] : []),
    ...(calc.oc > 0 ? [["Other costs (tolls, etc.)", fmt(calc.oc)]] : []),
  ] : [];

  const verdictCls = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-blue-800 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center gap-3">
        <MapPin className="w-7 h-7 text-white" />
        <div>
          <h2 className="text-lg font-bold text-white">Mileage & Route Cost Estimator</h2>
          <p className="text-xs text-blue-100">Enter your route details — results calculate instantly</p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div>
            <label className={labelCls}>📍 Estimated Miles (One Way)</label>
            <input type="number" min="0" step="10" className={fieldCls} value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="e.g. 1250" />
            <p className={hintCls}>Use Google Maps or PC*MILER for exact mileage</p>
          </div>
          <div>
            <label className={labelCls}>💵 Gross Load Rate ($)</label>
            <input type="number" min="0" step="50" className={fieldCls} value={loadRate} onChange={(e) => setLoadRate(e.target.value)} placeholder="e.g. 3200" />
          </div>
          <div>
            <label className={labelCls}>⛽ Diesel Price ($/gal)</label>
            <input type="number" min="0" step="0.01" className={fieldCls} value={diesel} onChange={(e) => setDiesel(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>🚛 Truck MPG</label>
            <input type="number" min="0" step="0.1" className={fieldCls} value={mpg} onChange={(e) => setMpg(e.target.value)} />
            <p className={hintCls}>Average semi-truck: 5.5–7 MPG</p>
          </div>
          <div>
            <label className={labelCls}>📊 Dispatch Fee (%)</label>
            <input type="number" min="0" max="15" step="0.5" className={fieldCls} value={dispFee} onChange={(e) => setDispFee(e.target.value)} placeholder="e.g. 7" />
          </div>
          <div>
            <label className={labelCls}>🧾 Other Costs ($)</label>
            <input type="number" min="0" step="10" className={fieldCls} value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} placeholder="e.g. 150" />
            <p className={hintCls}>Tolls, lumper fees, scale tickets</p>
          </div>
          <div>
            <label className={labelCls}>🏎️ Average Speed (mph)</label>
            <input type="number" min="20" max="75" step="5" className={fieldCls} value={speed} onChange={(e) => setSpeed(e.target.value)} />
            <p className={hintCls}>Include stops — 55 mph is a realistic average</p>
          </div>
          <div>
            <label className={labelCls}>⏸️ Estimated Stops / Rest (hours)</label>
            <input type="number" min="0" step="0.5" className={fieldCls} value={stops} onChange={(e) => setStops(e.target.value)} />
            <p className={hintCls}>HOS requires 30-min break per 8 hrs driving</p>
          </div>
        </div>

        {!calc ? (
          <div className="bg-slate-50 rounded-lg p-10 text-center text-slate-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Enter miles and load rate above to estimate your route costs</p>
          </div>
        ) : (
          <div>
            <hr className="border-slate-100 mb-5" />

            <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-5">
              <div>
                <p className="text-[11px] text-blue-100 font-bold uppercase tracking-wide mb-1.5">Total Miles</p>
                <p className="text-2xl font-bold text-red-500">{calc.m.toLocaleString()} mi</p>
                <p className="text-xs text-slate-300 mt-0.5">one way</p>
              </div>
              <div>
                <p className="text-[11px] text-blue-100 font-bold uppercase tracking-wide mb-1.5">Total Fuel Cost</p>
                <p className="text-2xl font-bold text-red-500">{fmt(calc.fuelCost)}</p>
                <p className="text-xs text-slate-300 mt-0.5">est. at current diesel</p>
              </div>
              <div>
                <p className="text-[11px] text-blue-100 font-bold uppercase tracking-wide mb-1.5">Drive Time</p>
                <p className="text-2xl font-bold text-red-500">{timeStr(calc)}</p>
                <p className="text-xs text-slate-300 mt-0.5">incl. stops</p>
              </div>
              <div>
                <p className="text-[11px] text-blue-100 font-bold uppercase tracking-wide mb-1.5">Net Profit</p>
                <p className="text-2xl font-bold text-red-500">{fmtS(calc.profit)}</p>
                <p className="text-xs text-slate-300 mt-0.5">after all costs</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1.5">Rate Per Mile</p>
                <p className="text-lg font-bold text-blue-800">${calc.rpm.toFixed(2)}/mi</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1.5">Profit Per Mile</p>
                <p className="text-lg font-bold text-blue-800">{fmtS(calc.ppm)}/mi</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1.5">Gallons Used</p>
                <p className="text-lg font-bold text-blue-800">{calc.gallons.toFixed(1)} gal</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-5 mb-5">
              <p className="text-sm font-bold text-blue-800 mb-3.5">🕐 Drive Time Breakdown</p>
              {timeline.map((t) => (
                <div key={t.label} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-xl flex-shrink-0">{t.icon}</span>
                  <span className="text-xs font-bold text-blue-800 min-w-[90px]">{t.label}</span>
                  <div className="flex-1 bg-slate-200 rounded h-2 overflow-hidden">
                    <div className="h-full rounded bg-blue-800" style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 min-w-[60px] text-right">{t.val}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
              <p className="text-sm font-bold text-blue-800 mb-3">Full Cost Breakdown</p>
              {breakdown.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                  <span>{k}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-blue-800 pt-2">
                <span>Net Profit</span>
                <span className={calc.profit >= 0 ? "text-green-600" : "text-red-600"}>{fmtS(calc.profit)}</span>
              </div>
            </div>

            <div className={`rounded-lg p-4 text-sm font-semibold flex items-start gap-3 border ${verdictCls[calc.verdict.color]}`}>
              <span className="text-2xl flex-shrink-0">{calc.verdict.icon}</span>
              <div>{calc.verdict.text}</div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-slate-50 rounded-lg p-5">
          <h3 className="font-bold text-blue-800 text-sm mb-3">🗺️ Major US Trucking Corridors — Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {CORRIDORS.map((c) => (
              <div key={c.lane} className="bg-white rounded-lg p-3.5 border-l-4 border-blue-800">
                <h4 className="text-sm font-bold text-blue-800 mb-1">{c.lane}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{c.info}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-800 rounded-lg p-3.5">
            <p className="text-sm text-blue-800 font-semibold">💡 Pro Tip: Use PC*MILER or Google Maps for exact routing. Always calculate practical miles — not air miles. Practical miles account for truck-restricted routes, weigh stations, and highway access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
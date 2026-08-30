import React, { useState, useMemo } from "react";
import { Truck, DollarSign, Route, Fuel, Receipt, BarChart3, FileText, Calculator, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const FIELDS = [
  { id: "rate", label: "Load Rate ($)", icon: DollarSign, placeholder: "e.g. 3500", min: 0, step: 50 },
  { id: "miles", label: "Miles", icon: Route, placeholder: "e.g. 1200", min: 0, step: 10 },
  { id: "fuel", label: "Fuel cost ($/mile)", icon: Fuel, placeholder: "e.g. 0.55", min: 0, step: 0.01 },
  { id: "expenses", label: "Other expenses ($)", icon: Receipt, placeholder: "e.g. 200", min: 0, step: 10 },
  { id: "dispatchfee", label: "Dispatch fee (%)", icon: BarChart3, placeholder: "e.g. 5", min: 0, max: 100, step: 0.5 },
  { id: "factoringfee", label: "Factoring fee (%)", icon: FileText, placeholder: "e.g. 3", min: 0, max: 100, step: 0.1 },
];

const fmt = (n) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSigned = (n) => (n < 0 ? "-" : "") + fmt(n);

const FAQS = [
  { q: "How do I calculate trucking profit?", a: "Subtract fuel costs, dispatch fees, factoring fees, and other operating expenses from the total load rate." },
  { q: "What is a good profit per mile?", a: "Many owner-operators aim for $0.50–$1.50 profit per mile after all costs. Anything above $1.00/mile on a long haul is generally considered strong." },
  { q: "Why should dispatch fees be included?", a: "Dispatch fees directly affect net revenue and should always be included when evaluating load profitability." },
];

export default function ProfitCalculator() {
  const [vals, setVals] = useState({ rate: "", miles: "", fuel: "", expenses: "", dispatchfee: "", factoringfee: "" });

  const set = (id, v) => setVals((p) => ({ ...p, [id]: v }));

  const result = useMemo(() => {
    const rate = parseFloat(vals.rate) || 0;
    const miles = parseFloat(vals.miles) || 0;
    const fuelPerMile = parseFloat(vals.fuel) || 0;
    const expenses = parseFloat(vals.expenses) || 0;
    const dispPct = parseFloat(vals.dispatchfee) || 0;
    const factPct = parseFloat(vals.factoringfee) || 0;

    const anyInput = rate || miles || fuelPerMile || expenses || dispPct || factPct;
    if (!anyInput) return null;

    const fuelTotal = +(miles * fuelPerMile).toFixed(2);
    const dispTotal = +(rate * (dispPct / 100)).toFixed(2);
    const factTotal = +(rate * (factPct / 100)).toFixed(2);
    const totalCosts = +(fuelTotal + expenses + dispTotal + factTotal).toFixed(2);
    const profit = +(rate - totalCosts).toFixed(2);
    const perMile = miles > 0 ? +(profit / miles).toFixed(2) : 0;
    const margin = rate > 0 ? (profit / rate) * 100 : 0;

    const rows = [];
    if (fuelTotal > 0) rows.push([`Fuel (${miles} mi × $${fuelPerMile.toFixed(2)}/mi)`, fuelTotal]);
    if (dispTotal > 0) rows.push([`Dispatch fee (${dispPct}%)`, dispTotal]);
    if (factTotal > 0) rows.push([`Factoring fee (${factPct}%)`, factTotal]);
    if (expenses > 0) rows.push(["Other expenses", expenses]);

    let verdict;
    if (profit > 0 && margin >= 20) {
      verdict = { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", text: "Strong load — margin above 20%. Worth taking." };
    } else if (profit > 0) {
      verdict = { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", text: "Profitable but thin margin. Negotiate if possible." };
    } else {
      verdict = { icon: XCircle, color: "text-red-600", bg: "bg-red-50", text: "Loss-making load — costs exceed revenue. Decline or renegotiate." };
    }

    return { rate, miles, fuelPerMile, expenses, dispPct, factPct, fuelTotal, dispTotal, factTotal, totalCosts, profit, perMile, margin, rows, verdict };
  }, [vals]);

  const marginClamped = result ? Math.max(0, Math.min(100, result.margin)) : 0;

  return (
    <div id="profit-calculator" className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" style={{ fontFamily: "'Poppins', Arial, sans-serif" }}>
      <div className="flex items-center gap-3 mb-6">
        <Truck className="w-7 h-7 text-blue-700" />
        <div>
          <p className="font-semibold text-lg text-slate-900 m-0">Dispatch Profit Calculator</p>
          <p className="text-sm text-slate-500 m-0">Calculate your net profit per load</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.id}>
              <label className="text-sm text-slate-500 flex items-center gap-1.5 mb-1.5">
                <Icon className="w-4 h-4" /> {f.label}
              </label>
              <input
                type="number"
                value={vals[f.id]}
                onChange={(e) => set(f.id, e.target.value)}
                placeholder={f.placeholder}
                min={f.min}
                max={f.max}
                step={f.step}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          );
        })}
      </div>

      {!result ? (
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <Calculator className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 m-0">Fill in the fields above to see your profit</p>
        </div>
      ) : (
        <div>
          <div className="border-t border-slate-100 pt-5 mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <Stat label="Gross revenue" value={fmt(result.rate)} />
            <Stat label="Total costs" value={fmt(result.totalCosts)} />
            <div className={`rounded-lg p-3 border ${result.profit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-slate-500 mb-1">Net profit</p>
              <p className={`text-xl font-semibold m-0 ${result.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtSigned(result.profit)}</p>
            </div>
            <Stat label="Profit/mile" value={result.miles > 0 ? `${fmtSigned(result.perMile)}/mi` : "—"} />
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Profit margin</span>
              <span>{result.margin.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-100 rounded h-2 overflow-hidden">
              <div
                className={`h-full rounded transition-all ${result.profit >= 0 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${marginClamped}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-slate-900 mb-2.5">Cost breakdown</p>
            <div className="flex flex-col gap-1.5 text-sm">
              {result.rows.map((r, i) => (
                <div key={i} className="flex justify-between text-slate-500 border-b border-slate-100 pb-1">
                  <span>{r[0]}</span>
                  <span className="text-slate-900">{fmt(r[1])}</span>
                </div>
              ))}
              {result.rows.length > 0 && (
                <div className="flex justify-between font-medium pt-1">
                  <span className="text-slate-900">Total costs</span>
                  <span className="text-slate-900">{fmt(result.totalCosts)}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-lg p-3 px-4 flex items-center gap-2 text-sm ${result.verdict.bg}`}>
            <result.verdict.icon className={`w-5 h-5 ${result.verdict.color}`} />
            <span className={result.verdict.color}>{result.verdict.text}</span>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 mt-8 pt-6">
        <p className="text-lg font-medium text-slate-900 mb-5">Frequently asked questions</p>
        <div className="flex flex-col">
          {FAQS.map((faq, i) => (
            <div key={i} className={`py-4 ${i < FAQS.length - 1 ? "border-b border-slate-100" : ""}`}>
              <p className="text-sm font-medium text-slate-900 mb-1.5">{faq.q}</p>
              <p className="text-sm text-slate-500 leading-relaxed m-0">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-slate-900 m-0">{value}</p>
    </div>
  );
}
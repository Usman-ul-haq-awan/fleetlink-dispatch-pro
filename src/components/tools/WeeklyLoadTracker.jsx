import React, { useState, useEffect, useMemo } from "react";
import { ClipboardList, Plus, Trash2, X } from "lucide-react";

const fieldCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5";

const STATUSES = ["Booked", "In Transit", "Delivered", "Invoiced"];
const STATUS_CLS = {
  "Booked": "bg-red-100 text-red-700",
  "In Transit": "bg-amber-100 text-amber-700",
  "Delivered": "bg-green-100 text-green-700",
  "Invoiced": "bg-blue-100 text-blue-700",
};

const STORAGE_KEY = "fleetlink_weekly_loads";

function fmt(n) {
  return "$" + Math.abs(parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyForm = { carrier: "", ref: "", origin: "", dest: "", miles: "", rate: "", comm: "", status: "Booked" };

export default function WeeklyLoadTracker() {
  const [loads, setLoads] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loads));
    } catch {}
  }, [loads]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const addLoad = () => {
    const miles = parseFloat(form.miles) || 0;
    const rate = parseFloat(form.rate) || 0;
    const comm = parseFloat(form.comm) || 0;
    const commAmt = parseFloat((rate * (comm / 100)).toFixed(2));
    const rpm = miles > 0 ? parseFloat((rate / miles).toFixed(2)) : 0;
    setLoads((prev) => [...prev, {
      carrier: form.carrier || "Unknown Carrier",
      ref: form.ref || "—",
      origin: form.origin || "—",
      dest: form.dest || "—",
      miles, rate, comm, commAmt, rpm,
      status: form.status,
    }]);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const deleteLoad = (i) => setLoads((prev) => prev.filter((_, idx) => idx !== i));

  const clearAll = () => {
    if (loads.length === 0) return;
    if (window.confirm("Clear all loads and reset the tracker?")) setLoads([]);
  };

  const summary = useMemo(() => {
    const totalMiles = loads.reduce((a, l) => a + l.miles, 0);
    const totalGross = loads.reduce((a, l) => a + l.rate, 0);
    const totalComm = loads.reduce((a, l) => a + l.commAmt, 0);
    const avgRPM = totalMiles > 0 ? totalGross / totalMiles : 0;
    const carriers = new Set(loads.map((l) => l.carrier)).size;
    return { totalLoads: loads.length, totalMiles, totalGross, totalComm, avgRPM, carriers };
  }, [loads]);

  const carrierChart = useMemo(() => {
    const map = {};
    loads.forEach((l) => { map[l.carrier] = (map[l.carrier] || 0) + l.rate; });
    const max = Math.max(...Object.values(map), 0);
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, val]) => ({ name, val, pct: max > 0 ? Math.round((val / max) * 100) : 0 }));
  }, [loads]);

  const canSave = form.carrier && form.rate && form.comm;

  return (
    <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-blue-800 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-white" />
          <div>
            <h2 className="text-lg font-bold text-white">Weekly Load Tracker</h2>
            <p className="text-xs text-blue-100">
              {summary.totalLoads > 0
                ? `${summary.totalLoads} load${summary.totalLoads > 1 ? "s" : ""} tracked this week — ${fmt(summary.totalComm)} commission earned`
                : 'Click "Add Load" to log your first load this week'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-white hover:text-red-600 text-white text-xs font-bold px-5 py-2 rounded-full border-2 border-red-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Load
          </button>
          <button onClick={clearAll} className="flex items-center gap-1.5 bg-transparent text-white text-xs font-bold px-5 py-2 rounded-full border-2 border-white/40 hover:bg-white/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-5 bg-slate-50 border-b border-slate-200">
        <div className="bg-white rounded-lg p-3.5 text-center shadow-sm">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Total Loads</p>
          <p className="text-xl font-bold text-blue-800">{summary.totalLoads}</p>
        </div>
        <div className="bg-white rounded-lg p-3.5 text-center shadow-sm">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Total Miles</p>
          <p className="text-xl font-bold text-blue-800">{summary.totalMiles.toLocaleString()} mi</p>
        </div>
        <div className="bg-white rounded-lg p-3.5 text-center shadow-sm">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Gross Revenue</p>
          <p className="text-xl font-bold text-blue-800">{fmt(summary.totalGross)}</p>
        </div>
        <div className="bg-white rounded-lg p-3.5 text-center shadow-sm">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">My Commission</p>
          <p className="text-xl font-bold text-red-600">{fmt(summary.totalComm)}</p>
        </div>
        <div className="bg-white rounded-lg p-3.5 text-center shadow-sm">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Avg Rate/Mile</p>
          <p className="text-xl font-bold text-blue-800">${summary.avgRPM.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-3.5 text-center shadow-sm">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Carriers Active</p>
          <p className="text-xl font-bold text-blue-800">{summary.carriers}</p>
        </div>
      </div>

      {formOpen && (
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-blue-800 mb-3">➕ Log a New Load</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className={labelCls}>Carrier Name</label><input className={fieldCls} value={form.carrier} onChange={set("carrier")} placeholder="Swift Freight" /></div>
            <div><label className={labelCls}>Load Ref #</label><input className={fieldCls} value={form.ref} onChange={set("ref")} placeholder="LOAD-001" /></div>
            <div><label className={labelCls}>Origin</label><input className={fieldCls} value={form.origin} onChange={set("origin")} placeholder="Dallas, TX" /></div>
            <div><label className={labelCls}>Destination</label><input className={fieldCls} value={form.dest} onChange={set("dest")} placeholder="Chicago, IL" /></div>
            <div><label className={labelCls}>Miles</label><input type="number" min="0" className={fieldCls} value={form.miles} onChange={set("miles")} placeholder="920" /></div>
            <div><label className={labelCls}>Gross Rate ($)</label><input type="number" min="0" className={fieldCls} value={form.rate} onChange={set("rate")} placeholder="2800" /></div>
            <div><label className={labelCls}>Comm %</label><input type="number" min="0" max="15" step="0.5" className={fieldCls} value={form.comm} onChange={set("comm")} placeholder="7" /></div>
            <div><label className={labelCls}>Status</label><select className={fieldCls} value={form.status} onChange={set("status")}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex gap-2">
            <button onClick={addLoad} disabled={!canSave} className="bg-blue-800 hover:bg-red-600 text-white text-xs font-bold px-7 py-2.5 rounded-full disabled:opacity-50 transition-colors">✅ Save Load</button>
            <button onClick={() => setFormOpen(false)} className="bg-transparent text-slate-500 text-xs font-bold px-5 py-2.5 rounded-full border-2 border-slate-300 hover:bg-slate-100 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {carrierChart.length > 0 && (
        <div className="px-6 pt-5">
          <p className="text-sm font-bold text-blue-800 mb-3.5">📈 Revenue by Carrier This Week</p>
          <div className="flex flex-col gap-2">
            {carrierChart.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-semibold min-w-[120px] truncate">{c.name}</span>
                <div className="flex-1 bg-slate-200 rounded h-2.5 overflow-hidden">
                  <div className="h-full rounded bg-blue-800 transition-all" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-blue-800 min-w-[70px] text-right">{fmt(c.val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 overflow-x-auto">
        {loads.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No loads logged yet. Click <strong>Add Load</strong> above to start tracking your week.</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["#", "Carrier", "Ref", "Route", "Miles", "Gross Rate", "Comm %", "My Comm", "$/Mile", "Status", ""].map((h) => (
                  <th key={h} className="bg-blue-800 text-white text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loads.map((l, i) => (
                <tr key={i} className="even:bg-slate-50 hover:bg-blue-50">
                  <td className="px-3 py-2.5 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{l.carrier}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{l.ref}</td>
                  <td className="px-3 py-2.5 text-slate-600 max-w-[160px] truncate">{l.origin} → {l.dest}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{l.miles.toLocaleString()} mi</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmt(l.rate)}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{l.comm}%</td>
                  <td className={`px-3 py-2.5 font-bold whitespace-nowrap ${l.commAmt >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(l.commAmt)}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">${l.rpm.toFixed(2)}/mi</td>
                  <td className="px-3 py-2.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_CLS[l.status]}`}>{l.status}</span></td>
                  <td className="px-3 py-2.5"><button onClick={() => deleteLoad(i)} className="text-red-600 hover:bg-red-50 rounded p-1.5 transition-colors"><X className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
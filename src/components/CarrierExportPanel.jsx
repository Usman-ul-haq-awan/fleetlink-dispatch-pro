import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2, Database, CalendarRange, Inbox } from "lucide-react";

// Builds flat rows for the spreadsheet from a list of carrier records.
const buildExportRows = (list) => list.map(c => ({
  "Staff Lead Status": Array.isArray(c.staff_lead_status) ? c.staff_lead_status.join(", ") : (c.staff_lead_status || ""),
  "Staff Comment": c.staff_comment || "",
  "Allocated On": c.assigned_date || "",
  "Legal Name": c.legal_name || "",
  "DBA Name": c.dba_name || "",
  "USDOT": c.usdot_number || "",
  "MC": c.mc_number || "",
  "MX": c.mx_number || "",
  "Operating Status": c.operating_status || "",
  "State": c.state || "",
  "City": c.city || "",
  "Phone": c.phone || "",
  "Email": c.email || "",
  "Owner": c.owner_name || "",
  "Power Units": c.power_units ?? "",
  "Drivers": c.drivers ?? "",
  "Equipment": c.equipment_types || "",
  "Cargo Types": c.cargo_types || "",
  "Safety Qualification": c.safety_qualification || "",
  "Safety Rating": c.safety_rating || "",
  "Lead Score": c.lead_score ?? "",
  "Lead Status": c.lead_status || "",
  "Last Researched": c.last_researched_at || "",
}));

const downloadRows = (rows, name) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.min(Math.max(k.length + 2, 12), 40) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Carriers");
  XLSX.writeFile(wb, `${name}_${Date.now()}.xlsx`);
};

export default function CarrierExportPanel({ carriers }) {
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [busy, setBusy] = useState(null); // "all" | "range" | "unassigned"

  // Export the COMPLETE loaded database — every carrier currently in the list,
  // regardless of allocation date. This is the one to use when you want all
  // 3,555 records in a single file.
  const exportAll = () => {
    if (carriers.length === 0) {
      alert("No carriers to export.");
      return;
    }
    setBusy("all");
    try {
      downloadRows(buildExportRows(carriers), "carriers_all");
    } finally {
      setBusy(null);
    }
  };

  // Export carriers allocated within a date range. With no dates selected,
  // exports ALL assigned carriers (the full scraped set) — no limit.
  const exportRange = () => {
    const inRange = carriers.filter((c) => {
      if (!c.assigned_date) return false;
      const d = c.assigned_date.split("T")[0];
      if (exportFrom && d < exportFrom) return false;
      if (exportTo && d > exportTo) return false;
      return true;
    });
    if (inRange.length === 0) {
      alert("No assigned carriers found for the selected range.");
      return;
    }
    setBusy("range");
    try {
      const label = exportFrom || exportTo
        ? `${exportFrom || "start"}_to_${exportTo || "end"}`
        : "all_assigned";
      downloadRows(buildExportRows(inRange), `carriers_${label}`);
    } finally {
      setBusy(null);
    }
  };

  // Export carriers not yet allocated to a sales agent (no assigned_date).
  const exportUnassigned = () => {
    const unassigned = carriers.filter((c) => !c.assigned_date);
    if (unassigned.length === 0) {
      alert("No unassigned carriers to export.");
      return;
    }
    setBusy("unassigned");
    try {
      downloadRows(buildExportRows(unassigned), "carriers_unassigned");
    } finally {
      setBusy(null);
    }
  };

  const assignedCount = carriers.filter((c) => c.assigned_date).length;
  const unassignedCount = carriers.length - assignedCount;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Export Complete Database
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Downloads all <strong>{carriers.length.toLocaleString()}</strong> carriers currently loaded in the database as a single Excel file — assigned and unassigned together.
            </p>
          </div>
          <button onClick={exportAll} disabled={busy === "all" || carriers.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {busy === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export All ({carriers.length.toLocaleString()})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export by allocation date range */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <CalendarRange className="w-5 h-5 text-emerald-600" />
            Export by Allocation Range
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Leave dates empty to export <strong>all {assignedCount.toLocaleString()} assigned carriers</strong>, or pick a range to narrow it down.
          </p>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Start</label>
              <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                className="px-2.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">End</label>
              <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
                className="px-2.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button onClick={exportRange} disabled={busy === "range" || carriers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {busy === "range" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Export Range
            </button>
          </div>
        </div>

        {/* Export unassigned */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <Inbox className="w-5 h-5 text-teal-600" />
            Export Unassigned
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Carriers not yet allocated to any sales agent. <strong>{unassignedCount.toLocaleString()}</strong> unassigned carriers available.
          </p>
          <button onClick={exportUnassigned} disabled={busy === "unassigned" || carriers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            {busy === "unassigned" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export Unassigned ({unassignedCount.toLocaleString()})
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Tip: Export All includes every carrier. Use Export Range or Export Unassigned when you only need a slice. Apply filters on the Carriers tab first to narrow any export.
      </p>
    </div>
  );
}
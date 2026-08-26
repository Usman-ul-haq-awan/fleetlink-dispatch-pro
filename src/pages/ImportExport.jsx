import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

const FIELD_OPTIONS = [
  { value: "usdot_number", label: "USDOT Number" },
  { value: "mc_number", label: "MC Number" },
  { value: "legal_name", label: "Legal Name / Company Name" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "state", label: "State" },
  { value: "equipment_types", label: "Equipment Type" },
  { value: "city", label: "City" },
  { value: "owner_name", label: "Owner Name" },
  { value: "_skip", label: "— Skip this column —" },
];

function autoDetectColumn(header) {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  if (h.includes("usdot") || h === "dot" || h.includes("dotnumber")) return "usdot_number";
  if (h.includes("mc") && h.length <= 5) return "mc_number";
  if (h.includes("name") || h.includes("company") || h.includes("carrier")) return "legal_name";
  if (h.includes("phone") || h.includes("tel")) return "phone";
  if (h.includes("email") || h.includes("mail")) return "email";
  if (h.includes("state")) return "state";
  if (h.includes("equipment") || h.includes("trailer") || h.includes("truck")) return "equipment_types";
  if (h.includes("city")) return "city";
  if (h.includes("owner")) return "owner_name";
  return "_skip";
}

export default function ImportExport() {
  const [tab, setTab] = useState("import");
  const [parsedData, setParsedData] = useState(null);
  const [columnMap, setColumnMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    setFileName(file.name);
    setImportResult(null);

    let parsed;
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (aoa.length === 0) { setParsedData({ headers: [], rows: [] }); return; }
      const headers = aoa[0].map(h => String(h).trim());
      const rows = aoa.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = String(r[i] ?? "").trim(); });
        return obj;
      });
      parsed = { headers, rows };
    } else {
      const text = await file.text();
      parsed = parseCSV(text);
    }

    setParsedData(parsed);
    const autoMap = {};
    parsed.headers.forEach(h => { autoMap[h] = autoDetectColumn(h); });
    setColumnMap(autoMap);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    setImportResult(null);

    try {
      const carriers = parsedData.rows.map(row => {
        const carrier = { carrier_id: crypto.randomUUID(), lead_status: "Imported", safety_qualification: "Not Assessed" };
        Object.entries(columnMap).forEach(([csvCol, field]) => {
          if (field && field !== "_skip" && row[csvCol]) {
            carrier[field] = row[csvCol];
          }
        });
        return carrier;
      });

      const existingCarriers = await base44.entities.Carrier.list("-updated_date", 500);
      const existingUsdots = new Set(existingCarriers.map(c => c.usdot_number).filter(Boolean));
      const existingMcs = new Set(existingCarriers.map(c => c.mc_number).filter(Boolean));

      const newCarriers = [];
      const duplicates = [];
      const missingUsdot = [];
      const missingMc = [];

      for (const c of carriers) {
        if (c.usdot_number && existingUsdots.has(c.usdot_number)) { duplicates.push(c); continue; }
        if (c.mc_number && existingMcs.has(c.mc_number)) { duplicates.push(c); continue; }
        if (!c.usdot_number) missingUsdot.push(c);
        if (!c.mc_number) missingMc.push(c);
        newCarriers.push(c);
      }

      const BATCH = 50;
      for (let i = 0; i < newCarriers.length; i += BATCH) {
        await base44.entities.Carrier.bulkCreate(newCarriers.slice(i, i + BATCH));
      }

      await base44.entities.ImportBatch.create({
        batch_name: fileName || "Import",
        file_name: fileName,
        total_records: carriers.length,
        duplicates_found: duplicates.length,
        missing_usdot: missingUsdot.length,
        missing_mc: missingMc.length,
        invalid_records: 0,
        imported_count: newCarriers.length,
        status: "Completed",
        created_at: new Date().toISOString(),
      });

      await base44.entities.ActivityLog.create({
        action: "Carrier import completed",
        workflow: "ImportExport",
        details: `Imported ${newCarriers.length} carriers, ${duplicates.length} duplicates, ${missingUsdot.length} missing USDOT`,
        status: "Success",
        timestamp: new Date().toISOString(),
      });

      setImportResult({
        total: carriers.length,
        imported: newCarriers.length,
        duplicates: duplicates.length,
        missingUsdot: missingUsdot.length,
        missingMc: missingMc.length,
      });
      setParsedData(null);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke("exportCarriers", {});
      const csv = res.data.csv;
      const baseName = (res.data.filename || "carriers_export.csv").replace(/\.csv$/, "");
      const parsed = parseCSV(csv);
      const allRows = [parsed.headers, ...parsed.rows.map(r => parsed.headers.map(h => r[h] ?? ""))];

      if (format === "excel") {
        const ws = XLSX.utils.aoa_to_sheet(allRows);
        ws["!cols"] = parsed.headers.map((h, i) => {
          const maxLen = Math.max(String(h).length, ...allRows.slice(1).map(r => String(r[i] ?? "").length));
          return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Carriers");
        XLSX.writeFile(wb, `${baseName}.xlsx`);
      } else {
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert("Export failed: " + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Import / Export</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("import")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "import" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
          Import Carriers
        </button>
        <button onClick={() => setTab("export")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "export" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
          Export Carriers
        </button>
      </div>

      {tab === "import" && (
        <div className="space-y-4">
          {!parsedData && !importResult && (
            <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">Upload a CSV or Excel file with carrier data</p>
              <p className="text-xs text-slate-400 mb-4">Supports .csv, .xlsx, .xls — columns: USDOT, MC, Company Name, Phone, Email, State, Equipment</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Select File
              </button>
            </div>
          )}

          {parsedData && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{fileName}</h2>
                  <p className="text-sm text-slate-500">{parsedData.rows.length} records found</p>
                </div>
                <button onClick={() => setParsedData(null)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Column Mapping</h3>
                <div className="space-y-2">
                  {parsedData.headers.map(header => (
                    <div key={header} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-40 truncate">{header}</span>
                      <span className="text-slate-300">→</span>
                      <select value={columnMap[header] || "_skip"} onChange={e => setColumnMap({...columnMap, [header]: e.target.value})}
                        className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg">
                        {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="text-xs text-slate-400">Sample: {parsedData.rows[0]?.[header] || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      {parsedData.headers.slice(0, 6).map(h => <th key={h} className="text-left px-3 py-2 font-medium text-slate-600">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {parsedData.headers.slice(0, 6).map(h => <td key={h} className="px-3 py-2 text-slate-600 max-w-xs truncate">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={handleImport} disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Importing..." : `Import ${parsedData.rows.length} Carriers`}
              </button>
            </div>
          )}

          {importResult && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-slate-900">Import Complete</h2>
              </div>
              {importResult.error ? (
                <p className="text-red-600 text-sm">{importResult.error}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-900">{importResult.total}</p>
                    <p className="text-xs text-slate-500">Total Records</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                    <p className="text-xs text-slate-500">Imported</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-amber-700">{importResult.duplicates}</p>
                    <p className="text-xs text-slate-500">Duplicates</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-red-700">{importResult.missingUsdot}</p>
                    <p className="text-xs text-slate-500">Missing USDOT</p>
                  </div>
                </div>
              )}
              <button onClick={() => setImportResult(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Import Another File
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "export" && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <Download className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <h2 className="font-semibold text-slate-900 mb-2">Export Carrier Database</h2>
          <p className="text-sm text-slate-500 mb-4">Download all carrier data as a CSV file with separate columns for every field.</p>
          <p className="text-xs text-slate-400 mb-4">Includes: Carrier Name, DBA, USDOT, MC, MX, Status, Address, Phone, Fax, Email, Owner, Contact, Power Units, Drivers, Cargo, Equipment, Safety Qualification, Lead Score, Source URLs, and more.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => handleExport("csv")} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export to CSV
            </button>
            <button onClick={() => handleExport("excel")} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Export to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
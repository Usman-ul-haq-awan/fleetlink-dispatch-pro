import React from "react";
import { Calculator } from "lucide-react";
import ToolsPanel from "@/components/tools/ToolsPanel";

export default function Tools() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          Dispatch Tools
        </h1>
        <p className="text-slate-500 text-sm mt-1">Free calculators to evaluate loads and estimate your dispatching income.</p>
      </div>
      <ToolsPanel />
    </div>
  );
}
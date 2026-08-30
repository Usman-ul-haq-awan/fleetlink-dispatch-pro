import React from "react";
import ToolsSlider from "@/components/tools/ToolsSlider";
import ProfitCalculator from "@/components/tools/ProfitCalculator";

export default function DispatchTools() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ToolsSlider />
      <div id="tools" className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Free Dispatcher Tools</h2>
          <p className="text-slate-500 text-sm mt-1">Built by Tycoon Dispatch Academy — 100% free, no sign-up required.</p>
        </div>
        <ProfitCalculator />
      </div>
    </div>
  );
}
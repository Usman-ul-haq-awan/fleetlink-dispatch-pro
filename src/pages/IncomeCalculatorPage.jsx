import React from "react";
import IncomeSlider from "@/components/tools/IncomeSlider";
import IncomeCalculator from "@/components/tools/IncomeCalculator";
import IncomeContent from "@/components/tools/IncomeContent";

export default function IncomeCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <IncomeSlider />
      <div className="bg-gradient-to-br from-[#0a2a6e] via-[#0d3080] to-[#0a2a6e] py-11 px-5 text-center">
        <span className="inline-block bg-red-600 text-white text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wider">💰 Free Dispatcher Tool</span>
        <h1 className="text-2xl md:text-4xl font-black text-white mb-3.5 leading-tight">Dispatcher <span className="text-red-500">Income Calculator</span></h1>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">Find out exactly how much you can earn as a truck dispatcher. Based on trucks under you, average load rate, loads per week and your commission percentage. See monthly, annual and PKR equivalent instantly.</p>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <IncomeCalculator />
        <IncomeContent />
      </div>
    </div>
  );
}
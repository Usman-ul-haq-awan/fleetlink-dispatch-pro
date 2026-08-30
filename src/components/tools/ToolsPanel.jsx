import React, { useState } from "react";
import { Calculator, Wallet, FileText, Fuel } from "lucide-react";
import ProfitCalculator from "@/components/tools/ProfitCalculator";
import IncomeCalculator from "@/components/tools/IncomeCalculator";
import InvoiceGenerator from "@/components/tools/InvoiceGenerator";
import FuelSurchargeCalculator from "@/components/tools/FuelSurchargeCalculator";

const TABS = [
  { id: "profit", label: "Profit Calculator", icon: Calculator, Component: ProfitCalculator },
  { id: "income", label: "Income Calculator", icon: Wallet, Component: IncomeCalculator },
  { id: "invoice", label: "Invoice Generator", icon: FileText, Component: InvoiceGenerator },
  { id: "fuel", label: "Fuel Surcharge", icon: Fuel, Component: FuelSurchargeCalculator },
];

export default function ToolsPanel() {
  const [active, setActive] = useState("profit");
  const Active = TABS.find((t) => t.id === active).Component;

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      <Active />
    </div>
  );
}
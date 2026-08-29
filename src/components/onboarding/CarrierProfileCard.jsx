import React from "react";
import { Truck } from "lucide-react";

export default function CarrierProfileCard({ carrier }) {
  if (!carrier) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-400">
        Carrier data not found
      </div>
    );
  }

  const fields = [
    { label: "Legal Name", value: carrier.legal_name },
    { label: "DBA", value: carrier.dba_name },
    { label: "USDOT", value: carrier.usdot_number },
    { label: "MC Number", value: carrier.mc_number },
    { label: "Operating Status", value: carrier.operating_status },
    {
      label: "Address",
      value: [carrier.address, carrier.city, carrier.state, carrier.zip].filter(Boolean).join(", "),
    },
    { label: "Phone", value: carrier.phone },
    { label: "Email", value: carrier.email },
    { label: "Website", value: carrier.website },
    { label: "Owner", value: carrier.owner_name },
    { label: "Contact Name", value: carrier.contact_name },
    { label: "Power Units", value: carrier.power_units },
    { label: "Drivers", value: carrier.drivers },
    { label: "Equipment", value: carrier.equipment_types },
    { label: "Cargo Types", value: carrier.cargo_types },
    { label: "Safety Qualification", value: carrier.safety_qualification },
    { label: "Safety Rating", value: carrier.safety_rating },
    { label: "Lead Score", value: carrier.lead_score },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Truck className="w-5 h-5 text-blue-600" />
        Carrier Profile
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {fields
          .filter((f) => f.value !== undefined && f.value !== null && f.value !== "")
          .map((f) => (
            <div key={f.label}>
              <p className="text-xs text-slate-400">{f.label}</p>
              <p className="text-sm text-slate-800 font-medium break-words">
                {f.value || "—"}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
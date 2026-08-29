import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import CarrierProfileCard from "./CarrierProfileCard";
import DocumentUpload from "./DocumentUpload";
import { FileText, ShieldCheck } from "lucide-react";

const DOCUMENTS = [
  { key: "mc_authority", label: "MC Authority Certificate" },
  { key: "coi", label: "Certificate of Insurance (COI)" },
  { key: "w9", label: "W-9 Form" },
  { key: "void_check", label: "Void Check (Direct Pay Setup)" },
  { key: "notice_of_assignment", label: "Notice of Assignment (Factoring)" },
  { key: "setup_packet", label: "Signed Setup Packet / Service Agreement" },
];

export default function OnboardingDetail({ record, carrier, onReload }) {
  const [usesFactoring, setUsesFactoring] = useState(record.uses_factoring || false);

  const toggleFactoring = async (val) => {
    setUsesFactoring(val);
    try {
      await base44.entities.Onboarding.update(record.id, {
        uses_factoring: val,
        updated_at: new Date().toISOString(),
      });
      onReload();
    } catch (err) {
      console.error("Toggle factoring failed:", err);
    }
  };

  const visibleDocs = DOCUMENTS.filter((d) => {
    if (d.key === "void_check" && usesFactoring) return false;
    if (d.key === "notice_of_assignment" && !usesFactoring) return false;
    return true;
  });

  const uploadedCount = visibleDocs.filter((d) => record[`${d.key}_url`]).length;

  return (
    <div className="space-y-4">
      <CarrierProfileCard carrier={carrier} />

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Onboarding Documents
          </h3>
          <span className="text-xs font-medium text-slate-500">
            {uploadedCount}/{visibleDocs.length} uploaded
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Upload the required documents to complete onboarding.
        </p>

        <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <input
            type="checkbox"
            id={`factoring-${record.id}`}
            checked={usesFactoring}
            onChange={(e) => toggleFactoring(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label
            htmlFor={`factoring-${record.id}`}
            className="text-sm text-slate-700 cursor-pointer"
          >
            Carrier uses factoring (requires Notice of Assignment instead of Void Check)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleDocs.map((d) => (
            <DocumentUpload
              key={d.key}
              label={d.label}
              docUrl={record[`${d.key}_url`]}
              docName={record[`${d.key}_name`]}
              recordId={record.id}
              fieldUrl={`${d.key}_url`}
              fieldName={`${d.key}_name`}
              onUploaded={onReload}
            />
          ))}
        </div>

        {uploadedCount === visibleDocs.length && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              All required documents uploaded — carrier is ready for dispatch!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
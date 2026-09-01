import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Target, XCircle, Clock, UserCheck, Voicemail, PhoneOff, CheckCircle, Circle, StickyNote } from "lucide-react";
import LeadQualificationFields from "@/components/LeadQualificationFields";

const STATUS_OPTIONS = [
  { value: "Not Approached", label: "Not Approached", icon: Circle, activeClass: "bg-slate-500 text-white border-slate-500", inactiveClass: "text-slate-700 border-slate-300 hover:bg-slate-100" },
  { value: "Approached", label: "Approached", icon: CheckCircle, activeClass: "bg-emerald-600 text-white border-emerald-600", inactiveClass: "text-emerald-700 border-emerald-200 hover:bg-emerald-50" },
  { value: "Lead", label: "Lead", icon: Target, activeClass: "bg-blue-600 text-white border-blue-600", inactiveClass: "text-blue-700 border-blue-200 hover:bg-blue-50" },
  { value: "Dead Lead", label: "Dead Lead", icon: XCircle, activeClass: "bg-red-600 text-white border-red-600", inactiveClass: "text-red-700 border-red-200 hover:bg-red-50" },
  { value: "Follow-up", label: "Follow-up", icon: Clock, activeClass: "bg-amber-500 text-white border-amber-500", inactiveClass: "text-amber-700 border-amber-200 hover:bg-amber-50" },
  { value: "Voicemail Left", label: "Voicemail Left", icon: Voicemail, activeClass: "bg-cyan-600 text-white border-cyan-600", inactiveClass: "text-cyan-700 border-cyan-200 hover:bg-cyan-50" },
  { value: "Hangup", label: "Hangup", icon: PhoneOff, activeClass: "bg-slate-600 text-white border-slate-600", inactiveClass: "text-slate-700 border-slate-300 hover:bg-slate-100" },
  { value: "Onboard", label: "Onboard", icon: UserCheck, activeClass: "bg-green-600 text-white border-green-600", inactiveClass: "text-green-700 border-green-200 hover:bg-green-50" },
];

// Normalize stored value into an array of status strings.
const normalizeStatuses = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

export default function StaffLeadBar({ carrier, existingOnboarding, onUpdated }) {
  const [setting, setSetting] = useState(null);
  const [noteInput, setNoteInput] = useState(carrier.staff_comment || "");
  const [savingNote, setSavingNote] = useState(false);
  const selected = normalizeStatuses(carrier.staff_lead_status);

  const saveNote = async () => {
    const text = noteInput;
    if (text === (carrier.staff_comment || "")) return;
    setSavingNote(true);
    try {
      await base44.entities.Carrier.update(carrier.id, {
        staff_comment: text,
        staff_comment_date: new Date().toISOString(),
        // Normalize legacy single-string values to array so schema validation passes
        staff_lead_status: normalizeStatuses(carrier.staff_lead_status),
      });
      onUpdated();
    } catch (err) {
      alert("Failed to save note: " + (err.message || ""));
    } finally {
      setSavingNote(false);
    }
  };

  // Keep the textarea in sync when the carrier reloads externally
  useEffect(() => {
    setNoteInput(carrier.staff_comment || "");
  }, [carrier.staff_comment]);

  const handleToggle = async (status) => {
    setSetting(status);
    try {
      let next;
      if (selected.includes(status)) {
        next = selected.filter(s => s !== status);
      } else {
        next = [...selected, status];
      }

      const updates = { staff_lead_status: next };

      // Onboard special handling: if "Onboard" is being added, set lead_status
      // and create an onboarding record if none exists.
      if (status === "Onboard" && next.includes("Onboard")) {
        updates.lead_status = "Onboarding";
        if (!existingOnboarding) {
          await base44.entities.Onboarding.create({
            carrier_id: carrier.id,
            onboarding_status: "New",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      await base44.entities.Carrier.update(carrier.id, updates);
      onUpdated();
    } catch (err) {
      alert("Failed to update lead status: " + (err.message || ""));
    } finally {
      setSetting(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Mark as:</span>
        {STATUS_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              disabled={setting !== null}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                isActive ? opt.activeClass : opt.inactiveClass
              }`}
            >
              {setting === opt.value ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Selected statuses display */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500">Selected statuses: </span>
        {selected.length === 0 ? (
          <span className="text-xs text-slate-400">None</span>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {selected.map(status => {
              const opt = STATUS_OPTIONS.find(o => o.value === status);
              const cls = opt ? opt.activeClass : "bg-slate-100 text-slate-700 border-slate-300";
              return (
                <span key={status} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
                  {status}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes — synced with carrier database staff_comment */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5" />
          Approach note (shared with carrier database)
        </label>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onBlur={saveNote}
          placeholder="Write approach result / note..."
          rows={2}
          className="w-full mt-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {savingNote && <p className="text-[10px] text-blue-500 mt-0.5">Saving...</p>}
      </div>

      <LeadQualificationFields carrier={carrier} onUpdated={onUpdated} />
    </div>
  );
}
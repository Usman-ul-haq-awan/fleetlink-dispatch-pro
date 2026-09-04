import React, { useState } from "react";
import { Mail, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { STANDALONE_EMAILS, SEQUENCES, UNIVERSAL_FOLLOWUPS, OBJECTION_RESPONSES } from "@/data/emailTemplates";

// Browser for every email template available to the sales team. Selecting a
// template calls onSelect with its subject + body so the parent can populate
// the editor and substitute carrier placeholders.
const GROUPS = [
  { id: "standalone", label: "Standalone Cold Emails", items: STANDALONE_EMAILS.map(e => ({ id: e.id, name: e.name, target: e.target, subject: e.subject, body: e.body })) },
  { id: "sequences", label: "Multi-Email Sequences", items: SEQUENCES.flatMap(s => s.emails.map((e, i) => ({ id: `${s.id}_step${i}`, name: `${s.name} — Step ${i + 1}`, target: s.target, subject: e.subject, body: e.body }))) },
  { id: "followups", label: "Universal Follow-ups", items: UNIVERSAL_FOLLOWUPS.map(f => ({ id: f.id, name: f.name, target: `Day ${f.day} follow-up`, subject: f.subject, body: f.body })) },
  { id: "objections", label: "Objection Responses", items: OBJECTION_RESPONSES.map(o => ({ id: o.id, name: o.scenario, target: "Objection response", subject: o.subject, body: o.body })) },
];

export default function TemplatePicker({ onSelect }) {
  const [open, setOpen] = useState("standalone");
  const [query, setQuery] = useState("");

  const filterItems = (items) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.subject || "").toLowerCase().includes(q) ||
      (i.target || "").toLowerCase().includes(q)
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-violet-600" />
        Template Library
      </h3>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search templates..."
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 mb-3"
      />
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {GROUPS.map(group => {
          const items = filterItems(group.items);
          if (query && items.length === 0) return null;
          const isOpen = open === group.id;
          return (
            <div key={group.id} className="border border-slate-100 rounded-lg">
              <button
                onClick={() => setOpen(isOpen ? "" : group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <span className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  {group.label}
                </span>
                <span className="text-xs text-slate-400">{items.length}</span>
              </button>
              {isOpen && (
                <div className="px-2 pb-2 space-y-1">
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="w-full text-left p-2 rounded-md hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 truncate">{item.subject}</p>
                      {item.target && <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.target}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
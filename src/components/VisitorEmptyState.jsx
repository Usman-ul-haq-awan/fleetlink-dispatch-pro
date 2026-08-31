import React from "react";
import { Eye } from "lucide-react";

// Shown to visitors (entity_type === "visitor") on pages that contain
// company data. The page's data-loading effects are guarded with isVisitor
// so no company data is fetched at all — this is purely a visual placeholder.
export default function VisitorEmptyState({ title, message }) {
  return (
    <div className="p-6 max-w-3xl mx-auto text-center">
      <div className="bg-white rounded-xl border border-slate-200 p-10">
        <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">{title || "View-only access"}</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {message || "You're viewing this page as a visitor. Company data is hidden."}
        </p>
      </div>
    </div>
  );
}
import React, { useEffect } from "react";
import { X, Download, FileWarning } from "lucide-react";

function getFileType(url, name) {
  const ext = (name || url || "").split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

export default function DocumentPreview({ docUrl, docName, open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !docUrl) return null;

  const type = getFileType(docUrl, docName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-slate-900 truncate">{docName || "Document Preview"}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={docUrl}
              download={docName || "document"}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
          {type === "image" && (
            <img
              src={docUrl}
              alt={docName || "Document"}
              className="max-w-full max-h-full object-contain"
            />
          )}
          {type === "pdf" && (
            <iframe
              src={docUrl}
              title={docName || "PDF Preview"}
              className="w-full h-full min-h-[70vh] border-0"
            />
          )}
          {type === "other" && (
            <div className="text-center py-16 px-4">
              <FileWarning className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">Preview not available for this file type</p>
              <p className="text-sm text-slate-400 mb-4">{docName}</p>
              <a
                href={docUrl}
                download={docName || "document"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
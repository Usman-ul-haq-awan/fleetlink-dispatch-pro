import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Eye, Loader2, CheckCircle, X } from "lucide-react";

export default function DocumentUpload({ label, docUrl, docName, recordId, fieldUrl, fieldName, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Onboarding.update(recordId, {
        [fieldUrl]: file_url,
        [fieldName]: file.name,
        updated_at: new Date().toISOString(),
      });
      onUploaded();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove this document?")) return;
    try {
      await base44.entities.Onboarding.update(recordId, {
        [fieldUrl]: "",
        [fieldName]: "",
        updated_at: new Date().toISOString(),
      });
      onUploaded();
    } catch (err) {
      setError(err.message || "Remove failed");
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${docUrl ? "border-green-200 bg-green-50/30" : "border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {docUrl ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <span className="text-xs text-slate-400">Pending</span>
        )}
      </div>
      {docUrl ? (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate flex-1"
            title={docName}
          >
            {docName || "View document"}
          </a>
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-600"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={handleRemove}
            className="text-red-400 hover:text-red-600"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : "Upload document"}
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        type="file"
        ref={fileRef}
        accept="image/*,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
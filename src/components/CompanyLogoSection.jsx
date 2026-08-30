import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Upload, Loader2, Save } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function CompanyLogoSection() {
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppSetting.filter({ setting_key: "company_logo_url" })
      .then((res) => { if (res.length > 0) setLogoUrl(res[0].setting_value || ""); })
      .catch(() => {});
  }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(res.file_url);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = await base44.entities.AppSetting.filter({ setting_key: "company_logo_url" });
      if (existing.length > 0) {
        await base44.entities.AppSetting.update(existing[0].id, { setting_value: logoUrl });
      } else {
        await base44.entities.AppSetting.create({
          setting_key: "company_logo_url",
          setting_value: logoUrl,
          setting_category: "company",
          setting_type: "string",
          description: "Company logo URL (used in sidebar and emails)",
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-blue-600" />
        Company Logo
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Upload your company logo — it appears in the app sidebar. To update the home-screen app icon on
        installed devices, set the logo from the App Dashboard → Overview (the platform uses that for the PWA icon).
      </p>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 flex-shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" className="w-full h-full" fittingType="fit" />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-300" />
          )}
        </div>
        <div className="flex-1">
          <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload Logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-slate-400 mt-2">PNG or JPG, square recommended (e.g. 512×512).</p>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={saving || !logoUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Logo"}
        </button>
      </div>
    </div>
  );
}
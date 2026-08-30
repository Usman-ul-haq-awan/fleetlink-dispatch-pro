import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, Upload, IdCard, Mail } from "lucide-react";

export default function AddStaffForm({ onAdded }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [entityType, setEntityType] = useState("staff");
  const [identityFile, setIdentityFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setIdentityFile(file);
  };

  const handleSubmit = async () => {
    if (!fullName || !email) return;
    setSubmitting(true);
    setMessage(null);
    try {
      let docUrl = "";
      let docName = "";
      if (identityFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: identityFile });
        docUrl = uploadRes.file_url;
        docName = identityFile.name;
      }

      const loginCode = String(Math.floor(1000 + Math.random() * 9000));
      const role = entityType === "admin" ? "admin" : "user";
      await base44.entities.StaffMember.create({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        entity_type: entityType,
        identity_document_url: docUrl,
        identity_document_name: docName,
        status: "Invited",
        approved: false,
        login_code: loginCode,
      });

      try {
        await base44.users.inviteUser(email.trim(), role);
      } catch (inviteErr) {
        console.warn("Invite send warning:", inviteErr.message);
      }

      setMessage({
        type: "success",
        text: `${fullName.trim()} added. An invitation email was sent to ${email.trim()}. They must click the "App Access" link in that email to set their own password and activate their account — no password is needed from you.`,
      });

      setFullName("");
      setEmail("");
      setPhone("");
      setEntityType("staff");
      setIdentityFile(null);
      if (onAdded) onAdded();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || err.message || "Failed to add staff member" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-blue-600" />
        Add Staff Member
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Enter the staff member's details below. They'll receive an invitation email to set their own password and activate their account.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name *</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Entity Type</label>
          <select value={entityType} onChange={e => setEntityType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="staff">Staff</option>
            <option value="student">Student</option>
            <option value="visitor">Visitor</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">Admins get full access; student/staff/visitor get standard access.</p>
        </div>
      </div>

      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          An invitation email will be sent automatically. The staff member clicks the <strong>"App Access"</strong> link in that email to set their own password and activate their account — you don't need to create or share a password.
        </p>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
          <IdCard className="w-3.5 h-3.5" /> Identity Document (ID Card / License)
        </label>
        <div className="flex items-center gap-2">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 truncate">
              {identityFile ? identityFile.name : "Click to upload ID document (PDF, image)"}
            </span>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
          </label>
          {identityFile && (
            <button onClick={() => setIdentityFile(null)} type="button"
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Remove</button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">Stored securely in the database. Admins can retrieve it anytime from the staff list below.</p>
      </div>

      {message && (
        <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <button onClick={handleSubmit} disabled={submitting || !fullName || !email}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Add Staff Member
      </button>
    </div>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { listAllCarriers } from "@/lib/paginatedList";
import {
  Shield, User, Loader2, Eye, ChevronUp, ChevronDown, Mail, KeyRound, Trash2,
  RefreshCw, Upload, Check, X, Phone, IdCard, Truck,
} from "lucide-react";

export default function StaffList({
  users, staffMembers, onRoleChange, onDelete, onApprove, onRegenerateCode, onUpdatePhone, onUpdateId, currentUserId,
}) {
  const [changingRole, setChangingRole] = useState(null);
  const [resending, setResending] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [approving, setApproving] = useState(null);
  const [actionMsg, setActionMsg] = useState({});
  const [editingPhone, setEditingPhone] = useState(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});
  const [allocCount, setAllocCount] = useState({});
  const [allocating, setAllocating] = useState(null);
  const [unassigning, setUnassigning] = useState(null);
  const [carrierCounts, setCarrierCounts] = useState({});
  const [allocMsg, setAllocMsg] = useState({});

  const setAllocMessage = (key, type, text) => {
    setAllocMsg((prev) => ({ ...prev, [key]: { type, text } }));
    setTimeout(() => setAllocMsg((prev) => ({ ...prev, [key]: undefined })), 4000);
  };

  // Load carrier allocation counts per user
  const loadCounts = async () => {
    try {
      const all = await listAllCarriers("-updated_date");
      const counts = {};
      all.forEach(c => {
        if (c.assigned_to_user_id) counts[c.assigned_to_user_id] = (counts[c.assigned_to_user_id] || 0) + 1;
      });
      setCarrierCounts(counts);
    } catch {}
  };
  useEffect(() => { loadCounts(); }, []);

  const handleAllocate = async (userId, key) => {
    const count = parseInt(allocCount[key], 10);
    if (!count || count < 1) return;
    setAllocating(key);
    try {
      const all = await listAllCarriers("-updated_date");
      // Pick unassigned carriers (no assigned_to_user_id)
      const unassigned = all.filter(c => !c.assigned_to_user_id);
      const toAssign = unassigned.slice(0, count);
      if (toAssign.length === 0) {
        setAllocMessage(key, "error", "No unassigned carriers available.");
        return;
      }
      // Use updateMany to assign them in one call
      await base44.entities.Carrier.updateMany(
        { id: { $in: toAssign.map(c => c.id) } },
        { $set: { assigned_to_user_id: userId } }
      );
      setAllocMessage(key, "success", `${toAssign.length} carriers allocated.`);
      setAllocCount(prev => ({ ...prev, [key]: "" }));
      loadCounts();
    } catch (err) {
      setAllocMessage(key, "error", err.message || "Allocation failed");
    } finally {
      setAllocating(null);
    }
  };

  const handleUnassignAll = async (userId, key) => {
    if (!window.confirm("Return all allocated carriers to the unassigned pool?")) return;
    setUnassigning(key);
    try {
      await base44.entities.Carrier.updateMany(
        { assigned_to_user_id: userId },
        { $unset: { assigned_to_user_id: "" } }
      );
      setAllocMessage(key, "success", "All carriers unassigned.");
      loadCounts();
    } catch (err) {
      setAllocMessage(key, "error", err.message || "Unassign failed");
    } finally {
      setUnassigning(null);
    }
  };

  const setMsg = (key, type, text) => {
    setActionMsg((prev) => ({ ...prev, [key]: { type, text } }));
    setTimeout(() => setActionMsg((prev) => ({ ...prev, [key]: undefined })), 4000);
  };

  const handleResendInvite = async (email, role, key) => {
    setResending(key);
    try {
      await base44.users.inviteUser(email, role);
      setMsg(key, "success", "Invitation re-sent. Check inbox (and spam folder).");
    } catch (err) {
      setMsg(key, "error", err.response?.data?.error || err.message || "Failed to re-send invitation");
    } finally {
      setResending(null);
    }
  };

  const handleResetPassword = async (email, key) => {
    setResetting(key);
    try {
      await base44.auth.resetPasswordRequest(email);
      setMsg(key, "success", "Password reset email sent. Check inbox (and spam folder).");
    } catch (err) {
      setMsg(key, "error", err.response?.data?.error || err.message || "Failed to send reset email");
    } finally {
      setResetting(null);
    }
  };

  const handleDelete = async (userId, staffMemberId, email, key) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }
    await onDelete(userId, staffMemberId, email);
  };

  const handleApproveClick = async (staffMemberId, currentApproved, key) => {
    if (!currentApproved) {
      if (!window.confirm("Approve this staff member? A new 4-digit login code will be generated — share it with them so they can log in.")) return;
    } else {
      if (!window.confirm("Revoke approval? This staff member will no longer be able to log in.")) return;
    }
    setApproving(key);
    try {
      await onApprove(staffMemberId, !currentApproved);
    } finally {
      setApproving(null);
    }
  };

  const handleRegenerate = async (staffMemberId, key) => {
    setRegenerating(key);
    try {
      await onRegenerateCode(staffMemberId);
      setMsg(key, "success", "New login code generated.");
    } finally {
      setRegenerating(null);
    }
  };

  const startEditPhone = (key, currentPhone) => {
    setEditingPhone(key);
    setPhoneInput(currentPhone || "");
  };

  const savePhone = async (staffMemberId, key) => {
    setSavingPhone(key);
    try {
      await onUpdatePhone(staffMemberId, phoneInput.trim());
      setEditingPhone(null);
    } finally {
      setSavingPhone(null);
    }
  };

  const handleIdUpload = async (staffMemberId, file, key) => {
    if (!file) return;
    setUploadingId(key);
    try {
      await onUpdateId(staffMemberId, file);
      setMsg(key, "success", "ID document updated.");
    } catch (err) {
      setMsg(key, "error", err.message || "Failed to upload ID");
    } finally {
      setUploadingId(null);
    }
  };

  // Merge Users and StaffMembers by email
  const emailToStaff = {};
  staffMembers.forEach((sm) => {
    emailToStaff[(sm.email || "").toLowerCase()] = sm;
  });

  const merged = [];
  const seenEmails = new Set();

  users.forEach((u) => {
    const email = (u.email || "").toLowerCase();
    seenEmails.add(email);
    const sm = emailToStaff[email];
    merged.push({
      key: u.id,
      userId: u.id,
      full_name: u.full_name || sm?.full_name || "—",
      email: u.email,
      phone: sm?.phone || "",
      role: u.role || sm?.role || "user",
      status: sm?.status || (u.full_name ? "Active" : "Invited"),
      identity_document_url: sm?.identity_document_url || "",
      identity_document_name: sm?.identity_document_name || "",
      staffMemberId: sm?.id,
      hasAccount: true,
      approved: sm?.approved || false,
      login_code: sm?.login_code || "",
    });
  });

  staffMembers.forEach((sm) => {
    const email = (sm.email || "").toLowerCase();
    if (!seenEmails.has(email)) {
      merged.push({
        key: sm.id,
        userId: null,
        full_name: sm.full_name || "—",
        email: sm.email,
        phone: sm.phone || "",
        role: sm.role || "user",
        status: sm.status || "Invited",
        identity_document_url: sm.identity_document_url || "",
        identity_document_name: sm.identity_document_name || "",
        staffMemberId: sm.id,
        hasAccount: false,
        approved: sm.approved || false,
        login_code: sm.login_code || "",
      });
    }
  });

  const handleRoleChange = async (userId, newRole, staffMemberId, member) => {
    if (newRole === "user" && member.userId === currentUserId) {
      if (!window.confirm("You are about to demote YOURSELF from Admin. You will lose access to Settings and staff management. Continue?")) return;
    } else if (newRole === "user") {
      if (!window.confirm("Demote this admin to Staff? They will lose access to Settings and staff management.")) return;
    }
    setChangingRole(member.key);
    try {
      await onRoleChange(userId, newRole, staffMemberId);
    } finally {
      setChangingRole(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-600" />
        Staff Members & Roles
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Approve staff to generate their 4-digit login code (shown next to their name — share it with them). Staff must enter this code on every login. Phone and ID document are editable anytime.
      </p>

      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Name & Login Code</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Phone</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Approval</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Role</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">ID Document</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Carrier Allocation</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Account Actions</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Change Role</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {merged.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-4 text-center text-slate-400">No staff members yet. Add your first staff member above.</td></tr>
            ) : merged.map((m) => (
              <tr key={m.key} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{m.full_name}</span>
                    {m.login_code && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-700" title="4-digit login code — share with staff member">
                        <KeyRound className="w-3 h-3" />
                        {m.login_code}
                      </span>
                    )}
                    {m.staffMemberId && (
                      <button
                        onClick={() => handleRegenerate(m.staffMemberId, m.key)}
                        disabled={regenerating === m.key}
                        className="text-slate-300 hover:text-purple-600 disabled:opacity-50"
                        title="Regenerate login code"
                      >
                        {regenerating === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.email}</td>
                <td className="px-4 py-2 text-slate-600 text-xs whitespace-nowrap">
                  {editingPhone === m.key ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") savePhone(m.staffMemberId, m.key); if (e.key === "Escape") setEditingPhone(null); }}
                        autoFocus
                        className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button onClick={() => savePhone(m.staffMemberId, m.key)} disabled={savingPhone === m.key}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50">
                        {savingPhone === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingPhone(null)} className="text-red-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => m.staffMemberId && startEditPhone(m.key, m.phone)}
                      className={`flex items-center gap-1 ${m.phone ? "text-slate-600" : "text-slate-300"} hover:text-blue-600`}
                      title={m.staffMemberId ? "Click to edit phone" : ""}
                    >
                      <Phone className="w-3 h-3" />
                      {m.phone || "—"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2">
                  {m.staffMemberId ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        m.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {m.approved ? "Approved" : "Pending"}
                      </span>
                      <button
                        onClick={() => handleApproveClick(m.staffMemberId, m.approved, m.key)}
                        disabled={approving === m.key}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border whitespace-nowrap disabled:opacity-50 ${
                          m.approved
                            ? "text-red-700 border-red-200 hover:bg-red-50"
                            : "text-green-700 border-green-200 hover:bg-green-50"
                        }`}
                        title={m.approved ? "Revoke approval" : "Approve & generate login code"}
                      >
                        {approving === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : m.approved ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        {m.approved ? "Revoke" : "Approve"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {m.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {m.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {m.identity_document_url ? (
                      <a href={m.identity_document_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        title={m.identity_document_name || "View document"}>
                        <Eye className="w-4 h-4" /> View
                      </a>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                    {m.staffMemberId && (
                      <>
                        <button
                          onClick={() => fileInputRefs.current[m.key]?.click()}
                          disabled={uploadingId === m.key}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-600 text-xs disabled:opacity-50"
                          title="Upload / replace ID document"
                        >
                          {uploadingId === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        </button>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          ref={(el) => (fileInputRefs.current[m.key] = el)}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdUpload(m.staffMemberId, f, m.key); e.target.value = ""; }}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.role === "admin" ? "bg-slate-100 text-slate-500" : (carrierCounts[m.userId] ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}`}>
                        <Truck className="w-3 h-3" />
                        {m.role === "admin" ? "All (Admin)" : (carrierCounts[m.userId] || 0)}
                      </span>
                      {m.role !== "admin" && (carrierCounts[m.userId] || 0) > 0 && (
                        <button
                          onClick={() => handleUnassignAll(m.userId, m.key)}
                          disabled={unassigning === m.key}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Unassign all carriers"
                        >
                          {unassigning === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    {m.role !== "admin" && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={allocCount[m.key] || ""}
                          onChange={(e) => setAllocCount(prev => ({ ...prev, [m.key]: e.target.value }))}
                          placeholder="Count"
                          disabled={allocating === m.key}
                          className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAllocate(m.userId, m.key)}
                          disabled={allocating === m.key || !allocCount[m.key]}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                          title="Allocate unassigned carriers to this staff member"
                        >
                          {allocating === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                          Allocate
                        </button>
                      </div>
                    )}
                    {allocMsg[m.key] && (
                      <span className={`text-[10px] ${allocMsg[m.key].type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {allocMsg[m.key].text}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleResendInvite(m.email, m.role, m.key)}
                        disabled={resending === m.key}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                        title="Re-send invitation email"
                      >
                        {resending === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        Resend
                      </button>
                      <button
                        onClick={() => handleResetPassword(m.email, m.key)}
                        disabled={resetting === m.key}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-amber-700 border-amber-200 hover:bg-amber-50 disabled:opacity-50 whitespace-nowrap"
                        title="Send password reset email"
                      >
                        {resetting === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                        Reset PW
                      </button>
                    </div>
                    {actionMsg[m.key] && (
                      <span className={`text-[10px] ${actionMsg[m.key].type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {actionMsg[m.key].text}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  {changingRole === m.key ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
                  ) : (
                    <button
                      onClick={() => handleRoleChange(m.userId, m.role === "admin" ? "user" : "admin", m.staffMemberId, m)}
                      disabled={!m.userId && !m.staffMemberId}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border whitespace-nowrap ${
                        m.role === "admin"
                          ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                          : "text-purple-700 border-purple-200 hover:bg-purple-50"
                      } disabled:opacity-50`}
                      title={m.role === "admin" ? "Demote to Staff" : "Promote to Admin"}
                    >
                      {m.role === "admin" ? <><ChevronDown className="w-3.5 h-3.5" /> Make Staff</> : <><ChevronUp className="w-3.5 h-3.5" /> Make Admin</>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleDelete(m.userId, m.staffMemberId, m.email, m.key)}
                    disabled={m.userId === currentUserId}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                    title={m.userId === currentUserId ? "You cannot delete your own account" : "Remove staff member"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
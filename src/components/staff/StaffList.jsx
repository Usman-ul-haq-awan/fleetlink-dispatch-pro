import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, User, Loader2, Eye, ChevronUp, ChevronDown, Mail, KeyRound, Trash2 } from "lucide-react";

export default function StaffList({ users, staffMembers, onRoleChange, onDelete, currentUserId }) {
  const [changingRole, setChangingRole] = useState(null);
  const [resending, setResending] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [actionMsg, setActionMsg] = useState({});

  const setMsg = (key, type, text) => {
    setActionMsg(prev => ({ ...prev, [key]: { type, text } }));
    setTimeout(() => setActionMsg(prev => ({ ...prev, [key]: undefined })), 4000);
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

  // Merge Users and StaffMembers by email
  const emailToStaff = {};
  staffMembers.forEach(sm => {
    emailToStaff[(sm.email || "").toLowerCase()] = sm;
  });

  const merged = [];
  const seenEmails = new Set();

  users.forEach(u => {
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
    });
  });

  staffMembers.forEach(sm => {
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
        Promote or demote staff between Admin and Staff roles. Click "View" to open a stored identity document. This makes the app reusable for different companies — transfer admin access as needed.
      </p>

      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Phone</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Role</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">ID Document</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Account Actions</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Change Role</th>
              <th className="text-center px-4 py-2 font-medium text-slate-600">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {merged.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-4 text-center text-slate-400">No staff members yet. Add your first staff member above.</td></tr>
            ) : merged.map(m => (
              <tr key={m.key} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900 font-medium whitespace-nowrap">{m.full_name}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.email}</td>
                <td className="px-4 py-2 text-slate-600 text-xs whitespace-nowrap">{m.phone || "—"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    m.status === "Active" ? "bg-green-100 text-green-700" :
                    m.status === "Invited" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>{m.status}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {m.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {m.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  {m.identity_document_url ? (
                    <a href={m.identity_document_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                      title={m.identity_document_name || "View document"}>
                      <Eye className="w-4 h-4" /> View
                    </a>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleResendInvite(m.email, m.role, m.key)}
                        disabled={resending === m.key}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                        title="Re-send invitation email">
                        {resending === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        Resend
                      </button>
                      <button
                        onClick={() => handleResetPassword(m.email, m.key)}
                        disabled={resetting === m.key}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-amber-700 border-amber-200 hover:bg-amber-50 disabled:opacity-50 whitespace-nowrap"
                        title="Send password reset email">
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
                      title={m.role === "admin" ? "Demote to Staff" : "Promote to Admin"}>
                      {m.role === "admin" ? <><ChevronDown className="w-3.5 h-3.5" /> Make Staff</> : <><ChevronUp className="w-3.5 h-3.5" /> Make Admin</>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleDelete(m.userId, m.staffMemberId, m.email, m.key)}
                    disabled={m.userId === currentUserId}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                    title={m.userId === currentUserId ? "You cannot delete your own account" : "Remove staff member"}>
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
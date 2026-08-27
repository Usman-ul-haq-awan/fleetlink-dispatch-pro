import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, Shield, User, Mail } from "lucide-react";

// Admin-only panel for inviting staff members. Staff receive an invitation
// email and register through the standard auth flow; they log in via the
// /login page like every other user. Only admins can reach this component
// (the Settings page gates access).
export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.User.list();
      setUsers(all);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setMessage(null);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      setMessage({ type: "success", text: `Invitation sent to ${inviteEmail.trim()}. They can register and log in from the login page.` });
      setInviteEmail("");
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || err.message || "Failed to invite user" });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-blue-600" />
        Staff Management
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Add staff members here — they'll receive an invitation email to register and log in.
        Every shared app URL always takes unauthenticated users to the login page first.
      </p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="email" placeholder="staff@example.com" value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="user">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={invite} disabled={inviting || !inviteEmail}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Invite Member
        </button>
      </div>

      {message && (
        <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400">No members yet. Invite your first staff member above.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-900 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role === "admin" ? "Admin" : "Staff"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
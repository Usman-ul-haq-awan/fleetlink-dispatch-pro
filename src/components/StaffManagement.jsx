import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AddStaffForm from "@/components/staff/AddStaffForm";
import StaffList from "@/components/staff/StaffList";
import { Loader2 } from "lucide-react";

// Admin-only panel for managing staff: adding members with auto-generated
// passwords, uploading identity documents, and changing roles (admin/staff).
// Only admins can reach this component (the Settings page gates access).
export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, sm, me] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.StaffMember.list("-created_date", 200),
        base44.auth.me().catch(() => null),
      ]);
      setUsers(u);
      setStaffMembers(sm);
      setCurrentUser(me);
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId, newRole, staffMemberId) => {
    if (userId) {
      await base44.entities.User.update(userId, { role: newRole });
    }
    if (staffMemberId) {
      await base44.entities.StaffMember.update(staffMemberId, { role: newRole });
    }
    await load();
  };

  const handleApprove = async (staffMemberId, approved) => {
    const updates = { approved };
    if (approved) {
      updates.login_code = String(Math.floor(1000 + Math.random() * 9000));
    }
    await base44.entities.StaffMember.update(staffMemberId, updates);
    await load();
  };

  const handleRegenerateCode = async (staffMemberId) => {
    const loginCode = String(Math.floor(1000 + Math.random() * 9000));
    await base44.entities.StaffMember.update(staffMemberId, { login_code: loginCode });
    await load();
  };

  const handleUpdatePhone = async (staffMemberId, phone) => {
    await base44.entities.StaffMember.update(staffMemberId, { phone });
    await load();
  };

  const handleUpdateId = async (staffMemberId, file) => {
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.StaffMember.update(staffMemberId, {
      identity_document_url: uploadRes.file_url,
      identity_document_name: file.name,
    });
    await load();
  };

  const handleDelete = async (userId, staffMemberId, email) => {
    if (!window.confirm(`Remove ${email} from the system? This deletes their account and staff record.`)) return;
    try {
      if (staffMemberId) {
        await base44.entities.StaffMember.delete(staffMemberId);
      }
      if (userId) {
        await base44.entities.User.delete(userId);
      }
      await load();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <AddStaffForm onAdded={load} />
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <StaffList
          users={users}
          staffMembers={staffMembers}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onRegenerateCode={handleRegenerateCode}
          onUpdatePhone={handleUpdatePhone}
          onUpdateId={handleUpdateId}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
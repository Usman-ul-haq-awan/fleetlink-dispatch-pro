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
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
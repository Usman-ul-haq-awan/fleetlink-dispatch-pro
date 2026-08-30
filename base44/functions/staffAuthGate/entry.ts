// Staff authentication gate — runs as a service role to bypass the admin-only
// RLS on StaffMember. Lets a logged-in staff member check their approval/profile
// status, verify their 4-digit login code, and update their own phone/ID —
// without ever exposing the login_code itself to the client.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    let body: any = {};
    try { body = await req.json(); } catch {}
    const action = body.action || 'status';

    // Find the staff member by email (StaffMember.email matches the auth email).
    const email = (user.email || '').toLowerCase();
    const matches = await svc.entities.StaffMember.filter({ email });
    const sm = matches && matches.length > 0 ? matches[0] : null;

    if (action === 'status') {
      return Response.json({
        has_staff_record: !!sm,
        approved: sm?.approved === true,
        has_phone: !!(sm?.phone && String(sm.phone).trim()),
        has_id: !!(sm?.identity_document_url),
        role: user.role || sm?.role || 'user',
        entity_type: sm?.entity_type || '',
        full_name: sm?.full_name || user.full_name || '',
        login_code_set: !!(sm?.login_code),
      });
    }

    if (action === 'verify_code') {
      const code = String(body.code || '').trim();
      if (!sm) return Response.json({ valid: false, error: 'No staff record found' }, { status: 403 });
      if (sm.approved !== true) return Response.json({ valid: false, error: 'Your account has not been approved' }, { status: 403 });
      if (!sm.login_code) return Response.json({ valid: false, error: 'No login code has been assigned. Contact your administrator.' }, { status: 403 });
      if (!sm.phone || !String(sm.phone).trim() || !sm.identity_document_url) {
        return Response.json({ valid: false, error: 'Profile incomplete' }, { status: 403 });
      }
      if (code !== String(sm.login_code)) return Response.json({ valid: false });
      return Response.json({ valid: true });
    }

    if (action === 'update_profile') {
      if (!sm) return Response.json({ error: 'No staff record found' }, { status: 403 });
      if (sm.approved !== true) return Response.json({ error: 'Your account has not been approved' }, { status: 403 });
      const updates: any = {};
      if (typeof body.phone === 'string') updates.phone = body.phone.trim();
      if (typeof body.identity_document_url === 'string' && body.identity_document_url) {
        updates.identity_document_url = body.identity_document_url;
        updates.identity_document_name = typeof body.identity_document_name === 'string' ? body.identity_document_name : '';
      }
      if (typeof body.entity_type === 'string' && ['admin', 'student', 'staff', 'visitor'].includes(body.entity_type)) {
        updates.entity_type = body.entity_type;
      }
      await svc.entities.StaffMember.update(sm.id, updates);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
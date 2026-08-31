import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Admin verifies or rejects a student's certificate payment.
// On "verify", the payment status becomes "paid" and the student's
// certificate unlocks for download/print. On "reject", the student
// can submit a new payment.
export default async function verifyCertificatePayment(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const { payment_id, action, notes } = body;
    if (!payment_id) return Response.json({ error: "payment_id is required" }, { status: 400 });
    if (!action || !["verify", "reject"].includes(action))
      return Response.json({ error: "Invalid action — must be verify or reject" }, { status: 400 });

    const payment = await base44.asServiceRole.entities.CertificatePayment.get(payment_id);
    if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });

    const newStatus = action === "verify" ? "paid" : "rejected";
    const updated = await base44.asServiceRole.entities.CertificatePayment.update(payment_id, {
      status: newStatus,
      verified_by: user.id,
      verified_by_name: user.full_name || user.email,
      verified_at: new Date().toISOString(),
      notes: notes || payment.notes || "",
    });

    return Response.json({ success: true, payment: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
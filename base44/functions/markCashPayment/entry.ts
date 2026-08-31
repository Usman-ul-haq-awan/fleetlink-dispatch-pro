import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Admin manually records a cash payment received in person.
// Creates a CertificatePayment record already marked as "paid" so the
// student's certificate unlocks immediately — no verification step needed.
export default async function markCashPayment(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const { quiz_result_id } = body;
    if (!quiz_result_id) return Response.json({ error: "quiz_result_id is required" }, { status: 400 });

    const quizResult = await base44.asServiceRole.entities.QuizResult.get(quiz_result_id);
    if (!quizResult) return Response.json({ error: "Quiz result not found" }, { status: 404 });
    if (!quizResult.passed) return Response.json({ error: "Cannot collect payment for a failed quiz attempt" }, { status: 400 });

    // Prevent duplicate payments
    const existing = await base44.asServiceRole.entities.CertificatePayment.filter({ quiz_result_id });
    if (existing.find((p) => p.status === "paid"))
      return Response.json({ error: "Certificate already paid for this quiz result" }, { status: 400 });

    // Read fee + currency from settings
    const feeSettings = await base44.asServiceRole.entities.AppSetting.filter({ setting_key: "certificate_fee" });
    const currencySettings = await base44.asServiceRole.entities.AppSetting.filter({ setting_key: "certificate_fee_currency" });
    const amount = feeSettings.length > 0 && feeSettings[0].setting_value ? feeSettings[0].setting_value : "5";
    const currency = currencySettings.length > 0 && currencySettings[0].setting_value ? currencySettings[0].setting_value : "USD";

    const now = new Date().toISOString();
    const payment = await base44.asServiceRole.entities.CertificatePayment.create({
      quiz_result_id,
      user_id: quizResult.user_id || "",
      student_name: quizResult.student_name,
      student_email: quizResult.student_email,
      module_number: quizResult.module_number,
      module_title: quizResult.module_title,
      amount,
      currency,
      provider: "cash",
      status: "paid",
      transaction_ref: "CASH-" + now.slice(0, 10),
      submitted_at: now,
      verified_by: user.id,
      verified_by_name: user.full_name || user.email,
      verified_at: now,
      notes: "Cash payment received in person by " + (user.full_name || user.email),
    });

    return Response.json({ success: true, payment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
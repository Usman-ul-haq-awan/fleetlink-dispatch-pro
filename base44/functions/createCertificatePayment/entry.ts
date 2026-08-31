import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Student submits a certificate payment after passing a module quiz.
// Creates a CertificatePayment record with status "pending_verification"
// for admin review. Until the admin verifies, the certificate stays locked.
export default async function createCertificatePayment(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { quiz_result_id, provider, transaction_ref } = body;
    if (!quiz_result_id) return Response.json({ error: "quiz_result_id is required" }, { status: 400 });
    if (!provider || !["jazzcash", "easypaisa"].includes(provider))
      return Response.json({ error: "Invalid provider — must be jazzcash or easypaisa" }, { status: 400 });
    if (!transaction_ref || !String(transaction_ref).trim())
      return Response.json({ error: "Transaction reference is required" }, { status: 400 });

    // Fetch the quiz result (service role — quiz results may be created by any user)
    const quizResult = await base44.asServiceRole.entities.QuizResult.get(quiz_result_id);
    if (!quizResult) return Response.json({ error: "Quiz result not found" }, { status: 404 });
    if (!quizResult.passed) return Response.json({ error: "Cannot pay for a quiz attempt that was not passed" }, { status: 400 });

    // Prevent duplicate payments for the same quiz result
    const existing = await base44.asServiceRole.entities.CertificatePayment.filter({ quiz_result_id });
    const alreadyPaid = existing.find((p) => p.status === "paid");
    if (alreadyPaid) return Response.json({ error: "Certificate already paid for this quiz result" }, { status: 400 });

    // Read the fee + currency from settings (defaults: 5 USD)
    const feeSettings = await base44.asServiceRole.entities.AppSetting.filter({ setting_key: "certificate_fee" });
    const currencySettings = await base44.asServiceRole.entities.AppSetting.filter({ setting_key: "certificate_fee_currency" });
    const amount = feeSettings.length > 0 && feeSettings[0].setting_value ? feeSettings[0].setting_value : "5";
    const currency = currencySettings.length > 0 && currencySettings[0].setting_value ? currencySettings[0].setting_value : "USD";

    // Create the payment record (user-scoped so created_by_id is stamped correctly)
    const payment = await base44.entities.CertificatePayment.create({
      quiz_result_id,
      user_id: user.id,
      student_name: quizResult.student_name,
      student_email: quizResult.student_email,
      module_number: quizResult.module_number,
      module_title: quizResult.module_title,
      amount,
      currency,
      provider,
      status: "pending_verification",
      transaction_ref: String(transaction_ref).trim(),
      submitted_at: new Date().toISOString(),
    });

    return Response.json({ success: true, payment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
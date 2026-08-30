import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { sendEmail } from "../../shared/emailSender.ts";

// Emails a student their quiz result. Called after a QuizResult record is
// created (on quiz completion) or re-triggered by an admin from the results
// dashboard. Uses the shared SMTP email sender so it reaches any address.
export default async function sendQuizResult(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { quiz_result_id } = body;
    if (!quiz_result_id) return Response.json({ error: "quiz_result_id is required" }, { status: 400 });

    const record = await base44.asServiceRole.entities.QuizResult.get(quiz_result_id);
    if (!record) return Response.json({ error: "Quiz result not found" }, { status: 404 });
    if (!record.student_email) return Response.json({ error: "Student has no email address" }, { status: 400 });

    const settings = await base44.entities.AppSetting.filter({ setting_key: "company_name" });
    const fromName = settings.length > 0 && settings[0].setting_value
      ? settings[0].setting_value
      : "Tycoon Dispatch Academy";

    const pct = record.percentage ?? 0;
    const passed = record.passed;
    const statusColor = passed ? "#16a34a" : "#dc2626";
    const statusText = passed ? "PASSED 🎉" : "Not Passed";

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#0a2a6e,#0d3080);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:22px;margin:0;">Tycoon Dispatch Academy</h1>
    <p style="color:#cccccc;font-size:13px;margin:6px 0 0;">Quiz Result Notification</p>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px;">
    <p style="font-size:14px;color:#333;">Dear <strong>${record.student_name}</strong>,</p>
    <p style="font-size:14px;color:#333;line-height:1.6;">Here are the results of your quiz attempt:</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:10px;border:1px solid #eee;font-size:13px;color:#666;">Module</td><td style="padding:10px;border:1px solid #eee;font-size:13px;font-weight:bold;color:#0a2a6e;">Module ${record.module_number}: ${record.module_title}</td></tr>
      <tr><td style="padding:10px;border:1px solid #eee;font-size:13px;color:#666;">Score</td><td style="padding:10px;border:1px solid #eee;font-size:13px;font-weight:bold;">${record.score} / ${record.total} (${pct}%)</td></tr>
      <tr><td style="padding:10px;border:1px solid #eee;font-size:13px;color:#666;">Result</td><td style="padding:10px;border:1px solid #eee;font-size:13px;font-weight:bold;color:${statusColor};">${statusText}</td></tr>
      <tr><td style="padding:10px;border:1px solid #eee;font-size:13px;color:#666;">Date</td><td style="padding:10px;border:1px solid #eee;font-size:13px;">${new Date(record.created_date || Date.now()).toLocaleString("en-US")}</td></tr>
    </table>
    ${passed ? `
    <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
      <p style="font-size:16px;font-weight:bold;color:#16a34a;margin:0 0 6px;">🏆 Certificate of Completion</p>
      <p style="font-size:13px;color:#333;margin:0;">This email serves as your digital certificate. You have successfully completed <strong>Module ${record.module_number}: ${record.module_title}</strong> with a score of ${pct}%.</p>
    </div>` : `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="font-size:13px;color:#991b1b;margin:0;">You need 70% to pass. Review the module material and try again — each attempt draws fresh questions from the bank.</p>
    </div>`}
    <p style="font-size:13px;color:#666;line-height:1.6;">Keep up the great work! Log in to your student portal to attempt the next module.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">Tycoon Dispatch Academy · Tycoon Logistics<br/>This is an automated email — please do not reply.</p>
  </div>
</div>
</body></html>`;

    const subject = passed
      ? `🏆 You passed Module ${record.module_number}: ${record.module_title}!`
      : `Quiz Result — Module ${record.module_number}: ${record.module_title}`;

    const sendResult = await sendEmail(base44, {
      to: record.student_email,
      subject,
      body: html,
      fromName,
      requireSmtp: true,
    });

    const emailOk = !sendResult || !sendResult.error;
    await base44.asServiceRole.entities.QuizResult.update(quiz_result_id, {
      email_sent: emailOk,
      email_sent_at: emailOk ? new Date().toISOString() : undefined,
    });

    return Response.json({ success: true, email_sent: emailOk, message: emailOk ? "Result emailed to student" : (sendResult?.error || "Email send failed") });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
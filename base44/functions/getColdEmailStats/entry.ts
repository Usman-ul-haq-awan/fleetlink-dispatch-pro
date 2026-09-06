import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Returns the global cold-email daily counter and queue stats.
// Only cold_outreach emails count toward the 50/day limit.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const monthPrefix = today.substring(0, 7); // YYYY-MM

    // Daily limit from AppSetting (default 50)
    const limitSetting = await base44.asServiceRole.entities.AppSetting.filter(
      { setting_key: "cold_email_daily_limit" }
    );
    const dailyLimit = parseInt(limitSetting[0]?.setting_value || "50", 10);

    // Count successful cold outreach sends (global)
    const sentEmails = await base44.asServiceRole.entities.EmailLog.filter(
      { email_type: "cold_outreach", status: "Sent" },
      "-sent_at",
      2000
    );
    const sentToday = sentEmails.filter((e: any) => e.sent_at && e.sent_at.startsWith(today)).length;
    const sentThisMonth = sentEmails.filter((e: any) => e.sent_at && e.sent_at.startsWith(monthPrefix)).length;

    // Queue stats
    const queue = await base44.asServiceRole.entities.ColdEmailQueue.list("-created_date", 2000);
    const queued = queue.filter((q: any) => q.status === "Queued" || q.status === "Waiting").length;
    const failed = queue.filter((q: any) => q.status === "Failed").length;
    const drafts = queue.filter((q: any) => q.status === "Draft").length;

    return Response.json({
      sent_today: sentToday,
      limit: dailyLimit,
      remaining_today: Math.max(0, dailyLimit - sentToday),
      queued,
      failed,
      drafts,
      sent_this_month: sentThisMonth,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
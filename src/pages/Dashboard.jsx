import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Truck, Search, Mail, Phone, UserCheck, ClipboardCheck, AlertCircle, CheckCircle, Clock } from "lucide-react";
import ResearchCriteriaChart from "@/components/ResearchCriteriaChart";
import { listAllCarriers } from "@/lib/paginatedList";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, researched: 0, failed: 0, qualified: 0, reviewRequired: 0,
    highRisk: 0, readyForOutreach: 0, emailsSent: 0, emailsReplied: 0,
    callsMade: 0, interested: 0, callbacks: 0, handoffs: 0, onboarding: 0, activeClients: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const carriers = await listAllCarriers("-updated_date");
      const emails = await base44.entities.EmailLog.list("-sent_at", 200);
      const calls = await base44.entities.CallLog.list("-call_date", 200);
      const handoffs = await base44.entities.Handoff.list("-created_at", 100);
      const onboardingRecords = await base44.entities.Onboarding.list("-updated_at", 200);
      const activity = await base44.entities.ActivityLog.list("-timestamp", 15);

      const countBy = (arr, field, value) => arr.filter(x => x[field] === value).length;

      setStats({
        total: carriers.length,
        researched: carriers.filter(c => c.research_status === "Complete" || c.lead_status === "SAFER Complete").length,
        failed: countBy(carriers, "lead_status", "Failed"),
        qualified: countBy(carriers, "safety_qualification", "Qualified"),
        reviewRequired: countBy(carriers, "safety_qualification", "Review Required"),
        highRisk: countBy(carriers, "safety_qualification", "High Risk"),
        readyForOutreach: countBy(carriers, "lead_status", "Ready for Outreach"),
        emailsSent: countBy(emails, "status", "Sent"),
        emailsReplied: countBy(emails, "status", "Replied"),
        callsMade: calls.filter(c => c.status === "Completed").length,
        interested: calls.filter(c => ["Interested", "Very Interested"].includes(c.outcome)).length,
        callbacks: countBy(calls, "outcome", "Callback Requested"),
        handoffs: handoffs.filter(h => h.status === "New").length,
        onboarding: onboardingRecords.filter(o => !["Active Client", "Lost"].includes(o.onboarding_status)).length,
        activeClients: countBy(onboardingRecords, "onboarding_status", "Active Client"),
      });
      setRecentActivity(activity);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Carriers", value: stats.total, icon: Truck, color: "blue", to: "/carriers" },
    { label: "Researched", value: stats.researched, icon: Search, color: "indigo" },
    { label: "Research Failures", value: stats.failed, icon: AlertCircle, color: "red" },
    { label: "Qualified", value: stats.qualified, icon: CheckCircle, color: "green", to: "/carriers?safety=Qualified" },
    { label: "Review Required", value: stats.reviewRequired, icon: Clock, color: "amber" },
    { label: "High Risk", value: stats.highRisk, icon: AlertCircle, color: "red" },
    { label: "Ready for Outreach", value: stats.readyForOutreach, icon: Mail, color: "blue" },
    { label: "Emails Sent", value: stats.emailsSent, icon: Mail, color: "indigo" },
    { label: "Emails Replied", value: stats.emailsReplied, icon: Mail, color: "green" },
    { label: "Calls Made", value: stats.callsMade, icon: Phone, color: "indigo" },
    { label: "Interested", value: stats.interested, icon: UserCheck, color: "green" },
    { label: "Callbacks", value: stats.callbacks, icon: Phone, color: "amber" },
    { label: "Human Handoffs", value: stats.handoffs, icon: UserCheck, color: "orange" },
    { label: "Onboarding", value: stats.onboarding, icon: ClipboardCheck, color: "blue" },
    { label: "Active Clients", value: stats.activeClients, icon: CheckCircle, color: "green" },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Carrier dispatch operations overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-70" />
                <span className="text-2xl font-bold">{card.value}</span>
              </div>
              <p className="text-xs font-medium opacity-80">{card.label}</p>
            </>
          );
          if (card.to) {
            return (
              <Link key={card.label} to={card.to} className={`rounded-lg border p-4 ${colorClasses[card.color]} hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}>
                {inner}
              </Link>
            );
          }
          return (
            <div key={card.label} className={`rounded-lg border p-4 ${colorClasses[card.color]}`}>
              {inner}
            </div>
          );
        })}
      </div>

      <ResearchCriteriaChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/import-export" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Import Carriers</p>
                <p className="text-xs text-slate-500">Upload CSV/Excel with USDOT or MC numbers</p>
              </div>
            </Link>
            <Link to="/research" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Search className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Research Queue</p>
                <p className="text-xs text-slate-500">Process carriers through SAFER/SMS research</p>
              </div>
            </Link>
            <Link to="/campaigns" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Mail className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Email Campaigns</p>
                <p className="text-xs text-slate-500">Create and send personalized outreach</p>
              </div>
            </Link>
            <Link to="/handoffs" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <UserCheck className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Human Handoffs</p>
                <p className="text-xs text-slate-500">Review hot leads ready for back office</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, i) => (
                <div key={activity.id || i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    activity.status === "Error" ? "bg-red-500" :
                    activity.status === "Warning" ? "bg-amber-500" :
                    activity.status === "Success" ? "bg-green-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.action}</p>
                    {activity.details && <p className="text-xs text-slate-500 truncate">{activity.details}</p>}
                    <p className="text-xs text-slate-400">{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
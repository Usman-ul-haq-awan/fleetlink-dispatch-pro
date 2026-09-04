import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Truck, Search, Mail, Phone, UserCheck, ClipboardCheck, AlertCircle, CheckCircle, Clock, ShieldCheck, RefreshCw, Loader2, Star } from "lucide-react";
import ResearchCriteriaChart from "@/components/ResearchCriteriaChart";
import FollowUpLeadsTable from "@/components/FollowUpLeadsTable";
import AllocationSection from "@/components/AllocationSection";
import ToolsPanel from "@/components/tools/ToolsPanel";
import { listAllCarriers, listCarriersForUser, listAllEmailLogs } from "@/lib/paginatedList";
import { RATING_COLORS, RATING_DOT, scoreBroker } from "@/lib/brokerScoring";
import { useEntity } from "@/lib/entityContext";
import { subscribe as subscribeAudit } from "@/lib/auditRunner";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, researched: 0, failed: 0, qualified: 0, reviewRequired: 0,
    highRisk: 0, readyForOutreach: 0, emailsSent: 0, emailsReplied: 0,
    callsMade: 0, interested: 0, callbacks: 0, handoffs: 0, onboarding: 0, activeClients: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [followUpCarriers, setFollowUpCarriers] = useState([]);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [leadCarriers, setLeadCarriers] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [rescanningBroker, setRescanningBroker] = useState(null);
  const { isVisitor } = useEntity();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) loadDashboard(currentUser);
  }, [currentUser]);

  // Refresh dashboard stats when the Authorized Authority Audit removes
  // carriers or finishes — otherwise the dashboard shows stale counts until
  // you navigate away and back. The audit runner is a module-level singleton,
  // so this subscription works even if the audit was started on another page.
  const prevAuditRunning = useRef(false);
  const prevAuditRemoved = useRef(0);
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeAudit((snap) => {
      if (prevAuditRunning.current && !snap.running) loadDashboard(currentUser);
      if (snap.running && snap.progress.removed > prevAuditRemoved.current) loadDashboard(currentUser);
      prevAuditRunning.current = snap.running;
      prevAuditRemoved.current = snap.progress.removed;
    });
    return unsub;
  }, [currentUser]);

  const loadFollowUp = async (user) => {
    setLoadingFollowUp(true);
    try {
      const isAdmin = user?.role === "admin";
      let carriers = (!isAdmin && user)
        ? await listCarriersForUser(user.id, "-updated_date")
        : await listAllCarriers("-updated_date");
      setFollowUpCarriers(carriers.filter(c => {
        const s = Array.isArray(c.staff_lead_status) ? c.staff_lead_status : (c.staff_lead_status ? [c.staff_lead_status] : []);
        return s.includes("Follow-up");
      }));
    } catch (err) {
      console.error("Follow-up load error:", err);
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const loadLeads = async (user) => {
    setLoadingLeads(true);
    try {
      const isAdmin = user?.role === "admin";
      let carriers = (!isAdmin && user)
        ? await listCarriersForUser(user.id, "-updated_date")
        : await listAllCarriers("-updated_date");
      setLeadCarriers(carriers.filter(c => {
        const s = Array.isArray(c.staff_lead_status) ? c.staff_lead_status : (c.staff_lead_status ? [c.staff_lead_status] : []);
        return s.includes("Lead");
      }));
    } catch (err) {
      console.error("Leads load error:", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === "followup") loadFollowUp(currentUser);
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser && activeTab === "leads") loadLeads(currentUser);
  }, [currentUser, activeTab]);

  const loadBrokers = async () => {
    setLoadingBrokers(true);
    try {
      const all = await base44.entities.Broker.list("-vetting_date", 500);
      setBrokers(all);
    } catch (err) {
      console.error("Broker load error:", err);
    } finally {
      setLoadingBrokers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "brokers" && !isVisitor) loadBrokers();
  }, [activeTab, isVisitor]);

  const rescanBroker = async (b) => {
    setRescanningBroker(b.id);
    try {
      const { score, rating } = scoreBroker(b);
      await base44.entities.Broker.update(b.id, {
        vetting_score: score,
        vetting_rating: rating,
        vetting_date: new Date().toISOString(),
      });
      setBrokers(prev => prev.map(x => x.id === b.id ? { ...x, vetting_score: score, vetting_rating: rating } : x));
    } catch (err) {
      alert("Re-scan failed: " + (err.message || ""));
    } finally {
      setRescanningBroker(null);
    }
  };

  const loadDashboard = async (user) => {
    try {
      const isAdmin = user?.role === "admin";
      // Staff (non-admin) only fetch carriers allocated to them (server-side filter)
      let carriers = (!isAdmin && user)
        ? await listCarriersForUser(user.id, "-updated_date")
        : await listAllCarriers("-updated_date");
      // Visitors must not see company data — skip all operational fetches so
      // stat cards render as 0 and recent activity stays empty.
      const emails = isVisitor ? [] : await listAllEmailLogs("-sent_at");
      const calls = isVisitor ? [] : await base44.entities.CallLog.list("-call_date", 200);
      const handoffs = isVisitor ? [] : await base44.entities.Handoff.list("-created_at", 100);
      const onboardingRecords = isVisitor ? [] : await base44.entities.Onboarding.list("-updated_at", 200);
      const activity = isVisitor ? [] : await base44.entities.ActivityLog.list("-timestamp", 15);

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
    { label: "Researched", value: stats.researched, icon: Search, color: "indigo", to: "/research" },
    { label: "Research Failures", value: stats.failed, icon: AlertCircle, color: "red", to: "/research" },
    { label: "Qualified", value: stats.qualified, icon: CheckCircle, color: "green", to: "/carriers?safety=Qualified" },
    { label: "Review Required", value: stats.reviewRequired, icon: Clock, color: "amber" },
    { label: "High Risk", value: stats.highRisk, icon: AlertCircle, color: "red" },
    { label: "Ready for Outreach", value: stats.readyForOutreach, icon: Mail, color: "blue", to: "/outreach?tab=ready" },
    { label: "Emails Sent", value: stats.emailsSent, icon: Mail, color: "indigo", to: "/outreach?tab=sent" },
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
        <p className="text-slate-500 text-sm mt-1">
          {currentUser?.role === "admin"
            ? "Carrier dispatch operations overview"
            : `Your allocated carriers — ${stats.total} assigned to you`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("followup")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "followup"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Follow-up
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "leads"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Leads
        </button>
        <button
          onClick={() => setActiveTab("brokers")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "brokers"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Vetted Brokers
        </button>
        {currentUser?.role === "admin" && (
          <button
            onClick={() => setActiveTab("allocations")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "allocations"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Allocations
          </button>
        )}
        <button
          onClick={() => setActiveTab("tools")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "tools"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Tools
        </button>
      </div>

      {activeTab === "overview" ? (
      <>
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
      </>
      ) : activeTab === "followup" ? (
        <FollowUpLeadsTable carriers={followUpCarriers} loading={loadingFollowUp} emptyText='No follow-ups. Mark carriers as "Follow-up" from their detail page to see them here.' />
      ) : activeTab === "leads" ? (
        <FollowUpLeadsTable carriers={leadCarriers} loading={loadingLeads} icon={Star} emptyText='No leads yet. Mark carriers as "Lead" from their detail page to see them here.' />
      ) : activeTab === "allocations" ? (
        <AllocationSection />
      ) : activeTab === "tools" ? (
        <ToolsPanel />
      ) : (
        <BrokersTable brokers={brokers} loading={loadingBrokers} onRescan={rescanBroker} rescanning={rescanningBroker} />
      )}
    </div>
  );
}

function BrokersTable({ brokers, loading, onRescan, rescanning }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (brokers.length === 0) {
    return (
      <div className="text-center py-20">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No brokers yet. Sync brokers from the Broker Vetting page.</p>
        <Link to="/brokers" className="inline-block mt-3 text-blue-600 text-sm font-medium hover:underline">Go to Broker Vetting →</Link>
      </div>
    );
  }
  const approved = brokers.filter(b => b.vetting_rating === "Approved").length;
  const caution = brokers.filter(b => b.vetting_rating === "Approved with Caution").length;
  const highRisk = brokers.filter(b => b.vetting_rating === "High Risk").length;
  const doNotUse = brokers.filter(b => b.vetting_rating === "Do Not Use").length;
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border p-4 bg-green-50 text-green-700 border-green-200">
          <div className="flex items-center justify-between mb-1"><ShieldCheck className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{approved}</span></div>
          <p className="text-xs font-medium opacity-80">Approved</p>
        </div>
        <div className="rounded-lg border p-4 bg-yellow-50 text-yellow-700 border-yellow-200">
          <div className="flex items-center justify-between mb-1"><ShieldCheck className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{caution}</span></div>
          <p className="text-xs font-medium opacity-80">Approved with Caution</p>
        </div>
        <div className="rounded-lg border p-4 bg-orange-50 text-orange-700 border-orange-200">
          <div className="flex items-center justify-between mb-1"><AlertCircle className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{highRisk}</span></div>
          <p className="text-xs font-medium opacity-80">High Risk</p>
        </div>
        <div className="rounded-lg border p-4 bg-red-50 text-red-700 border-red-200">
          <div className="flex items-center justify-between mb-1"><AlertCircle className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{doNotUse}</span></div>
          <p className="text-xs font-medium opacity-80">Do Not Use</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-auto">
        <table className="min-w-full w-max text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              {["Broker","MC","State","Authority","Score","Rating","Status","Last Vetted",""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brokers.map(b => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link to="/brokers" className="text-left hover:text-blue-600 hover:underline">{b.broker_name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{b.mc_number || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{b.state || "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{b.authority_status || "Not Verified"}</td>
                <td className="px-4 py-3 text-center font-semibold text-slate-700">{b.vetting_score ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${RATING_COLORS[b.vetting_rating]||RATING_COLORS["Not Scored"]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${RATING_DOT[b.vetting_rating]||RATING_DOT["Not Scored"]}`} />{b.vetting_rating||"Not Scored"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{b.vetting_status || "Pending"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{b.vetting_date ? new Date(b.vetting_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onRescan(b)} disabled={rescanning === b.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg disabled:opacity-50">
                    {rescanning === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Re-scan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Loader2, TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";

// Cold Email daily counter dashboard — shows the global 50/day limit usage.
// Only cold_outreach emails count toward the limit.
export default function ColdEmailStatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await base44.functions.invoke("getColdEmailStats", {});
      setStats(res.data);
    } catch (err) {
      console.error("Cold email stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!stats || stats.error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <p className="text-sm text-slate-400">Unable to load cold email stats.</p>
      </div>
    );
  }

  const pct = stats.limit > 0 ? Math.min(100, (stats.sent_today / stats.limit) * 100) : 0;
  const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-blue-600" />
        Cold Email Outreach — Daily Counter
      </h3>

      {/* Main counter */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-3xl font-bold text-slate-900">
            {stats.sent_today}
            <span className="text-lg text-slate-400"> / {stats.limit}</span>
          </span>
          <span className={`text-sm font-medium ${stats.remaining_today > 0 ? "text-green-600" : "text-red-600"}`}>
            {stats.remaining_today > 0 ? `${stats.remaining_today} remaining today` : "Limit reached"}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Sub-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Queued</p>
            <p className="text-lg font-bold text-slate-900">{stats.queued}</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Failed</p>
            <p className="text-lg font-bold text-slate-900">{stats.failed}</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Drafts</p>
            <p className="text-lg font-bold text-slate-900">{stats.drafts || 0}</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">This Month</p>
            <p className="text-lg font-bold text-slate-900">{stats.sent_this_month}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Only cold outreach emails count toward the {stats.limit}/day limit. Transactional, onboarding, and other emails are unaffected.
      </p>
    </div>
  );
}
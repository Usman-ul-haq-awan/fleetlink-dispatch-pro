import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Filter } from "lucide-react";

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.ActivityLog.list("-timestamp", 200);
      setActivities(all);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter ? activities.filter(a => a.status === statusFilter) : activities;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity / Audit Log</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} records</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
          <option value="">All Statuses</option>
          <option value="Success">Success</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No activity records.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  a.status === "Error" ? "bg-red-500" :
                  a.status === "Warning" ? "bg-amber-500" :
                  a.status === "Success" ? "bg-green-500" : "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{a.action}</p>
                    <span className="text-xs text-slate-400">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}</span>
                  </div>
                  {a.details && <p className="text-sm text-slate-500 mt-0.5">{a.details}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {a.workflow && <span className="text-xs text-slate-400">Workflow: {a.workflow}</span>}
                    {a.source_url && <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Source</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { listAllCarriers } from "@/lib/paginatedList";
import { Users, Calendar, ChevronDown, ChevronRight, Truck, UserCircle } from "lucide-react";

// Groups allocated carriers by sales agent, showing each agent's allocation
// date(s) and the carriers assigned to them. Admin-only — staff only see their
// own carriers, so a per-agent breakdown isn't meaningful for them.
export default function AllocationSection() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [usersById, setUsersById] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [carriers, users] = await Promise.all([
        listAllCarriers("-assigned_date"),
        base44.entities.User.list("-created_date", 500).catch(() => []),
      ]);
      const byId = {};
      users.forEach(u => { byId[u.id] = u; });
      setUsersById(byId);

      // Only carriers that have been allocated (assigned_to_user_id set)
      const allocated = carriers.filter(c => c.assigned_to_user_id);

      // Group by agent
      const groups = {};
      allocated.forEach(c => {
        const key = c.assigned_to_user_id;
        if (!groups[key]) groups[key] = { agent_id: key, carriers: [] };
        groups[key].carriers.push(c);
      });

      // Build agent rows with summary stats
      const rows = Object.values(groups).map(g => {
        const dates = g.carriers
          .map(c => c.assigned_date)
          .filter(Boolean)
          .map(d => new Date(d))
          .sort((a, b) => a - b);
        const user = byId[g.agent_id];
        return {
          agent_id: g.agent_id,
          agent_name: user?.full_name || user?.email || "Unknown Agent",
          agent_email: user?.email || "",
          carrier_count: g.carriers.length,
          first_allocated: dates.length ? dates[0].toISOString() : null,
          last_allocated: dates.length ? dates[dates.length - 1].toISOString() : null,
          carriers: g.carriers.sort((a, b) => new Date(b.assigned_date || 0) - new Date(a.assigned_date || 0)),
        };
      }).sort((a, b) => b.carrier_count - a.carrier_count);

      setAgents(rows);
    } catch (err) {
      console.error("Allocation load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No carriers have been allocated to sales agents yet.</p>
        <p className="text-xs text-slate-400 mt-1">Allocate carriers from the Carrier Database to see them here.</p>
      </div>
    );
  }

  const totalAllocated = agents.reduce((s, a) => s + a.carrier_count, 0);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border p-4 bg-blue-50 text-blue-700 border-blue-200">
          <div className="flex items-center justify-between mb-1"><Users className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{agents.length}</span></div>
          <p className="text-xs font-medium opacity-80">Active Agents</p>
        </div>
        <div className="rounded-lg border p-4 bg-indigo-50 text-indigo-700 border-indigo-200">
          <div className="flex items-center justify-between mb-1"><Truck className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{totalAllocated}</span></div>
          <p className="text-xs font-medium opacity-80">Total Allocated</p>
        </div>
        <div className="rounded-lg border p-4 bg-green-50 text-green-700 border-green-200">
          <div className="flex items-center justify-between mb-1"><UserCircle className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{agents[0]?.carrier_count || 0}</span></div>
          <p className="text-xs font-medium opacity-80">Top Agent Load</p>
        </div>
        <div className="rounded-lg border p-4 bg-amber-50 text-amber-700 border-amber-200">
          <div className="flex items-center justify-between mb-1"><Calendar className="w-5 h-5 opacity-70" /><span className="text-2xl font-bold">{agents.filter(a => a.last_allocated && (Date.now() - new Date(a.last_allocated).getTime()) < 7 * 86400000).length}</span></div>
          <p className="text-xs font-medium opacity-80">Active This Week</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600 w-8"></th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Sales Agent</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Carriers</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">First Allocated</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Last Allocated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.map(agent => (
              <AgentRow
                key={agent.agent_id}
                agent={agent}
                expanded={expanded === agent.agent_id}
                onToggle={() => setExpanded(expanded === agent.agent_id ? null : agent.agent_id)}
                fmtDate={fmtDate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentRow({ agent, expanded, onToggle, fmtDate }) {
  return (
    <>
      <tr className="hover:bg-slate-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 text-slate-400">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
              {(agent.agent_name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900">{agent.agent_name}</p>
              {agent.agent_email && <p className="text-xs text-slate-400">{agent.agent_email}</p>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {agent.carrier_count}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(agent.first_allocated)}</td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(agent.last_allocated)}</td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td></td>
          <td colSpan={4} className="px-4 pb-4 pt-2">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Carrier</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">USDOT</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">MC</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">State</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Allocated On</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agent.carriers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link to={`/carriers/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                          {c.legal_name || c.dba_name || "Unknown"}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{c.usdot_number || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{c.mc_number || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{c.state || "—"}</td>
                      <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{fmtDate(c.assigned_date)}</td>
                      <td className="px-4 py-2 text-slate-600 text-xs">{c.lead_status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
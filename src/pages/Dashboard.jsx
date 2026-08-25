import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Truck, Search, ShieldCheck, Mail, Phone, UserCheck, ClipboardCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const carriers = await base44.entities.Carrier.list('-created_date', 2000);
      const emails = await base44.entities.EmailLog.list('-created_date', 500);
      const calls = await base44.entities.CallLog.list('-created_date', 500);
      const handoffs = await base44.entities.Handoff.filter({ is_hot_lead: true }, '-created_date', 100);
      const onboardings = await base44.entities.Onboarding.list('-created_date', 500);
      const activity = await base44.entities.ActivityLog.list('-timestamp', 10);

      const today = new Date().toISOString().slice(0, 10);

      setStats({
        totalCarriers: carriers.length,
        researched: carriers.filter(c => c.research_status === 'Complete' || c.last_researched_at).length,
        researchFailures: carriers.filter(c => c.lead_status === 'Failed').length,
        qualified: carriers.filter(c => c.safety_qualification === 'Qualified').length,
        reviewRequired: carriers.filter(c => c.safety_qualification === 'Review Required').length,
        highRisk: carriers.filter(c => c.safety_qualification === 'High Risk').length,
        readyForOutreach: carriers.filter(c => c.lead_status === 'Ready for Outreach' || c.lead_status === 'Qualified').length,
        emailsSent: emails.filter(e => e.status === 'Sent' || e.direction === 'Outbound').length,
        emailsReplied: emails.filter(e => e.status === 'Replied').length,
        callsMade: calls.filter(c => c.status === 'Completed').length,
        interested: carriers.filter(c => c.lead_status === 'Interested').length,
        callbacks: calls.filter(c => c.outcome === 'Callback Requested').length,
        handoffs: handoffs.filter(h => h.status === 'New').length,
        onboarding: onboardings.filter(o => !['Active Client', 'Lost'].includes(o.onboarding_status)).length,
        activeClients: onboardings.filter(o => o.onboarding_status === 'Active Client').length,
        todayQueued: carriers.filter(c => c.lead_status === 'Queued').length,
        todayProcessed: carriers.filter(c => c.last_researched_at && c.last_researched_at.slice(0, 10) === today).length,
        emailsQueued: emails.filter(e => e.status === 'Queued').length,
        callsQueued: calls.filter(c => c.status === 'Queued').length,
        hotLeads: handoffs.filter(h => h.status === 'New').length,
        errors: carriers.filter(c => c.lead_status === 'Failed').length,
      });
      setRecentActivity(activity);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading dashboard: {error}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Carriers', value: stats.totalCarriers, icon: Truck, color: 'text-blue-600' },
    { label: 'Researched', value: stats.researched, icon: Search, color: 'text-indigo-600' },
    { label: 'Research Failures', value: stats.researchFailures, icon: AlertCircle, color: 'text-red-600' },
    { label: 'Qualified', value: stats.qualified, icon: ShieldCheck, color: 'text-green-600' },
    { label: 'Review Required', value: stats.reviewRequired, icon: AlertCircle, color: 'text-amber-600' },
    { label: 'High Risk', value: stats.highRisk, icon: AlertCircle, color: 'text-red-600' },
    { label: 'Ready for Outreach', value: stats.readyForOutreach, icon: Mail, color: 'text-cyan-600' },
    { label: 'Emails Sent', value: stats.emailsSent, icon: Mail, color: 'text-blue-600' },
    { label: 'Emails Replied', value: stats.emailsReplied, icon: Mail, color: 'text-green-600' },
    { label: 'Calls Made', value: stats.callsMade, icon: Phone, color: 'text-purple-600' },
    { label: 'Interested', value: stats.interested, icon: UserCheck, color: 'text-emerald-600' },
    { label: 'Callbacks', value: stats.callbacks, icon: Phone, color: 'text-cyan-600' },
    { label: 'Human Handoffs', value: stats.handoffs, icon: UserCheck, color: 'text-orange-600' },
    { label: 'Onboarding', value: stats.onboarding, icon: ClipboardCheck, color: 'text-violet-600' },
    { label: 'Active Clients', value: stats.activeClients, icon: ShieldCheck, color: 'text-green-600' },
  ];

  const todayCards = [
    { label: 'Carriers Queued', value: stats.todayQueued },
    { label: 'Carriers Processed', value: stats.todayProcessed },
    { label: 'Emails Queued', value: stats.emailsQueued },
    { label: 'Calls Queued', value: stats.callsQueued },
    { label: 'Hot Leads', value: stats.hotLeads },
    { label: 'Errors', value: stats.errors },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Carrier dispatch operations overview</p>
      </div>

      {/* Today's Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {todayCards.map((tc) => (
              <div key={tc.label} className="text-center">
                <p className="text-2xl font-bold">{tc.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{tc.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((sc) => {
          const Icon = sc.icon;
          return (
            <Card key={sc.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${sc.color}`} />
                </div>
                <p className="text-2xl font-bold">{sc.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sc.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm py-2 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    a.status === 'Error' ? 'bg-red-500' : a.status === 'Success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.action}</p>
                    {a.details && <p className="text-xs text-muted-foreground truncate">{a.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link to="/carriers"><Button variant="outline">View Carriers</Button></Link>
        <Link to="/import"><Button>Import Carriers</Button></Link>
      </div>
    </div>
  );
}
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Database, Search, ShieldCheck, ShieldAlert, Mail, Phone,
  UserCheck, ClipboardCheck, Download, Activity, Settings, LogOut,
  Truck, Send, Menu, X, Calculator, GraduationCap
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import ChatWithUs from "@/components/ChatWithUs";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Carrier Database", path: "/carriers", icon: Database },
  { label: "Carrier Research", path: "/research", icon: Search },
  { label: "Email Campaigns", path: "/campaigns", icon: Mail },
  { label: "Email Engine", path: "/email-testing", icon: Send },
  { label: "Calling Queue", path: "/calling", icon: Phone },
  { label: "Human Handoff", path: "/handoffs", icon: UserCheck },
  { label: "Onboarding", path: "/onboarding", icon: ClipboardCheck },
  { label: "Broker Vetting", path: "/brokers", icon: ShieldAlert },
  { label: "Import / Export", path: "/import-export", icon: Download },
  { label: "Activity Log", path: "/activity", icon: Activity },
  { label: "Dispatch Tools", path: "/tools", icon: Calculator },
  { label: "Quiz Hub", path: "/quiz-hub", icon: GraduationCap },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [outreachEnabled, setOutreachEnabled] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.AppSetting.filter({ setting_key: "outreach_enabled" })
      .then(res => { if (res.length > 0) setOutreachEnabled(res[0].setting_value === "true"); })
      .catch(() => {});
  }, []);

  // Close the mobile sidebar on route change
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isAdmin = user?.role === "admin";
  const staffAllowedPaths = ["/", "/carriers", "/tools"];
  const visibleNav = navItems.filter(item => {
    // Staff (non-admin) only see Dashboard and Carrier Database.
    if (!isAdmin) return staffAllowedPaths.includes(item.path);
    // Admin sees everything, gated by outreach toggle for campaigns/calling.
    return (outreachEnabled || (item.path !== "/campaigns" && item.path !== "/calling")) &&
      (item.path !== "/settings" || isAdmin);
  });

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Dispatch CRM</h1>
            <p className="text-xs text-slate-400">Carrier Management</p>
          </div>
        </div>
        {/* Close button — only visible when sidebar is a slide-over (mobile/tablet) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white border-r-2 border-blue-400"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-3 border-t border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Notifications</span>
          <NotificationBell dark />
        </div>
        {user && (
          <div className="mb-2">
            <p className="text-sm text-white font-medium">{user.full_name || user.email}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role === "admin" ? "Admin" : "Staff"}</p>
          </div>
        )}
        <div className="mb-3 pt-2 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-0.5">Project Admin</p>
          <p className="text-xs text-slate-300 font-medium">Usman UL Haq</p>
          <p className="text-xs text-slate-400">03114111899</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile/tablet backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, slide-over on smaller screens */}
      <aside
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 z-40 transition-transform duration-200 ease-in-out
          fixed lg:static inset-y-0 left-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {SidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Top bar with hamburger — visible on tablet/mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Truck className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900">Dispatch CRM</span>
          </div>
          <NotificationBell />
        </div>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <ChatWithUs />
    </div>
  );
}
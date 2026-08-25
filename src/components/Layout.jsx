import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Database, Search, ShieldCheck, Mail, Phone,
  UserCheck, ClipboardCheck, Download, Activity, Settings, LogOut,
  Truck
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Carrier Database", path: "/carriers", icon: Database },
  { label: "Carrier Research", path: "/research", icon: Search },
  { label: "Email Campaigns", path: "/campaigns", icon: Mail },
  { label: "Calling Queue", path: "/calling", icon: Phone },
  { label: "Human Handoff", path: "/handoffs", icon: UserCheck },
  { label: "Onboarding", path: "/onboarding", icon: ClipboardCheck },
  { label: "Import / Export", path: "/import-export", icon: Download },
  { label: "Activity Log", path: "/activity", icon: Activity },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Truck className="w-7 h-7 text-blue-400" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Dispatch CRM</h1>
              <p className="text-xs text-slate-400">Carrier Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map(item => {
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
          {user && (
            <div className="mb-2">
              <p className="text-sm text-white font-medium">{user.full_name || user.email}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role || "user"}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
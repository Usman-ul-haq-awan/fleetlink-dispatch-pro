import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Send, Megaphone } from "lucide-react";

// Bell icon with unread badge + dropdown. Admins can broadcast announcements
// to all staff; everyone sees notifications targeted to their role.
export default function NotificationBell({ dark = false }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [bTitle, setBTitle] = useState("");
  const [bMsg, setBMsg] = useState("");
  const [sending, setSending] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = async () => {
    try {
      const all = await base44.entities.AppNotification.list("-created_date", 50);
      setNotifications(all);
    } catch {}
  };

  const visible = notifications.filter(n => {
    if (!user) return false;
    if (n.type === "support" && user.role !== "admin") return false;
    if (n.target_role === "admin" && user.role !== "admin") return false;
    if (n.target_role === "user" && user.role !== "user") return false;
    return true;
  });

  const unread = visible.filter(n => {
    const read = (n.read_by || "").split(",").filter(Boolean);
    return !read.includes(user?.id);
  }).length;

  const markRead = async (id) => {
    if (!user) return;
    const n = notifications.find(x => x.id === id);
    if (!n) return;
    const read = (n.read_by || "").split(",").filter(Boolean);
    if (read.includes(user.id)) return;
    read.push(user.id);
    await base44.entities.AppNotification.update(id, { read_by: read.join(",") });
    load();
  };

  const markAllRead = async () => {
    for (const n of visible) {
      const read = (n.read_by || "").split(",").filter(Boolean);
      if (!read.includes(user.id)) await markRead(n.id);
    }
  };

  const sendBroadcast = async () => {
    if (!bTitle.trim() || !bMsg.trim()) return;
    setSending(true);
    try {
      await base44.entities.AppNotification.create({
        title: bTitle,
        message: bMsg,
        type: "broadcast",
        target_role: "all",
        from_user_id: user?.id,
        from_user_name: user?.full_name || user?.email,
      });
      setBTitle("");
      setBMsg("");
      setShowBroadcast(false);
      load();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const btnBase = dark
    ? "text-slate-300 hover:text-white hover:bg-slate-800"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={`relative p-1.5 rounded-md transition-colors ${btnBase}`} aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden ${dark ? "lg:right-0" : ""}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <button onClick={() => setShowBroadcast(!showBroadcast)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Megaphone className="w-3.5 h-3.5" /> Broadcast
                </button>
              )}
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-700">Mark all read</button>
              )}
            </div>
          </div>

          {showBroadcast && user?.role === "admin" && (
            <div className="p-3 border-b border-slate-200 bg-blue-50 space-y-2">
              <input value={bTitle} onChange={e => setBTitle(e.target.value)} placeholder="Announcement title" className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md" />
              <textarea value={bMsg} onChange={e => setBMsg(e.target.value)} placeholder="Message to all staff..." rows={2} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md resize-none" />
              <div className="flex gap-2">
                <button onClick={sendBroadcast} disabled={sending || !bTitle.trim() || !bMsg.trim()} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  <Send className="w-3 h-3" /> Send
                </button>
                <button onClick={() => setShowBroadcast(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">Cancel</button>
              </div>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No notifications</p>
            ) : (
              visible.map(n => {
                const read = (n.read_by || "").split(",").filter(Boolean);
                const isRead = read.includes(user?.id);
                return (
                  <div key={n.id} onClick={() => markRead(n.id)} className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${!isRead ? "bg-blue-50/50" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 break-words">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {n.from_user_name ? `From ${n.from_user_name} · ` : ""}{new Date(n.created_at || n.created_date).toLocaleString()}
                        </p>
                      </div>
                      {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
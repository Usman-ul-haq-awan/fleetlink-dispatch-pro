import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send } from "lucide-react";

// Floating "Chat with Admin" button visible on every page. Shows a full
// conversation thread between the staff member and admin — staff messages
// (type "support" from this user) and admin replies (type "reply" targeted
// to this user) — with an inline reply box so the conversation continues
// without re-opening the panel each time.
export default function ChatWithUs() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const loadThread = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all notifications, then filter to this user's conversation.
      const all = await base44.entities.AppNotification.list("-created_date", 100);
      const mine = all.filter(n =>
        // Messages this staff member sent to admin
        (n.type === "support" && n.from_user_id === user.id) ||
        // Replies from admin targeted to this staff member
        (n.type === "reply" && n.target_user_id === user.id)
      );
      // Sort oldest-first for chat display
      mine.sort((a, b) => new Date(a.created_at || a.created_date) - new Date(b.created_at || b.created_date));
      setThread(mine);
    } catch {}
    finally { setLoading(false); }
  };

  // Refresh thread when panel opens, then poll every 15s while open
  useEffect(() => {
    if (open && user) {
      loadThread();
      const id = setInterval(loadThread, 15000);
      return () => clearInterval(id);
    }
  }, [open, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread, open]);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await base44.entities.AppNotification.create({
        title: `Support request from ${user?.full_name || user?.email || "Staff member"}`,
        message: message,
        type: "support",
        target_role: "admin",
        from_user_id: user?.id,
        from_user_name: user?.full_name || user?.email,
      });
      setMessage("");
      loadThread();
    } catch (err) {
      alert("Failed to send: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Chat with admin"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
          <div className="bg-blue-600 text-white px-4 py-3 flex-shrink-0">
            <h3 className="font-semibold text-sm">Chat with Admin</h3>
            <p className="text-xs text-blue-100">Your conversation with the administrator</p>
          </div>

          {/* Conversation thread */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 min-h-[200px]">
            {loading && thread.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : thread.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1">Send a message below to start the conversation.</p>
              </div>
            ) : (
              thread.map(n => {
                const isMine = n.type === "support" && n.from_user_id === user?.id;
                return (
                  <div key={n.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMine ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                      <p className="text-sm break-words whitespace-pre-wrap">{n.message}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-blue-100" : "text-slate-400"}`}>
                        {new Date(n.created_at || n.created_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply input — always visible at the bottom */}
          <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send)"
                rows={1}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-24"
              />
              <button
                onClick={send}
                disabled={sending || !message.trim()}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
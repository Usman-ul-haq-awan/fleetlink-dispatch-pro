import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, CheckCircle } from "lucide-react";

// Floating "Chat with Admin" button visible on every page. Staff type a
// message → it creates an AppNotification targeted to the admin role.
export default function ChatWithUs() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      alert("Failed to send: " + err.message);
    } finally {
      setSending(false);
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
        <div className="fixed bottom-24 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3">
            <h3 className="font-semibold text-sm">Chat with Admin</h3>
            <p className="text-xs text-blue-100">Send a message to your administrator</p>
          </div>
          <div className="p-4">
            {sent ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-slate-700 font-medium">Message sent!</p>
                <p className="text-xs text-slate-500 mt-1">Admin will see your message in their notifications.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={send}
                  disabled={sending || !message.trim()}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Message"}
                  <Send className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
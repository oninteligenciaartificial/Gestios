"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Check, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface NotifResponse {
  notifications: Notification[];
  unreadCount: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  return `${days}d`;
}

const TYPE_COLORS: Record<string, string> = {
  stock_bajo: "text-red-400",
  pedido_actualizado: "text-blue-400",
  plan_vence: "text-yellow-400",
  custom: "text-brand-muted",
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotifResponse>({ notifications: [], unreadCount: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setData(await res.json() as NotifResponse);
    } catch { /* silent */ }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markRead(notif: Notification) {
    if (!notif.read) {
      await fetch(`/api/notifications/${notif.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      setData((prev) => ({
        notifications: prev.notifications.map((n) =>
          n.id === notif.id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setData((prev) => ({
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-kinetic-orange text-black text-[10px] font-bold flex items-center justify-center leading-none">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-sm font-bold text-white">Notificaciones</span>
            <div className="flex items-center gap-2">
              {data.unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-brand-muted hover:text-white transition-colors"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={13} /> Todo leído
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-brand-muted hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-brand-muted/40 mx-auto mb-2" />
                <p className="text-sm text-brand-muted">Sin notificaciones nuevas</p>
              </div>
            ) : (
              data.notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0 ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-kinetic-orange flex-shrink-0" />
                      )}
                      <p className={`text-xs font-semibold truncate ${TYPE_COLORS[n.type] ?? "text-white"}`}>
                        {n.title}
                      </p>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-brand-muted/60 flex-shrink-0 mt-0.5">
                    {timeAgo(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          {data.notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/8">
              <button
                onClick={() => { setOpen(false); router.push("/notifications"); }}
                className="text-xs text-brand-kinetic-orange hover:underline"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

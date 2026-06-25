"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, X } from "lucide-react";

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
  nuevo_pedido: "text-brand-kinetic-orange",
  stock_bajo: "text-red-400",
  pedido_actualizado: "text-blue-400",
  plan_vence: "text-yellow-400",
  custom: "text-brand-muted",
};

const PANEL_GAP = 8;
const PANEL_MARGIN = 8;
const PANEL_MAX_WIDTH = 352;
const PANEL_MIN_WIDTH = 288;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotifResponse>({ notifications: [], unreadCount: 0 });
  const [panelPosition, setPanelPosition] = useState({ top: 56, left: 8, width: PANEL_MIN_WIDTH });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button || typeof window === "undefined") return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, window.innerWidth - PANEL_MARGIN * 2));
    const left = Math.min(
      Math.max(PANEL_MARGIN, rect.right - width),
      Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN)
    );
    const top = Math.min(
      rect.bottom + PANEL_GAP,
      Math.max(PANEL_MARGIN, window.innerHeight - PANEL_MARGIN)
    );

    setPanelPosition({ top, left, width });
  }, []);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) setData(await res.json() as NotifResponse);
    } catch {
      /* silent */
    }
  }, []);

  // Initial fetch + polling every 30s (paused while tab hidden)
  useEffect(() => {
    const initialId = window.setTimeout(fetchNotifs, 0);
    let id = window.setInterval(fetchNotifs, 30000);
    function onVisibility() {
      window.clearInterval(id);
      if (document.visibilityState === "visible") {
        fetchNotifs();
        id = window.setInterval(fetchNotifs, 30000);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("gestios-notifications-changed", fetchNotifs);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("gestios-notifications-changed", fetchNotifs);
    };
  }, [fetchNotifs]);

  useEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  // Close on outside click or Escape.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedPanel = panelRef.current?.contains(target);
      const clickedButton = buttonRef.current?.contains(target);
      if (!clickedPanel && !clickedButton) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
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

  const notificationPanel = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={panelRef}
          className="fixed bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
          style={{
            top: panelPosition.top,
            left: panelPosition.left,
            width: panelPosition.width,
            maxHeight: `calc(100vh - ${panelPosition.top + PANEL_MARGIN}px)`,
          }}
          role="dialog"
          aria-label="Lista de notificaciones"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-sm font-bold text-white">Notificaciones</span>
            <div className="flex items-center gap-2">
              {data.unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-brand-muted hover:text-white transition-colors"
                  title="Marcar todas como leidas"
                >
                  <CheckCheck size={13} /> Todo leido
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-brand-muted hover:text-white transition-colors"
                aria-label="Cerrar notificaciones"
                title="Cerrar notificaciones"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-brand-muted/40 mx-auto mb-2" />
                <p className="text-sm text-brand-muted">No tienes notificaciones todavia</p>
                <p className="text-xs text-brand-muted/60 mt-1 px-6">
                  Aqui apareceran pedidos, stock bajo y cambios importantes.
                </p>
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
          <div className="border-t border-white/8 p-3">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
              className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors"
            >
              Ver centro de notificaciones
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notificaciones"
        title="Notificaciones"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={18} />
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-kinetic-orange text-black text-[10px] font-bold flex items-center justify-center leading-none">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </button>
      {notificationPanel}
    </div>
  );
}

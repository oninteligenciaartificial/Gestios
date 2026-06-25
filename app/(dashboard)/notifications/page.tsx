"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CheckCheck, ExternalLink, Inbox, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

const TYPE_LABELS: Record<string, string> = {
  nuevo_pedido: "Pedido",
  pedido_actualizado: "Pedido",
  stock_bajo: "Stock",
  plan_vence: "Plan",
  custom: "Sistema",
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Sin leer" },
  { key: "orders", label: "Pedidos" },
  { key: "stock", label: "Stock" },
  { key: "system", label: "Sistema" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function actionLabel(notification: Notification): string {
  if (!notification.link) return notification.read ? "Leida" : "Marcar leida";
  if (notification.type === "stock_bajo") return "Revisar stock";
  if (notification.type === "nuevo_pedido" || notification.type === "pedido_actualizado") return "Abrir pedido";
  return "Abrir";
}

function matchesFilter(notification: Notification, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !notification.read;
  if (filter === "orders") return notification.type === "nuevo_pedido" || notification.type === "pedido_actualizado";
  if (filter === "stock") return notification.type === "stock_bajo";
  return notification.type === "custom" || notification.type === "plan_vence";
}

function notifyBellChanged() {
  window.dispatchEvent(new Event("gestios-notifications-changed"));
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const readCount = useMemo(() => items.filter((item) => item.read).length, [items]);
  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [filter, items]
  );
  const orderCount = useMemo(
    () => items.filter((item) => matchesFilter(item, "orders")).length,
    [items]
  );
  const stockCount = useMemo(
    () => items.filter((item) => item.type === "stock_bajo").length,
    [items]
  );

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications?limit=100", { cache: "no-store" });
      const data = await res.json() as NotificationsResponse | { error?: string };
      if (!res.ok || !("notifications" in data)) {
        throw new Error("No se pudieron cargar las notificaciones");
      }
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markRead(notification: Notification) {
    if (notification.read) return;
    setBusyId(notification.id);
    try {
      const res = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar");
      setItems((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyBellChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function openNotification(notification: Notification) {
    await markRead(notification);
    if (notification.link) router.push(notification.link);
  }

  async function markAllRead() {
    setBusyId("all");
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo actualizar");
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      notifyBellChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function removeNotification(notification: Notification) {
    setBusyId(notification.id);
    try {
      const res = await fetch(`/api/notifications/${notification.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setItems((prev) => prev.filter((item) => item.id !== notification.id));
      if (!notification.read) setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyBellChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-kinetic-orange/10">
              <Bell size={22} className="text-brand-kinetic-orange" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Notificaciones</h1>
              <p className="text-brand-muted text-sm mt-1">Pedidos, stock bajo, pagos y avisos operativos.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-white hover:border-white/25 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0 || busyId === "all"}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-brand-kinetic-orange px-4 text-sm font-bold text-black disabled:opacity-50"
          >
            <CheckCheck size={15} /> Todo leido
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-brand-muted text-xs font-bold uppercase tracking-wider">Total</p>
          <p className="text-3xl font-display font-bold text-white mt-2">{items.length}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-brand-muted text-xs font-bold uppercase tracking-wider">Sin leer</p>
          <p className="text-3xl font-display font-bold text-brand-kinetic-orange mt-2">{unreadCount}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-brand-muted text-xs font-bold uppercase tracking-wider">Leidas</p>
          <p className="text-3xl font-display font-bold text-brand-growth-neon mt-2">{readCount}</p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-panel rounded-2xl p-4 flex gap-3">
          <ShoppingCart size={18} className="mt-1 text-brand-kinetic-orange" />
          <div>
            <h2 className="font-bold text-white text-sm">Pedidos y ventas</h2>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Se registran al crear pedidos y al cambiar estados para que el equipo no dependa de memoria.
            </p>
            <p className="text-xs text-brand-kinetic-orange font-bold mt-2">{orderCount} aviso(s)</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={18} className="mt-1 text-red-400" />
          <div>
            <h2 className="font-bold text-white text-sm">Stock bajo</h2>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Se genera cuando un producto queda igual o por debajo de su minimo y evita duplicados sin leer.
            </p>
            <p className="text-xs text-red-300 font-bold mt-2">{stockCount} alerta(s)</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex gap-3">
          <Bell size={18} className="mt-1 text-yellow-300" />
          <div>
            <h2 className="font-bold text-white text-sm">Campana activa</h2>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              La campana consulta cada 30 segundos y tambien se actualiza cuando marcas o eliminas avisos.
            </p>
            <p className="text-xs text-yellow-200 font-bold mt-2">{unreadCount} sin leer</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="glass-panel rounded-2xl border border-red-500/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`min-h-[38px] rounded-xl px-3 text-xs font-bold transition-colors ${
              filter === item.key
                ? "bg-brand-kinetic-orange text-black"
                : "border border-white/10 text-brand-muted hover:border-white/25 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-brand-muted animate-pulse">Cargando notificaciones...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <Inbox size={34} className="mx-auto text-brand-muted/50 mb-3" />
            <h2 className="font-bold text-white">No hay notificaciones en este filtro</h2>
            <p className="text-sm text-brand-muted mt-1">Aqui apareceran pedidos, stock bajo y avisos importantes cuando existan.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/6">
            {filteredItems.map((notification) => (
              <article
                key={notification.id}
                className={`p-4 sm:p-5 flex gap-4 ${notification.read ? "opacity-65" : "bg-brand-kinetic-orange/[0.03]"}`}
              >
                <span className={`mt-2 h-2.5 w-2.5 rounded-full flex-shrink-0 ${notification.read ? "bg-white/20" : "bg-brand-kinetic-orange"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/7 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                      {TYPE_LABELS[notification.type] ?? "Sistema"}
                    </span>
                    <span className="text-xs text-brand-muted">{formatDate(notification.createdAt)}</span>
                  </div>
                  <h2 className="text-white font-bold mt-2">{notification.title}</h2>
                  <p className="text-sm text-brand-muted mt-1 leading-relaxed">{notification.body}</p>
                  <div className="mt-3 sm:hidden">
                    <button
                      onClick={() => openNotification(notification)}
                      disabled={busyId === notification.id}
                      className="inline-flex min-h-[36px] items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {notification.link ? <ExternalLink size={14} /> : <CheckCheck size={14} />}
                      {actionLabel(notification)}
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => openNotification(notification)}
                    disabled={busyId === notification.id}
                    className="w-9 h-9 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:border-white/25 flex items-center justify-center disabled:opacity-50"
                    title={notification.link ? "Abrir" : "Marcar como leida"}
                    aria-label={notification.link ? "Abrir notificacion" : "Marcar como leida"}
                  >
                    {notification.link ? <ExternalLink size={15} /> : <CheckCheck size={15} />}
                  </button>
                  <button
                    onClick={() => removeNotification(notification)}
                    disabled={busyId === notification.id}
                    className="w-9 h-9 rounded-xl border border-white/10 text-brand-muted hover:text-red-300 hover:border-red-500/30 flex items-center justify-center disabled:opacity-50"
                    title="Eliminar"
                    aria-label="Eliminar notificacion"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

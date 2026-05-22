"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, LogOut, Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SessionItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  userAgent: string | null;
  isCurrent: boolean;
}

function parseDevice(ua: string | null): { label: string; icon: React.ReactNode } {
  if (!ua) return { label: "Dispositivo desconocido", icon: <Monitor size={16} /> };
  const lower = ua.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad/.test(lower);
  const browser = lower.includes("chrome") ? "Chrome"
    : lower.includes("firefox") ? "Firefox"
    : lower.includes("safari") ? "Safari"
    : lower.includes("edge") ? "Edge"
    : "Navegador";
  const os = lower.includes("windows") ? "Windows"
    : lower.includes("mac") ? "Mac"
    : lower.includes("linux") ? "Linux"
    : lower.includes("android") ? "Android"
    : lower.includes("iphone") || lower.includes("ipad") ? "iOS"
    : "Desconocido";
  return {
    label: `${browser} en ${os}`,
    icon: isMobile ? <Smartphone size={16} /> : <Monitor size={16} />,
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then(async (r) => {
        if (r.ok) setSessions(await r.json());
      })
      .finally(() => setLoading(false));
  }, []);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      const r = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (r.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success("Sesion cerrada correctamente");
      } else {
        toast.error("No se pudo cerrar la sesion");
      }
    } catch {
      toast.error("Error al cerrar la sesion");
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAll() {
    const others = sessions.filter((s) => !s.isCurrent);
    for (const s of others) {
      await revoke(s.id);
    }
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <header className="animate-pop">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Configuracion
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-kinetic-orange/10">
            <Shield size={22} className="text-brand-kinetic-orange" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Sesiones activas
            </h1>
            <p className="text-brand-muted mt-0.5 text-sm">
              Dispositivos con sesion iniciada en tu cuenta
            </p>
          </div>
        </div>
      </header>

      <section className="glass-panel p-6 rounded-2xl space-y-4 animate-pop">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-brand-muted py-4">
            <Loader2 size={16} className="animate-spin" /> Cargando sesiones...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-brand-muted py-4 text-center">Sin sesiones activas.</p>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {sessions.map((s) => {
                const { label, icon } = parseDevice(s.userAgent);
                return (
                  <div key={s.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 ${
                          s.isCurrent
                            ? "bg-brand-kinetic-orange/10 text-brand-kinetic-orange"
                            : "bg-white/5 text-brand-muted"
                        }`}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white truncate">{label}</span>
                          {s.isCurrent && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange font-medium">
                              Este dispositivo
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-brand-muted mt-0.5">
                          Ultimo acceso: {timeAgo(s.updatedAt)} &middot;{" "}
                          {new Date(s.updatedAt).toLocaleString("es-BO")}
                        </div>
                      </div>
                    </div>

                    {!s.isCurrent && (
                      <button
                        onClick={() => revoke(s.id)}
                        disabled={revoking === s.id}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50"
                      >
                        {revoking === s.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <LogOut size={12} />
                        )}
                        Cerrar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {otherSessions.length > 1 && (
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={revokeAll}
                  disabled={revoking !== null}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:underline disabled:opacity-50"
                >
                  <LogOut size={14} />
                  Cerrar todas las otras sesiones ({otherSessions.length})
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="glass-panel p-5 rounded-2xl animate-pop">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-white/5 flex-shrink-0 mt-0.5">
            <Shield size={14} className="text-brand-muted" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Acerca de las sesiones</p>
            <p className="text-xs text-brand-muted leading-relaxed">
              Cada vez que inicias sesion en un dispositivo nuevo se crea una entrada aqui.
              Si ves un dispositivo que no reconoces, cerralo de inmediato y cambia tu contrasena.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Package, ShoppingCart, Users, Sparkles, Database, Loader2, CheckCircle2, X } from "lucide-react";

interface ActionCard {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    icon: Package,
    title: "Cargá tu primer producto",
    description: "Agregá productos al inventario con precio, stock y categoría.",
    href: "/inventory",
    cta: "Ir al inventario",
  },
  {
    icon: ShoppingCart,
    title: "Hacé tu primera venta",
    description: "Creá un pedido desde el punto de venta en segundos.",
    href: "/pos",
    cta: "Abrir POS",
  },
  {
    icon: Users,
    title: "Invitá tu equipo",
    description: "Sumá colaboradores con roles y permisos personalizados.",
    href: "/staff",
    cta: "Ver equipo",
  },
];

interface WelcomeBannerProps {
  orgName: string;
  orgId: string;
}

export function WelcomeBanner({ orgName, orgId }: WelcomeBannerProps) {
  const dismissKey = `gestios_welcome_dismissed_${orgId}`;

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(dismissKey) === "true";
  });
  const [loadingData, setLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  function handleDismiss() {
    localStorage.setItem(dismissKey, "true");
    setDismissed(true);
  }

  async function handleLoadSampleData() {
    setLoadingData(true);
    try {
      const res = await fetch("/api/sample-data", { method: "POST" });
      if (res.ok || res.status === 409) {
        localStorage.setItem(dismissKey, "true");
        setDataLoaded(true);
        setTimeout(() => window.location.reload(), 1200);
      }
    } finally {
      setLoadingData(false);
    }
  }

  if (dismissed) return null;

  return (
    <section
      className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-kinetic-orange/30 shadow-[0_0_40px_rgba(255,107,0,0.08)] animate-pop"
      aria-label="Bienvenida"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-brand-kinetic-orange/15 flex-shrink-0">
          <Sparkles size={24} className="text-brand-kinetic-orange" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">
            Bienvenido a GestiOS,{" "}
            <span className="text-brand-kinetic-orange">{orgName}</span>!
          </h2>
          <p className="text-brand-muted text-sm mt-1">
            Tu prueba de 7 días está activa — explorá todo sin límites.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Cerrar bienvenida"
          className="flex-shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Sample data CTA */}
      <div className="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <div className="p-2 rounded-xl bg-brand-growth-neon/10 flex-shrink-0">
          <Database size={18} className="text-brand-growth-neon" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Cargá datos de ejemplo</p>
          <p className="text-xs text-brand-muted mt-0.5">Productos, clientes y ventas ficticios para explorar sin riesgo.</p>
        </div>
        <button
          onClick={handleLoadSampleData}
          disabled={loadingData || dataLoaded}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/30 text-brand-growth-neon text-sm font-bold hover:bg-brand-growth-neon/20 transition-all disabled:opacity-60"
        >
          {dataLoaded ? (
            <><CheckCircle2 size={14} /> Listo</>
          ) : loadingData ? (
            <><Loader2 size={14} className="animate-spin" /> Cargando...</>
          ) : (
            "Cargar datos"
          )}
        </button>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {ACTION_CARDS.map((card) => (
          <div
            key={card.href}
            className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 hover:border-brand-kinetic-orange/40 hover:bg-white/[0.07] transition-all"
          >
            <div className="p-2 rounded-xl bg-brand-kinetic-orange/10 self-start">
              <card.icon size={18} className="text-brand-kinetic-orange" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">{card.title}</p>
              <p className="text-brand-muted text-xs mt-1 leading-relaxed">
                {card.description}
              </p>
            </div>
            <a
              href={card.href}
              className="mt-auto px-4 py-2 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-xs text-center shadow-[0_0_16px_rgba(255,107,0,0.25)] hover:shadow-[0_0_24px_rgba(255,107,0,0.4)] transition-all"
            >
              {card.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

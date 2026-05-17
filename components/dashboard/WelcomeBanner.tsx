import { Package, ShoppingCart, Users, Sparkles } from "lucide-react";

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
}

export function WelcomeBanner({ orgName }: WelcomeBannerProps) {
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
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">
            Bienvenido a GestiOS,{" "}
            <span className="text-brand-kinetic-orange">{orgName}</span>!
          </h2>
          <p className="text-brand-muted text-sm mt-1">
            Tu prueba de 7 días está activa — explorá todo sin límites.
          </p>
        </div>
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

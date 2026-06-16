import Link from "next/link";
import { ArrowRight, BookOpen, CreditCard, LifeBuoy, Mail, MessageCircle, Settings, ShieldCheck } from "lucide-react";

const WA_NUMBER = "59175470140";
const SUPPORT_EMAIL = "soporte@gestios.bo";

const supportCards = [
  {
    title: "Soporte por WhatsApp",
    description: "Para bloqueos operativos, pagos, configuracion y dudas de uso.",
    href: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hola! Necesito soporte con GestiOS.")}`,
    external: true,
    icon: MessageCircle,
  },
  {
    title: "Soporte por email",
    description: "Para casos que requieran capturas, detalle tecnico o seguimiento.",
    href: `mailto:${SUPPORT_EMAIL}`,
    external: true,
    icon: Mail,
  },
  {
    title: "Facturacion y pagos",
    description: "Ver plan, generar referencia BCP y revisar solicitudes pendientes.",
    href: "/billing",
    external: false,
    icon: CreditCard,
  },
  {
    title: "Centro de ayuda",
    description: "Guia rapida de modulos, primeros pasos, planes y preguntas frecuentes.",
    href: "/help",
    external: false,
    icon: BookOpen,
  },
] as const;

const checklist = [
  "Nombre de tu negocio y usuario con el que entraste.",
  "Modulo donde ocurre el problema.",
  "Captura o descripcion corta del error.",
  "Si es pago, incluye la referencia usada en la transferencia.",
] as const;

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header className="animate-pop">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-kinetic-orange/10">
            <LifeBuoy size={22} className="text-brand-kinetic-orange" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Soporte</h1>
            <p className="text-brand-muted mt-1 text-sm">Canales y datos necesarios para resolver mas rapido.</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {supportCards.map((card) => {
          const Icon = card.icon;
          const className = "glass-panel rounded-2xl p-5 flex gap-4 hover:border-white/20 border border-transparent transition-all group";

          const body = (
            <>
              <div className="w-10 h-10 rounded-xl bg-brand-kinetic-orange/10 flex items-center justify-center flex-shrink-0">
                <Icon size={19} className="text-brand-kinetic-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-white">{card.title}</h2>
                  <ArrowRight size={16} className="text-brand-muted group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm text-brand-muted mt-1 leading-relaxed">{card.description}</p>
              </div>
            </>
          );

          return card.external ? (
            <a key={card.title} href={card.href} target="_blank" rel="noreferrer" className={className}>
              {body}
            </a>
          ) : (
            <Link key={card.title} href={card.href} className={className}>
              {body}
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-brand-growth-neon" />
            <h2 className="text-lg font-display font-bold text-white">Antes de pedir soporte</h2>
          </div>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-muted">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-kinetic-orange flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-blue-400" />
            <h2 className="text-lg font-display font-bold text-white">Gestion interna</h2>
          </div>
          <p className="text-sm text-brand-muted leading-relaxed">
            Para cambios de datos del negocio, usuarios, logo, telefono o direccion, primero revisa Configuracion.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white hover:border-white/25"
          >
            Abrir configuracion <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

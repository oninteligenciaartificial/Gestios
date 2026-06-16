"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const STORAGE_KEY = "gestios_onboarding_v2";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: <Settings size={24} />,
    title: "Configura tu tienda",
    description: "Completa datos del negocio, horarios, equipo y preferencias antes de vender.",
    href: "/settings",
    cta: "Abrir configuracion",
    color: "text-sky-400",
  },
  {
    icon: <Package size={24} />,
    title: "Carga inventario",
    description: "Agrega productos, precios, stock minimo y variantes para activar alertas reales.",
    href: "/inventory",
    cta: "Ver inventario",
    color: "text-blue-400",
  },
  {
    icon: <ShoppingCart size={24} />,
    title: "Vende y crea pedidos",
    description: "Usa el POS o pedidos para registrar ventas; GestiOS descuenta stock y calcula totales.",
    href: "/pos",
    cta: "Ir al POS",
    color: "text-brand-kinetic-orange",
  },
  {
    icon: <Bell size={24} />,
    title: "Notificaciones y emails",
    description: "Los pedidos, cambios de estado y stock bajo quedan visibles en la campana y disparan correos cuando el email esta configurado.",
    href: "/dashboard",
    cta: "Ver dashboard",
    color: "text-yellow-400",
  },
  {
    icon: <Users size={24} />,
    title: "Clientes y fidelidad",
    description: "Guarda datos de clientes, email, cumpleanos e historial para automatizaciones comerciales.",
    href: "/customers",
    cta: "Ver clientes",
    color: "text-green-400",
  },
  {
    icon: <BarChart3 size={24} />,
    title: "Reportes",
    description: "Controla ventas, margenes y productos con mejor rotacion desde reportes exportables.",
    href: "/reports",
    cta: "Ver reportes",
    color: "text-purple-400",
  },
];

function subscribeToOnboarding(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("gestios-onboarding-dismissed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("gestios-onboarding-dismissed", callback);
  };
}

function shouldShowOnboarding() {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

function dismissOnboarding() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("gestios-onboarding-dismissed"));
}

export function OnboardingTour() {
  const router = useRouter();
  const visible = useSyncExternalStore(subscribeToOnboarding, shouldShowOnboarding, () => false);
  const [step, setStep] = useState(0); // 0 = welcome, 1..n = feature steps

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismissOnboarding();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  function dismiss() {
    dismissOnboarding();
  }

  function goToFeature(href: string) {
    dismiss();
    router.push(href);
  }

  function next() {
    if (step < STEPS.length) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const isWelcome = step === 0;
  const currentStep = isWelcome ? null : STEPS[step - 1];
  const totalSteps = STEPS.length;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]" />

      <div className="fixed inset-0 flex items-center justify-center z-[91] px-4 pointer-events-none">
        <div
          className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto animate-pop"
          role="dialog"
          aria-modal="true"
          aria-label="Tour de bienvenida"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            {isWelcome ? (
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-kinetic-orange" />
                <span className="text-xs font-semibold text-brand-kinetic-orange uppercase tracking-wider">
                  Primer inicio
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5" aria-label={`Paso ${step} de ${totalSteps}`}>
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i < step ? "bg-brand-kinetic-orange w-6" : "bg-white/15 w-3"
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={dismiss}
              className="text-brand-muted hover:text-white transition-colors"
              aria-label="Cerrar tour"
              title="Cerrar tour"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 pt-4 pb-6 space-y-5">
            {isWelcome ? (
              <>
                <div className="text-center space-y-3 py-2">
                  <div className="text-4xl font-display font-black text-brand-kinetic-orange tracking-widest">
                    GestiOS.
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Deja tu operacion lista para vender
                  </h2>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    Este recorrido aparece al iniciar sesion y te lleva por lo esencial:
                    inventario, ventas, clientes, notificaciones y correos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STEPS.map((s) => (
                    <div
                      key={s.title}
                      className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5 min-w-0"
                    >
                      <span className={`${s.color} flex-shrink-0`}>{s.icon}</span>
                      <span className="text-sm font-medium text-white truncate">{s.title}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-brand-muted hover:text-white hover:border-white/30 transition-colors"
                  >
                    Saltar tour
                  </button>
                  <button
                    onClick={next}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-shadow"
                  >
                    Empezar tour
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            ) : currentStep ? (
              <>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl bg-white/5 flex-shrink-0 ${currentStep.color}`}>
                    {currentStep.icon}
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <h3 className="text-lg font-bold text-white">{currentStep.title}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {currentStep.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={next}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-brand-muted hover:text-white hover:border-white/30 transition-colors"
                  >
                    {step < totalSteps ? "Siguiente" : "Finalizar"}
                  </button>
                  <button
                    onClick={() => goToFeature(currentStep.href)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-shadow"
                  >
                    {currentStep.cta}
                    <ArrowRight size={15} />
                  </button>
                </div>

                <p className="text-center text-xs text-brand-muted/60">
                  {step} de {totalSteps}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Users, BarChart3,
  X, ChevronRight, Sparkles, ArrowRight
} from "lucide-react";

const STORAGE_KEY = "gestios_onboarding_v1";

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
    icon: <ShoppingCart size={28} />,
    title: "Punto de Venta",
    description: "Registra ventas en segundos. Acepta efectivo, tarjeta o QR. Aplica descuentos y puntos de lealtad.",
    href: "/pos",
    cta: "Ir al POS",
    color: "text-orange-400",
  },
  {
    icon: <Package size={28} />,
    title: "Inventario",
    description: "Gestiona tus productos con variantes, precios, costos y alertas de stock bajo.",
    href: "/inventory",
    cta: "Ver inventario",
    color: "text-blue-400",
  },
  {
    icon: <Users size={28} />,
    title: "Clientes",
    description: "Conoce a tus mejores clientes. Registra cumpleaños, historial de compras y puntos de lealtad.",
    href: "/customers",
    cta: "Ver clientes",
    color: "text-green-400",
  },
  {
    icon: <BarChart3 size={28} />,
    title: "Reportes",
    description: "Analiza tus ventas, márgenes y productos más vendidos. Exporta a CSV para tu contabilidad.",
    href: "/reports",
    cta: "Ver reportes",
    color: "text-purple-400",
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // 0 = welcome, 1-4 = feature steps

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setVisible(true);
    } catch { /* storage blocked */ }
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="fixed inset-0 flex items-center justify-center z-[91] px-4 pointer-events-none">
        <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto animate-pop">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            {isWelcome ? (
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-kinetic-orange" />
                <span className="text-xs font-semibold text-brand-kinetic-orange uppercase tracking-wider">
                  Bienvenido
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i < step
                        ? "bg-brand-kinetic-orange w-6"
                        : i === step - 1
                        ? "bg-brand-kinetic-orange w-6"
                        : "bg-white/15 w-3"
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={dismiss}
              className="text-brand-muted hover:text-white transition-colors"
              aria-label="Cerrar tour"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 space-y-5">
            {isWelcome ? (
              <>
                <div className="text-center space-y-3 py-2">
                  <div className="text-5xl font-display font-black text-brand-kinetic-orange tracking-widest">
                    GestiOS.
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Tu tienda, lista para vender
                  </h2>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    En 2 minutos te mostramos cómo sacarle el máximo provecho.
                    Te guiaremos por las funciones clave.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {STEPS.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5"
                    >
                      <span className={s.color}>{s.icon}</span>
                      <span className="text-sm font-medium text-white">{s.title}</span>
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

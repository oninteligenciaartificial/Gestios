"use client";

import { useSyncExternalStore, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FolderTree,
  Headphones,
  HelpCircle,
  MessageCircle,
  Package,
  Percent,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { PLAN_META, type PlanType } from "@/lib/plans";

const STORAGE_PREFIX = "gestios_onboarding_v3";

interface FeatureLink {
  href: string;
  label: string;
}

interface Props {
  plan: PlanType;
  orgName: string;
  storageKeyScope: string;
  features: FeatureLink[];
}

interface StepContent {
  icon: React.ReactNode;
  description: string;
  cta: string;
  color: string;
}

const STEP_CONTENT: Record<string, StepContent> = {
  "/dashboard": {
    icon: <BarChart3 size={24} />,
    description: "Menu izquierdo > Dashboard. Aqui revisas ventas, pedidos recientes, stock bajo y notificaciones del negocio.",
    cta: "Abrir dashboard",
    color: "text-sky-400",
  },
  "/notifications": {
    icon: <Bell size={24} />,
    description: "Menu izquierdo > Notificaciones. Aqui quedan alertas de pedidos, stock, pagos y eventos importantes.",
    cta: "Abrir notificaciones",
    color: "text-yellow-400",
  },
  "/pos": {
    icon: <ShoppingCart size={24} />,
    description: "Menu izquierdo > Punto de Venta. Usa este modulo para vender rapido en mostrador y descontar inventario.",
    cta: "Abrir POS",
    color: "text-brand-kinetic-orange",
  },
  "/ventas": {
    icon: <Receipt size={24} />,
    description: "Menu izquierdo > Ventas. Aqui revisas ventas registradas, estados, recibos y detalle de cada operacion.",
    cta: "Abrir ventas",
    color: "text-orange-300",
  },
  "/inventory": {
    icon: <Package size={24} />,
    description: "Menu izquierdo > Inventario. Carga productos, precios, stock minimo, variantes y alertas.",
    cta: "Abrir inventario",
    color: "text-blue-400",
  },
  "/orders": {
    icon: <ClipboardList size={24} />,
    description: "Menu izquierdo > Pedidos. Gestiona solicitudes, confirma entregas y cambia estados.",
    cta: "Abrir pedidos",
    color: "text-amber-300",
  },
  "/customers": {
    icon: <Users size={24} />,
    description: "Menu izquierdo > Clientes. Guarda datos, historial, cumpleanos y contactos para seguimiento.",
    cta: "Abrir clientes",
    color: "text-green-400",
  },
  "/reports": {
    icon: <BarChart3 size={24} />,
    description: "Menu izquierdo > Reportes. Analiza ventas, margen, productos y exporta datos cuando el plan lo permite.",
    cta: "Abrir reportes",
    color: "text-purple-400",
  },
  "/caja": {
    icon: <Receipt size={24} />,
    description: "Menu izquierdo > Corte de Caja. Cierra turnos, compara efectivo esperado y registra diferencias.",
    cta: "Abrir caja",
    color: "text-lime-300",
  },
  "/tienda": {
    icon: <Store size={24} />,
    description: "Menu izquierdo > Tienda Online. Configura el link publico, productos visibles y pedidos web.",
    cta: "Abrir tienda online",
    color: "text-pink-300",
  },
  "/suppliers": {
    icon: <Truck size={24} />,
    description: "Menu izquierdo > Proveedores. Registra proveedores para compras, reposicion y control de abastecimiento.",
    cta: "Abrir proveedores",
    color: "text-cyan-300",
  },
  "/purchase-orders": {
    icon: <ClipboardList size={24} />,
    description: "Menu izquierdo > Ordenes de Compra. Planea reposicion y controla compras pendientes.",
    cta: "Abrir ordenes",
    color: "text-indigo-300",
  },
  "/discounts": {
    icon: <Percent size={24} />,
    description: "Menu izquierdo > Descuentos. Crea descuentos por monto o porcentaje segun los limites del plan.",
    cta: "Abrir descuentos",
    color: "text-rose-300",
  },
  "/categories": {
    icon: <FolderTree size={24} />,
    description: "Menu izquierdo > Categorias. Organiza productos para buscar, vender y reportar mejor.",
    cta: "Abrir categorias",
    color: "text-teal-300",
  },
  "/branches": {
    icon: <Building2 size={24} />,
    description: "Menu izquierdo > Sucursales. Administra ubicaciones, stock y operacion multi-sucursal.",
    cta: "Abrir sucursales",
    color: "text-violet-300",
  },
  "/conversations": {
    icon: <MessageCircle size={24} />,
    description: "Menu izquierdo > WhatsApp. Atiende conversaciones si el add-on esta activo.",
    cta: "Abrir WhatsApp",
    color: "text-green-300",
  },
  "/staff": {
    icon: <Users size={24} />,
    description: "Menu izquierdo > Equipo. Invita usuarios, asigna roles y controla permisos.",
    cta: "Abrir equipo",
    color: "text-blue-300",
  },
  "/settings": {
    icon: <Settings size={24} />,
    description: "Parte inferior del menu > Configuracion. Edita datos de la tienda, tipo de negocio y ajustes avanzados.",
    cta: "Abrir configuracion",
    color: "text-slate-300",
  },
  "/help": {
    icon: <HelpCircle size={24} />,
    description: "Menu izquierdo > Ayuda. Consulta guias rapidas para operar el sistema.",
    cta: "Abrir ayuda",
    color: "text-sky-300",
  },
  "/support": {
    icon: <Headphones size={24} />,
    description: "Menu izquierdo > Soporte. Contacta a ONIA cuando necesites asistencia operativa.",
    cta: "Abrir soporte",
    color: "text-orange-300",
  },
};

function storageKey(scope: string, plan: PlanType) {
  return `${STORAGE_PREFIX}:${scope}:${plan}`;
}

function subscribeToOnboarding(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("gestios-onboarding-dismissed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("gestios-onboarding-dismissed", callback);
  };
}

function shouldShowOnboarding(key: string) {
  try {
    return !localStorage.getItem(key);
  } catch {
    return false;
  }
}

function dismissOnboarding(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("gestios-onboarding-dismissed"));
}

function buildSteps(features: FeatureLink[]) {
  const seen = new Set<string>();
  return features
    .filter((feature) => feature.href.startsWith("/") && !seen.has(feature.href) && seen.add(feature.href))
    .map((feature) => ({
      ...feature,
      ...(STEP_CONTENT[feature.href] ?? {
        icon: <Sparkles size={24} />,
        description: `Menu izquierdo > ${feature.label}. Esta funcion esta incluida en tu plan actual.`,
        cta: `Abrir ${feature.label}`,
        color: "text-brand-kinetic-orange",
      }),
    }));
}

export function OnboardingTour({ plan, orgName, storageKeyScope, features }: Props) {
  const router = useRouter();
  const key = storageKey(storageKeyScope, plan);
  const visible = useSyncExternalStore(
    subscribeToOnboarding,
    () => shouldShowOnboarding(key),
    () => false,
  );
  const [step, setStep] = useState(0); // 0 = welcome, 1..n = feature steps
  const steps = buildSteps(features);
  const totalSteps = steps.length;

  function dismiss() {
    dismissOnboarding(key);
  }

  function goToFeature(href: string) {
    router.push(href);
    if (step < totalSteps) setStep((s) => s + 1);
    else dismiss();
  }

  function next() {
    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible || totalSteps === 0) return null;

  const isWelcome = step === 0;
  const currentStep = isWelcome ? null : steps[step - 1];
  const planLabel = PLAN_META[plan].label;

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
                {steps.map((feature, i) => (
                  <div
                    key={feature.href}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i < step ? "bg-brand-kinetic-orange w-6" : "bg-white/15 w-3"
                    }`}
                  />
                ))}
              </div>
            )}
            <span className="text-xs text-brand-muted">
              Plan {planLabel}
            </span>
          </div>

          <div className="px-6 pt-4 pb-6 space-y-5">
            {isWelcome ? (
              <>
                <div className="text-center space-y-3 py-2">
                  <div className="text-4xl font-display font-black text-brand-kinetic-orange tracking-widest">
                    GestiOS.
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Recorrido obligatorio de inicio
                  </h2>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    {orgName} tiene el plan {planLabel}. Te mostraremos las funciones incluidas y donde encontrarlas. El tour no se cierra solo: finalizalo o pulsa Saltar tour.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {steps.map((s) => (
                    <div
                      key={s.href}
                      className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5 min-w-0"
                    >
                      <span className={`${s.color} flex-shrink-0`}>{s.icon}</span>
                      <span className="text-sm font-medium text-white truncate">{s.label}</span>
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
                    <ArrowRight size={16} />
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
                    <p className="text-xs text-brand-muted">
                      Funcion incluida en tu plan
                    </p>
                    <h3 className="text-lg font-bold text-white">{currentStep.label}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {currentStep.description}
                    </p>
                  </div>
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

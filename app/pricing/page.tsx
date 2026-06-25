"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicShell } from "@/components/PublicShell";
import { ADDON_META, PLAN_LIMITS, PLAN_META, PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";

const PLAN_ORDER: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];

const PLAN_BADGES: Partial<Record<PlanType, string>> = {
  PRO: "Popular",
  EMPRESARIAL: "Completo",
};

const PLAN_SLUGS: Record<PlanType, string> = {
  BASICO: "basico",
  CRECER: "crecer",
  PRO: "pro",
  EMPRESARIAL: "empresarial",
};

const PLAN_FEATURES: Record<PlanType, Array<{ label: string; included: boolean }>> = {
  BASICO: [
    { label: "POS, inventario y pedidos", included: true },
    { label: "Corte de caja y alertas de stock", included: true },
    { label: "Clientes y descuentos basicos", included: true },
    { label: "Reportes avanzados", included: false },
    { label: "Tienda online", included: false },
  ],
  CRECER: [
    { label: "Todo lo del plan Basico", included: true },
    { label: "Variantes, proveedores y reportes", included: true },
    { label: "Import/export CSV", included: true },
    { label: "Vencimientos por rubro", included: true },
    { label: "Tienda online", included: false },
  ],
  PRO: [
    { label: "Todo lo del plan Crecer", included: true },
    { label: "Productos y clientes ilimitados", included: true },
    { label: "Tienda online y registro publico", included: true },
    { label: "QR personal para pagos", included: true },
    { label: "Sucursales multiples", included: false },
  ],
  EMPRESARIAL: [
    { label: "Todo lo del plan Pro", included: true },
    { label: "Sucursales ilimitadas", included: true },
    { label: "Roles, auditoria y permisos", included: true },
    { label: "Equipo ilimitado", included: true },
    { label: "Soporte prioritario", included: true },
  ],
};

const PUBLIC_ADDONS = [
  {
    key: "whatsapp",
    label: ADDON_META.WHATSAPP.label,
    price: ADDON_META.WHATSAPP.price,
    description: "Canal operativo con configuracion Meta, plantillas y base para bot de calificacion.",
  },
  {
    key: "ai-bot",
    label: "Bot IA de ventas y soporte",
    price: "Setup + mensual",
    description: "Responde preguntas frecuentes, califica solicitudes y deriva a humano con control de ONIA.",
  },
  {
    key: "extra-user",
    label: "Usuario extra",
    price: "Desde Bs. 35/mes",
    description: "Suma vendedores, cajeros o administradores sin cambiar todo el plan.",
  },
  {
    key: "public-portal",
    label: "Portal publico y tienda online",
    price: "Incluido en Pro+",
    description: "Catalogo online, registro publico de clientes y checkout de pedidos.",
  },
  {
    key: "onboarding",
    label: "Onboarding y migracion",
    price: "A medida",
    description: "Migramos productos, clientes y procesos desde hojas de calculo o sistemas anteriores.",
  },
  {
    key: "qr",
    label: "Pagos QR Bolivia",
    price: ADDON_META.QR_BOLIVIA.price,
    description: "QR personal disponible para comercios sin NIT; PSP bancario requiere proveedor configurado.",
  },
  {
    key: "inventory-advanced",
    label: ADDON_META.INVENTARIO_AVANZADO.label,
    price: ADDON_META.INVENTARIO_AVANZADO.price,
    description: "Stock multi-ubicacion, reposicion y trazabilidad para negocios con mas rotacion.",
  },
  {
    key: "reports",
    label: "Reportes gerenciales",
    price: "A medida",
    description: "Tableros de ventas, margen y compras adaptados a la operacion del negocio.",
  },
  {
    key: "self-hosted-clinic",
    label: "Servidor propio administrado",
    price: "Cotizacion anual",
    description: "Para clinicas que requieren VPS dedicado o infraestructura propia con backup, acceso seguro y soporte acordado.",
  },
];

function formatPrice(price: number): string {
  return price.toLocaleString("es-BO");
}

function formatLimits(plan: PlanType): string {
  const limits = PLAN_LIMITS[plan];
  const products = limits.maxProducts === Infinity ? "Productos ilimitados" : `${limits.maxProducts} productos`;
  const customers = limits.maxCustomers === Infinity ? "Clientes ilimitados" : `${limits.maxCustomers} clientes`;
  const staff = limits.maxStaff === Infinity ? "Usuarios ilimitados" : `${limits.maxStaff} usuario${limits.maxStaff !== 1 ? "s" : ""}`;
  return `${products} - ${customers} - ${staff}`;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeTab, setActiveTab] = useState<"plans" | "addons">("plans");

  return (
    <PublicShell>
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <BrandLogo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/85 hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors">
            Entrar
          </Link>
          <Link href="/signup" className="px-4 py-2 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black text-sm font-bold">
            Prueba gratis
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        <section className="text-center space-y-5">
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-white">
            Planes para cada etapa
            <br />
            <span className="text-brand-kinetic-orange">de tu negocio</span>
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Sin contratos. Sin permanencia. Cambia o cancela cuando quieras.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 text-brand-kinetic-orange text-sm font-medium">
            Trial de 7 dias sin tarjeta de credito
          </div>

          <div role="tablist" aria-label="Contenido de precios" className="mx-auto mt-8 inline-flex rounded-2xl border border-white/10 bg-white/6 p-1 shadow-sm">
            <button
              id="pricing-tab-plans"
              type="button"
              role="tab"
              aria-selected={activeTab === "plans"}
              aria-controls="pricing-panel-plans"
              onClick={() => setActiveTab("plans")}
              className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-[background-color,color,box-shadow] duration-200 ${activeTab === "plans" ? "bg-brand-kinetic-orange text-black shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              Planes
            </button>
            <button
              id="pricing-tab-addons"
              type="button"
              role="tab"
              aria-selected={activeTab === "addons"}
              aria-controls="pricing-panel-addons"
              onClick={() => setActiveTab("addons")}
              className={`min-h-[44px] rounded-xl px-5 text-sm font-bold transition-[background-color,color,box-shadow] duration-200 ${activeTab === "addons" ? "bg-brand-kinetic-orange text-black shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              Add-ons
            </button>
          </div>

          {activeTab === "plans" && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-sm ${!isAnnual ? "text-white" : "text-white/60"}`}>Mensual</span>
              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                aria-pressed={isAnnual}
                className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? "bg-brand-kinetic-orange" : "bg-slate-300"}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${isAnnual ? "translate-x-2" : "-translate-x-5"}`} />
              </button>
              <span className={`text-sm ${isAnnual ? "text-white" : "text-white/60"}`}>
                Anual <span className="text-brand-kinetic-orange font-bold">(-10%)</span>
              </span>
            </div>
          )}
        </section>

        <section
          id="pricing-panel-plans"
          role="tabpanel"
          aria-labelledby="pricing-tab-plans"
          hidden={activeTab !== "plans"}
          className="panel-reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {PLAN_ORDER.map((planKey) => {
            const meta = PLAN_META[planKey];
            const monthlyPrice = PLAN_PRICES_BOB[planKey];
            const displayPrice = isAnnual ? Math.round(monthlyPrice * 0.9) : monthlyPrice;
            const badge = PLAN_BADGES[planKey];

            return (
              <article key={planKey} className="public-card relative rounded-3xl border border-white/10 bg-white/6 p-6 flex flex-col gap-5">
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold">
                    {badge}
                  </div>
                )}
                <div>
                  <div className={`text-sm font-bold mb-1 ${meta.color}`}>{meta.label}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-display font-bold text-white">Bs. {formatPrice(displayPrice)}</span>
                    <span className="text-white/70 text-sm mb-1">/mes</span>
                  </div>
                  {isAnnual && <div className="text-white/65 text-xs mt-0.5">Facturado anualmente</div>}
                  <p className="text-xs text-white/75 mt-2 leading-relaxed">{formatLimits(planKey)}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {PLAN_FEATURES[planKey].map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check size={15} className="text-brand-growth-green flex-shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <X size={15} className="text-white/40 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <span className={feature.included ? "text-white/90" : "text-white/55"}>{feature.label}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/signup?plan=${PLAN_SLUGS[planKey]}`}
                  className={`min-h-[44px] rounded-xl font-bold text-sm transition-[background-color,border-color,box-shadow] duration-200 flex items-center justify-center gap-2 ${
                    badge
                      ? "bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black shadow-[0_0_20px_rgba(255,107,0,0.24)] hover:shadow-[0_0_30px_rgba(255,107,0,0.36)]"
                      : "border border-white/12 text-white/85 hover:border-white/25 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Empezar gratis <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </section>

        <section
          id="pricing-panel-addons"
          role="tabpanel"
          aria-labelledby="pricing-tab-addons"
          hidden={activeTab !== "addons"}
          className="panel-reveal space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-white">Add-ons opcionales</h2>
            <p className="text-white/75 mt-2 text-sm">Activa solo lo que tu operacion necesita.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PUBLIC_ADDONS.map((addon) => (
              <article key={addon.key} className="public-card rounded-2xl border border-white/10 bg-white/6 p-5 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-white text-sm">{addon.label}</h3>
                  <div className="text-brand-kinetic-orange font-bold text-sm whitespace-nowrap">{addon.price}</div>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{addon.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-card rounded-3xl border border-white/10 bg-white/6 p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-white">Comparacion rapida</h2>
            <p className="text-white/75 mt-2 text-sm">Las funciones clave por etapa.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-white font-bold">Basico</th>
                  <th className="text-center py-3 px-4 text-white font-bold">Crecer</th>
                  <th className="text-center py-3 px-4 text-white font-bold">Pro</th>
                  <th className="text-center py-3 px-4 text-white font-bold">Empresarial</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["POS + Inventario", true, true, true, true],
                  ["Reportes", false, true, true, true],
                  ["Tienda online", false, false, true, true],
                  ["Sucursales", false, false, false, true],
                  ["Roles y auditoria", false, false, false, true],
                ].map((row) => (
                  <tr key={String(row[0])} className="border-b border-white/8">
                    <td className="py-3 px-4 text-white/85">{row[0]}</td>
                    {[1, 2, 3, 4].map((col) => (
                      <td key={col} className="py-3 px-4 text-center">
                        {row[col] ? (
                          <Check size={15} className="text-brand-growth-green mx-auto" aria-hidden="true" />
                        ) : (
                          <X size={15} className="text-white/40 mx-auto" aria-hidden="true" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-display font-bold text-white">Listo para empezar?</h2>
          <p className="text-white/75">7 dias gratis, sin tarjeta de credito.</p>
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center px-8 py-3.5 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_30px_rgba(255,107,0,0.24)] hover:shadow-[0_0_50px_rgba(255,107,0,0.36)] transition-[box-shadow,transform] duration-200 active:scale-[0.99]"
          >
            Crear cuenta gratis
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/60">
        GestiOS - Sistema de gestion para negocios en Bolivia y Latinoamerica
      </footer>
    </PublicShell>
  );
}

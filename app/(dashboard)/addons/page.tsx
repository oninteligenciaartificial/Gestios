/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  DatabaseBackup,
  FileSpreadsheet,
  MessageCircle,
  MonitorCog,
  PackageSearch,
  ServerCog,
  ShoppingBag,
  Zap,
  X,
} from "lucide-react";
import { ADDON_META } from "@/lib/plans";

const WA_NUMBER = "59175470140";

type AddonType = "WHATSAPP" | "QR_BOLIVIA" | "ECOMMERCE" | "CONTABILIDAD" | "INVENTARIO_AVANZADO";

interface OrgAddon {
  addon: AddonType;
  active: boolean;
}

const CORE_ADDONS: Array<{
  addon: AddonType;
  category: string;
  outcome: string;
  setupNote: string;
  icon: typeof MessageCircle;
}> = [
  {
    addon: "WHATSAPP",
    category: "Canales y automatizacion",
    outcome: "Atencion por WhatsApp, plantillas operativas y base para bot de calificacion.",
    setupNote: "Requiere Meta Business, numero dedicado, credenciales y configuracion de webhook.",
    icon: MessageCircle,
  },
  {
    addon: "INVENTARIO_AVANZADO",
    category: "Operacion e inventario",
    outcome: "Stock por ubicacion, puntos de reorden, lote/serie y mejor control de reposicion.",
    setupNote: "Recomendado para negocios con alta rotacion, clinicas con insumos o varias areas.",
    icon: PackageSearch,
  },
  {
    addon: "QR_BOLIVIA",
    category: "Cobros",
    outcome: "QR personal y flujo operativo para referencias de pago.",
    setupNote: "La automatizacion bancaria completa requiere proveedor, API y credenciales reales.",
    icon: Zap,
  },
  {
    addon: "ECOMMERCE",
    category: "Ventas digitales",
    outcome: "Tienda online, catalogo publico y pedidos conectados al inventario.",
    setupNote: "La tienda existe en PRO+. Este add-on cubre configuracion, carga y operacion guiada.",
    icon: ShoppingBag,
  },
  {
    addon: "CONTABILIDAD",
    category: "Gerencia y datos",
    outcome: "Exportes para contador, conciliacion operativa y reportes administrativos.",
    setupNote: "Se maneja como CSV/Excel y control interno. SIAT no esta incluido.",
    icon: FileSpreadsheet,
  },
];

const ADDON_WA_MSG: Record<AddonType, string> = {
  WHATSAPP: `Hola! Me interesa activar el add-on WhatsApp Business + Bot IA (${ADDON_META.WHATSAPP.price}) en GestiOS. Quiero revisar requisitos y alcance.`,
  QR_BOLIVIA: `Hola! Quiero activar el add-on Pagos QR Bolivia (${ADDON_META.QR_BOLIVIA.price}) en GestiOS. Quiero revisar si aplica a mi flujo.`,
  ECOMMERCE: `Hola! Me interesa configurar tienda online/e-commerce en GestiOS. Quiero revisar alcance, plan y carga inicial.`,
  CONTABILIDAD: `Hola! Quiero activar exportacion contable/reportes gerenciales en GestiOS. Quiero revisar alcance.`,
  INVENTARIO_AVANZADO: `Hola! Quiero activar Inventario Avanzado (${ADDON_META.INVENTARIO_AVANZADO.price}) en GestiOS. Quiero revisar si aplica a mi operacion.`,
};

const SERVICE_ADDONS = [
  {
    name: "Bot IA de ventas y soporte",
    category: "Automatizacion",
    price: "Setup + mensual",
    description: "Responde preguntas frecuentes, califica solicitudes, registra contexto y deriva a humano cuando corresponde.",
    risk: "No se activa sin proceso manual claro, base de respuestas y responsable humano.",
    icon: Bot,
  },
  {
    name: "Migracion asistida",
    category: "Implementacion",
    price: "A medida",
    description: "Carga inicial de productos, clientes, proveedores y categorias desde Excel, CSV o sistema anterior.",
    risk: "Datos sucios o incompletos se cotizan aparte porque requieren limpieza humana.",
    icon: DatabaseBackup,
  },
  {
    name: "Reportes gerenciales",
    category: "Gerencia",
    price: "A medida",
    description: "Dashboard ejecutivo para margen, rotacion, compras, ventas por sucursal y decisiones de direccion.",
    risk: "Necesita datos consistentes; no conviene venderlo antes de ordenar inventario y ventas.",
    icon: MonitorCog,
  },
  {
    name: "Servidor propio administrado",
    category: "Infraestructura",
    price: "Cotizacion anual",
    description: "Instalacion en VPS o infraestructura del cliente con dominio, TLS, backups, monitoreo y soporte pactado.",
    risk: "Siempre requiere contrato de soporte. Servidor propio no significa soporte ilimitado.",
    icon: ServerCog,
  },
] as const;

export default function AddonsPage() {
  const [addons, setAddons] = useState<OrgAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  useEffect(() => { fetchAddons(); }, []);

  async function fetchAddons() {
    setLoading(true);
    const res = await fetch("/api/addons");
    if (res.ok) {
      setAddons(await res.json());
      setError(null);
    } else {
      const body = await res.json().catch(() => ({}));
      if (body.upgrade) setUpgradeMsg(body.error);
      else setError(body.error ?? "Error al cargar add-ons");
    }
    setLoading(false);
  }

  function isActive(addon: AddonType): boolean {
    return addons.some(a => a.addon === addon && a.active);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header className="animate-pop space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-kinetic-orange/25 bg-brand-kinetic-orange/10 px-3 py-1 text-xs font-bold text-brand-kinetic-orange">
          Add-ons operativos
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Add-ons</h1>
        <p className="max-w-2xl text-brand-muted text-sm leading-relaxed">
          Activa solo lo que ayuda a vender, operar mejor o reducir errores. Los add-ons tecnicos requieren configuracion real; los servicios a medida se cotizan antes de prometer automatizacion.
        </p>
      </header>

      {upgradeMsg && (
        <div className="glass-panel border border-brand-kinetic-orange/30 rounded-2xl p-4">
          <p className="text-brand-kinetic-orange text-sm font-medium">{upgradeMsg}</p>
          <p className="text-brand-muted text-xs mt-1">Los add-ons estan disponibles desde el plan Crecer (Bs. 530/mes).</p>
        </div>
      )}

      {error && (
        <div className="glass-panel border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-brand-muted animate-pulse">
          Cargando add-ons...
        </div>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Add-ons configurables</h2>
            <p className="text-sm text-brand-muted mt-1">Estos usan estructuras existentes de GestiOS y se activan desde superadmin cuando cumplen requisitos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CORE_ADDONS.map((item) => {
              const meta = ADDON_META[item.addon];
              const active = isActive(item.addon);
              const Icon = item.icon;

              return (
                <div
                  key={item.addon}
                  className={`glass-panel rounded-2xl p-5 transition-all duration-300 animate-pop ${active ? "border border-brand-kinetic-orange/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${active ? "bg-brand-kinetic-orange/15" : "bg-white/5"}`}>
                        <Icon size={18} className={active ? "text-brand-kinetic-orange" : "text-brand-muted"} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">{item.category}</div>
                        <h3 className="font-bold text-white text-sm mt-0.5">{meta.label}</h3>
                        <p className="text-brand-kinetic-orange text-xs font-semibold mt-0.5">{meta.price}</p>
                      </div>
                    </div>

                    <span className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      meta.comingSoon
                        ? "bg-white/5 text-white/35"
                        : active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-white/5 text-brand-muted"
                    }`}>
                      {meta.comingSoon ? (
                        <><X size={13} /> Revision</>
                      ) : active ? (
                        <><Check size={13} /> Activo</>
                      ) : (
                        <><X size={13} /> Inactivo</>
                      )}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-white leading-relaxed">{item.outcome}</p>
                    <p className="text-xs text-brand-muted leading-relaxed">{item.setupNote}</p>
                  </div>

                  <button
                    onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ADDON_WA_MSG[item.addon])}`, "_blank")}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                  >
                    <MessageCircle size={13} /> {active ? "Pedir soporte" : "Solicitar activacion"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Add-ons a medida</h2>
          <p className="text-brand-muted text-sm mt-1">
            Paquetes para empresas que necesitan implementacion, automatizacion o infraestructura. Se venden con alcance y soporte definidos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICE_ADDONS.map((addon) => {
            const Icon = addon.icon;
            return (
              <div key={addon.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white/5 p-2 text-brand-kinetic-orange">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{addon.name}</h3>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-brand-muted">{addon.category}</span>
                    </div>
                    <p className="text-brand-kinetic-orange text-xs font-semibold mt-0.5">{addon.price}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">{addon.description}</p>
                <p className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs text-brand-muted leading-relaxed">
                  Criterio: {addon.risk}
                </p>
                <button
                  onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hola! Quiero consultar el add-on ${addon.name} para GestiOS. Necesito evaluar alcance y precio.`)}`, "_blank")}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                >
                  <MessageCircle size={13} /> Solicitar evaluacion
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

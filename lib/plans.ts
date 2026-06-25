export type PlanType = "BASICO" | "CRECER" | "PRO" | "EMPRESARIAL";

export const PLAN_PRICES_BOB: Record<PlanType, number> = {
  BASICO: 350,
  CRECER: 530,
  PRO: 800,
  EMPRESARIAL: 1250,
};
export type AddonType = "WHATSAPP" | "FACTURACION" | "QR_BOLIVIA" | "ECOMMERCE" | "CONTABILIDAD" | "INVENTARIO_AVANZADO";

export const PLAN_META: Record<PlanType, { label: string; price: string; color: string; bg: string }> = {
  BASICO:      { label: "Básico",      price: "Bs. 350/mes",   color: "text-brand-muted",          bg: "bg-white/5" },
  CRECER:      { label: "Crecer",      price: "Bs. 530/mes",   color: "text-blue-300",              bg: "bg-blue-400/10" },
  PRO:         { label: "Pro",         price: "Bs. 800/mes",   color: "text-blue-400",              bg: "bg-blue-500/10" },
  EMPRESARIAL: { label: "Empresarial", price: "Bs. 1.250/mes", color: "text-brand-kinetic-orange",  bg: "bg-brand-kinetic-orange/10" },
};

export const PLAN_LIMITS: Record<PlanType, { maxProducts: number; maxCustomers: number; maxStaff: number; maxDiscounts: number }> = {
  BASICO:      { maxProducts: 150,      maxCustomers: 50,       maxStaff: 1,        maxDiscounts: 3 },
  CRECER:      { maxProducts: 500,      maxCustomers: 300,      maxStaff: 3,        maxDiscounts: Infinity },
  PRO:         { maxProducts: Infinity, maxCustomers: Infinity, maxStaff: 10,       maxDiscounts: Infinity },
  EMPRESARIAL: { maxProducts: Infinity, maxCustomers: Infinity, maxStaff: Infinity, maxDiscounts: Infinity },
};

export const ADDON_META: Record<AddonType, { label: string; price: string; description: string; comingSoon?: boolean }> = {
  WHATSAPP:    { label: "WhatsApp Business + Bot IA", price: "Bs. 280/mes", description: "Bandeja operativa, plantillas y base para bot de calificacion; consumo Meta se cobra aparte" },
  FACTURACION: { label: "Facturación electrónica", price: "No disponible", description: "Fuera del alcance comercial actual de GestiOS", comingSoon: true },
  QR_BOLIVIA:  { label: "Pagos QR Bolivia",    price: "Bs. 105/mes",  description: "QR personal disponible; PSP bancario requiere proveedor configurado",                  comingSoon: true },
  ECOMMERCE:   { label: "E-commerce",          price: "Bs. 140/mes",  description: "Conecta tu tienda online y sincroniza inventario automáticamente",                   comingSoon: true },
  CONTABILIDAD:        { label: "Exportación Contable",    price: "Bs. 126/mes", description: "Exporta ventas y gastos en CSV/Excel para tu contador", comingSoon: true },
  INVENTARIO_AVANZADO: { label: "Inventario Avanzado",     price: "Bs. 120/mes", description: "Stock multi-ubicación, puntos de reorden automático y trazabilidad por lote/serie" },
};

const PLAN_ORDER: Record<PlanType, number> = { BASICO: 0, CRECER: 1, PRO: 2, EMPRESARIAL: 3 };
const DISABLED_FEATURES = new Set(["facturacion_siat"]);

export function isPlanAtLeast(plan: PlanType, required: PlanType): boolean {
  return PLAN_ORDER[plan] >= PLAN_ORDER[required];
}

// Minimum plan required per feature. Features not listed are available to all plans.
export const FEATURE_PLAN: Record<string, PlanType> = {
  reports:          "CRECER",
  suppliers:        "CRECER",
  csv_import:       "CRECER",
  csv_export:       "CRECER",
  stock_alert:      "CRECER",
  registro_publico: "PRO",
  tienda_online:    "PRO",
  email_basic:      "PRO",
  email_advanced:   "EMPRESARIAL",
  sucursales:       "EMPRESARIAL",
  roles_avanzados:  "EMPRESARIAL",
  audit_log:        "EMPRESARIAL",
  facturacion_siat: "EMPRESARIAL",
  pagos_qr:         "PRO",
  staff:            "BASICO",
  variants:         "CRECER",
  purchase_orders:  "CRECER",
  email_stats:      "PRO",
  export_contable:      "EMPRESARIAL",
  inventario_multi_loc: "BASICO", // requiere add-on INVENTARIO_AVANZADO además del plan
};

export function canUseFeature(plan: PlanType, feature: string): boolean {
  if (DISABLED_FEATURES.has(feature)) return false;
  const required = FEATURE_PLAN[feature];
  if (!required) return true;
  return isPlanAtLeast(plan, required);
}

export function canUseAddon(activeAddons: AddonType[], addon: AddonType): boolean {
  return activeAddons.includes(addon);
}

export function planGateError(feature: string): { error: string; upgrade: true; requiredPlan: PlanType } {
  const required = FEATURE_PLAN[feature] ?? "CRECER";
  const label = PLAN_META[required].label;
  if (DISABLED_FEATURES.has(feature)) {
    return { error: "Esta función no está disponible en GestiOS.", upgrade: true, requiredPlan: required };
  }
  return { error: `Esta función requiere el plan ${label} o superior.`, upgrade: true, requiredPlan: required };
}

export function limitGateError(resource: string, limit: number, plan: PlanType): { error: string; upgrade: true; limit: number } {
  const label = PLAN_META[plan].label;
  return {
    error: `Tu plan ${label} permite hasta ${limit} ${resource}. Actualiza para continuar.`,
    upgrade: true,
    limit,
  };
}

export function isInTrial(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date() < trialEndsAt;
}

export function trialDaysLeft(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const diff = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const PLAN_FEATURES: Record<PlanType, string[]> = {
  BASICO: [
    "Dashboard",
    "Punto de Venta",
    "Inventario (sin variantes)",
    "Pedidos",
    "Clientes (50 max)",
    "Corte de Caja",
    "Descuentos (3 max)",
    "Categorias",
  ],
  CRECER: [
    "Todo lo del plan Básico",
    "Reportes avanzados",
    "Proveedores",
    "Import/Export CSV",
    "Variantes de productos",
    "Descuentos ilimitados",
    "Clientes (300 max)",
    "Vencimientos (Farmacia/Suplementos)",
  ],
  PRO: [
    "Todo lo del plan Crecer",
    "Tienda Online",
    "Registro Público de clientes",
    "Pagos QR Bolivia",
    "Email marketing",
    "Clientes ilimitados",
    "Productos ilimitados",
    "Garantías (Electrónica)",
  ],
  EMPRESARIAL: [
    "Todo lo del plan Pro",
    "Sucursales multiples",
    "Auditoría completa (Audit Log)",
    "Roles avanzados",
    "Equipo ilimitado",
    "Email avanzado",
    "Soporte prioritario",
  ],
};

export type PlanType = "BASICO" | "PRO" | "EMPRESARIAL";

export const PLAN_META: Record<PlanType, { label: string; price: string; color: string; bg: string }> = {
  BASICO:      { label: "Básico",       price: "$39/mes",  color: "text-brand-muted",          bg: "bg-white/5" },
  PRO:         { label: "Profesional",  price: "$89/mes",  color: "text-blue-400",              bg: "bg-blue-500/10" },
  EMPRESARIAL: { label: "Empresarial",  price: "$179/mes", color: "text-brand-kinetic-orange",  bg: "bg-brand-kinetic-orange/10" },
};

export const PLAN_LIMITS: Record<PlanType, { maxProducts: number; maxCustomers: number; maxStaff: number }> = {
  BASICO:      { maxProducts: 150,      maxCustomers: 50,       maxStaff: 0 },
  PRO:         { maxProducts: Infinity, maxCustomers: Infinity, maxStaff: 4 },
  EMPRESARIAL: { maxProducts: Infinity, maxCustomers: Infinity, maxStaff: Infinity },
};

const PLAN_ORDER: Record<PlanType, number> = { BASICO: 0, PRO: 1, EMPRESARIAL: 2 };

export function isPlanAtLeast(plan: PlanType, required: PlanType): boolean {
  return PLAN_ORDER[plan] >= PLAN_ORDER[required];
}

// Minimum plan required per feature
export const FEATURE_PLAN: Record<string, PlanType> = {
  reports:           "PRO",
  caja:              "PRO",
  suppliers:         "PRO",
  discounts:         "PRO",
  staff:             "PRO",
  csv_import:        "PRO",
  csv_export:        "PRO",
  stock_alert:       "PRO",
  email_automations: "EMPRESARIAL",
  registro_publico:  "EMPRESARIAL",
};

export function canUseFeature(plan: PlanType, feature: string): boolean {
  const required = FEATURE_PLAN[feature];
  if (!required) return true;
  return isPlanAtLeast(plan, required);
}

export function planGateError(feature: string): { error: string; upgrade: true; requiredPlan: PlanType } {
  const required = FEATURE_PLAN[feature] ?? "PRO";
  const label = PLAN_META[required].label;
  return { error: `Esta función requiere el plan ${label} o superior.`, upgrade: true, requiredPlan: required };
}

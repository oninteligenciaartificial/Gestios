"use client";

import { Lock } from "lucide-react";
import { PLAN_META, type PlanType } from "@/lib/plans";

interface Props {
  requiredPlan: PlanType;
  feature?: string;
}

export function UpgradeWall({ requiredPlan, feature }: Props) {
  const meta = PLAN_META[requiredPlan];
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Lock size={28} className="text-brand-muted" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">Funcion bloqueada</h2>
        <p className="text-brand-muted max-w-sm">
          {feature ? `${feature} requiere` : "Esta funcion requiere"} el plan{" "}
          <span className={`font-bold ${meta.color}`}>{meta.label}</span> o superior.
        </p>
      </div>
      <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl border ${meta.bg} border-white/10`}>
        <div>
          <div className={`text-sm font-bold ${meta.color}`}>{meta.label}</div>
          <div className="text-xs text-brand-muted">{meta.price}</div>
        </div>
      </div>
      <p className="text-sm text-brand-muted">Contacta a tu administrador para actualizar el plan.</p>
    </div>
  );
}

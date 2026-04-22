"use client";

import { useEffect, useState } from "react";
import { Zap, Check, X, Loader2 } from "lucide-react";
import { ADDON_META } from "@/lib/plans";

type AddonType = "WHATSAPP" | "FACTURACION" | "MERCADOPAGO" | "ECOMMERCE" | "CONTABILIDAD";

interface OrgAddon {
  addon: AddonType;
  active: boolean;
}

const ALL_ADDONS: AddonType[] = ["WHATSAPP", "FACTURACION", "MERCADOPAGO", "ECOMMERCE", "CONTABILIDAD"];

export default function AddonsPage() {
  const [addons, setAddons] = useState<OrgAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AddonType | null>(null);
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

  async function toggle(addon: AddonType, currentlyActive: boolean) {
    setSaving(addon);
    setError(null);
    const res = await fetch("/api/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addon, active: !currentlyActive }),
    });
    if (res.ok) {
      await fetchAddons();
    } else {
      const body = await res.json().catch(() => ({}));
      if (body.upgrade) setUpgradeMsg(body.error);
      else setError(body.error ?? "Error al actualizar add-on");
    }
    setSaving(null);
  }

  function isActive(addon: AddonType): boolean {
    return addons.some(a => a.addon === addon && a.active);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header className="animate-pop">
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Add-ons</h1>
        <p className="text-brand-muted mt-1 text-sm">Activa funcionalidades adicionales para tu negocio</p>
      </header>

      {upgradeMsg && (
        <div className="glass-panel border border-brand-kinetic-orange/30 rounded-2xl p-4">
          <p className="text-brand-kinetic-orange text-sm font-medium">{upgradeMsg}</p>
          <p className="text-brand-muted text-xs mt-1">Los add-ons están disponibles desde el plan Crecer ($59/mes).</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALL_ADDONS.map((addon) => {
            const meta = ADDON_META[addon];
            const active = isActive(addon);
            const isSaving = saving === addon;

            return (
              <div
                key={addon}
                className={`glass-panel rounded-2xl p-5 transition-all duration-300 animate-pop ${active ? "border border-brand-kinetic-orange/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? "bg-brand-kinetic-orange/15" : "bg-white/5"}`}>
                      <Zap size={18} className={active ? "text-brand-kinetic-orange" : "text-brand-muted"} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{meta.label}</h3>
                      <p className="text-brand-kinetic-orange text-xs font-semibold mt-0.5">{meta.price}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => !upgradeMsg && toggle(addon, active)}
                    disabled={isSaving || !!upgradeMsg}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                      ${active
                        ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange hover:bg-red-500/15 hover:text-red-400"
                        : "bg-white/5 text-brand-muted hover:bg-brand-kinetic-orange/10 hover:text-brand-kinetic-orange"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : active ? (
                      <><Check size={13} /> Activo</>
                    ) : (
                      <><X size={13} /> Inactivo</>
                    )}
                  </button>
                </div>

                <p className="text-xs text-brand-muted mt-3 leading-relaxed">{meta.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

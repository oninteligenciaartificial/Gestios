import { getTenantProfile } from "@/lib/auth";
import { canUseFeature, PLAN_META } from "@/lib/plans";
import { redirect } from "next/navigation";
import { ShoppingBag, Lock } from "lucide-react";
import { TiendaSettings } from "./TiendaSettings";

export const metadata = { title: "Tienda Online | GestiOS" };

export default async function TiendaPage() {
  const profile = await getTenantProfile();
  if (!profile) redirect("/login");

  const hasAccess = canUseFeature(profile.plan, "tienda_online");

  if (!hasAccess) {
    const proMeta = PLAN_META["PRO"];
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-7 h-7 text-brand-muted" />
          <h1 className="text-2xl font-semibold text-brand-text">Tienda Online</h1>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-brand-text">Funcion exclusiva del plan Pro</h2>
          <p className="text-sm text-brand-muted max-w-md mx-auto">
            Crea tu tienda online y recibe pedidos directamente desde internet. Sincroniza tu inventario automaticamente.
          </p>
          <div className="inline-block rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2">
            <span className={`text-sm font-medium ${proMeta.color}`}>
              Plan Pro — {proMeta.price}
            </span>
          </div>
          <div className="pt-2">
            <a
              href="/settings?tab=plan"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Actualizar plan
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShoppingBag className="w-7 h-7 text-blue-400" />
        <h1 className="text-2xl font-semibold text-brand-text">Tu Tienda Online</h1>
      </div>
      <p className="text-sm text-brand-muted mb-8">
        Comparte el enlace de tu tienda con tus clientes para que puedan ver tus productos y hacer pedidos.
      </p>
      <TiendaSettings />
    </div>
  );
}

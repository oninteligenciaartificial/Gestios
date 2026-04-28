import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PLAN_META } from "@/lib/plans";
import type { PlanType } from "@/lib/plans";

export default async function PlanVencidoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile?.organizationId) redirect("/setup");

  const org = await prisma.organization.findUnique({
    where: { id: profile.organizationId },
    select: { name: true, plan: true, planExpiresAt: true, trialEndsAt: true },
  });

  if (!org) redirect("/setup");

  // If plan is still active, send them to the dashboard
  const now = new Date();
  const planExpired = org.planExpiresAt && org.planExpiresAt < now;
  const trialActive = org.trialEndsAt && org.trialEndsAt > now;
  if (!planExpired || trialActive) redirect("/dashboard");

  const planLabel = PLAN_META[org.plan as PlanType].label;
  const expiredDate = org.planExpiresAt!.toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="text-5xl mb-4">🔒</div>
          <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">
            GestiOS.
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 space-y-5 border border-red-500/20">
          <h1 className="text-2xl font-display font-bold text-white">
            Tu plan ha vencido
          </h1>
          <p className="text-brand-muted text-sm leading-relaxed">
            El plan <span className="text-white font-semibold">{planLabel}</span> de{" "}
            <span className="text-white font-semibold">{org.name}</span> venció el {expiredDate}.
            Tus datos están seguros, solo necesitas renovar para retomar el acceso.
          </p>

          <div className="bg-white/5 rounded-2xl p-4 text-sm text-brand-muted">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span>Plan</span>
              <span className="text-white font-semibold">{planLabel}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Venció el</span>
              <span className="text-red-400 font-semibold">{expiredDate}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href="https://wa.me/59170000000?text=Hola,%20necesito%20renovar%20mi%20plan%20de%20GestiOS"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm"
            >
              Renovar por WhatsApp
            </a>
            <a
              href="mailto:soporte@gestios.app?subject=Renovacion%20de%20plan%20GestiOS"
              className="block w-full py-3 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:border-white/30 transition-colors text-sm"
            >
              Escribir por email
            </a>
          </div>
        </div>

        <p className="text-xs text-brand-muted/50">
          GestiOS · Todos tus datos están seguros y disponibles al renovar.
        </p>
      </div>
    </div>
  );
}

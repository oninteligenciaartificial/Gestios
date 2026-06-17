import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarWrapper } from "./SidebarWrapper";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";
import { DashboardThemeProvider } from "@/components/dashboard/DashboardThemeProvider";
import { SuiteBridgeBanner } from "@/components/dashboard/SuiteBridgeBanner";
import { canUseFeature, isPlanAtLeast, FEATURE_PLAN, type PlanType } from "@/lib/plans";
import { getBusinessUI, type BusinessUIConfig } from "@/lib/business-ui";
import type { BusinessType } from "@/lib/business-types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: {
      organization: {
        select: {
          name: true,
          plan: true,
          planExpiresAt: true,
          trialEndsAt: true,
          businessType: true,
          addons: { select: { addon: true, active: true } },
        },
      },
    },
  });

  if (!profile) redirect("/setup");

  // Check plan expiry — redirect non-superadmins with expired plans
  // /plan-vencido lives outside this layout group so no infinite loop
  if (profile.role !== "SUPERADMIN") {
    const now = new Date();
    const planExpired = profile.organization?.planExpiresAt && profile.organization.planExpiresAt < now;
    const trialActive = profile.organization?.trialEndsAt && profile.organization.trialEndsAt > now;
    if (planExpired && !trialActive) {
      redirect("/plan-vencido");
    }
  }

  const cookieStore = await cookies();
  const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
  const impersonateOrgName = cookieStore.get("impersonate_org_name")?.value;

  const isImpersonating = profile.role === "SUPERADMIN" && !!impersonateOrgId;
  const isSuperAdmin = profile.role === "SUPERADMIN" && !isImpersonating;

  // Resolve the active plan (impersonating superadmin gets impersonated org's plan)
  let activePlan: PlanType = (profile.organization?.plan ?? "BASICO") as PlanType;
  let activeAddons = profile.organization?.addons ?? [];
  let activeBusinessType = (profile.organization?.businessType ?? "GENERAL") as BusinessType;
  let activePlanExpiresAt = profile.organization?.planExpiresAt ?? null;
  let activeTrialEndsAt = profile.organization?.trialEndsAt ?? null;
  let impersonatedAdminName: string | null = null;

  if (isImpersonating && impersonateOrgId) {
    const impersonatedOrg = await prisma.organization.findUnique({
      where: { id: impersonateOrgId },
      select: {
        plan: true,
        businessType: true,
        planExpiresAt: true,
        trialEndsAt: true,
        addons: { select: { addon: true, active: true } },
        profiles: {
          where: { role: "ADMIN" },
          select: { name: true },
          take: 1,
        },
      },
    });
    activePlan = (impersonatedOrg?.plan ?? "BASICO") as PlanType;
    activeAddons = impersonatedOrg?.addons ?? [];
    activeBusinessType = (impersonatedOrg?.businessType ?? "GENERAL") as BusinessType;
    activePlanExpiresAt = impersonatedOrg?.planExpiresAt ?? null;
    activeTrialEndsAt = impersonatedOrg?.trialEndsAt ?? null;
    impersonatedAdminName = impersonatedOrg?.profiles[0]?.name ?? null;
  }

  const hasWhatsApp = activeAddons.some(a => a.addon === "WHATSAPP" && a.active);

  const superAdminLinks = [
    { href: "/superadmin", label: "Panel Principal" },
    { href: "/superadmin/organizations", label: "Organizaciones" },
    { href: "/superadmin/users", label: "Usuarios" },
    { href: "/superadmin/payments", label: "Pagos y Planes" },
  ];

  const externalLinks = [
    { href: "https://gestioshq.app", label: "Ver Landing", external: true },
  ];

  // Map feature keys to nav hrefs for lock detection
  const featureHrefMap: Record<string, string> = {
    reports: "/reports",
    suppliers: "/suppliers",
    purchase_orders: "/purchase-orders",
    sucursales: "/branches",
    tienda_online: "/tienda",
  };
  const lockedHrefs = new Set(
    Object.entries(featureHrefMap)
      .filter(([feature]) => !canUseFeature(activePlan, feature))
      .map(([, href]) => href)
  );

  const showBranches = canUseFeature(activePlan, "sucursales");

  // Resolve business type for dynamic sidebar labels
  const ui: BusinessUIConfig = getBusinessUI(activeBusinessType);

  const tenantLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/notifications", label: "Notificaciones" },
    { href: "/pos", label: "Punto de Venta" },
    { href: "/ventas", label: "Ventas" },
    { href: "/inventory", label: ui.sidebarLabels.inventory },
    { href: "/orders", label: "Pedidos" },
    { href: "/customers", label: "Clientes" },
    { href: "/reports", label: "Reportes" },
    { href: "/caja", label: "Corte de Caja" },
    { href: "/tienda", label: "Tienda Online" },
    { href: "/suppliers", label: ui.sidebarLabels.suppliers },
    { href: "/purchase-orders", label: "Ordenes de Compra" },
    { href: "/discounts", label: "Descuentos" },
    { href: "/categories", label: ui.sidebarLabels.categories },
    ...(showBranches ? [{ href: "/branches", label: "Sucursales" }] : []),
    ...(hasWhatsApp ? [{ href: "/conversations", label: "WhatsApp" }] : []),
    ...(!isImpersonating && (profile.role === "ADMIN" || profile.role === "MANAGER") ? [{ href: "/staff", label: "Equipo" }] : []),
    ...(!isImpersonating ? ui.extraSections
      .filter(s => !s.minPlan || isPlanAtLeast(activePlan, s.minPlan as PlanType))
      .map(s => ({ href: s.href, label: s.label }))
    : []),
    ...(!isImpersonating ? [{ href: "/settings", label: "Configuracion" }] : []),
    ...(!isImpersonating ? [{ href: "/help", label: "Ayuda" }] : []),
    ...(!isImpersonating ? [{ href: "/support", label: "Soporte" }] : []),
  ];

  const navLinks = isSuperAdmin ? [...superAdminLinks, ...externalLinks] : tenantLinks;

  let orgDisplayName: string;
  if (isSuperAdmin) {
    orgDisplayName = "Super Admin";
  } else if (isImpersonating) {
    orgDisplayName = impersonateOrgName ?? "Tienda";
  } else {
    orgDisplayName = profile.organization?.name ?? "";
  }

  const lockedPlanMap: Record<string, PlanType> = isSuperAdmin ? {} : Object.fromEntries(
    Object.entries(featureHrefMap)
      .filter(([feature]) => !canUseFeature(activePlan, feature))
      .map(([feature, href]) => [href, FEATURE_PLAN[feature]])
  ) as Record<string, PlanType>;

  const sidebarName = isImpersonating ? (impersonatedAdminName ?? "Admin de la tienda") : profile.name;
  const sidebarEmail = isImpersonating ? `Vista cliente - ${orgDisplayName}` : (user.email ?? "");
  const sidebarRole = isImpersonating ? "ADMIN" : profile.role;
  const tourLinks = isSuperAdmin ? [] : [
    ...tenantLinks.filter(link => !lockedHrefs.has(link.href)),
    ...(!tenantLinks.some(link => link.href === "/settings") ? [{ href: "/settings", label: "Configuracion" }] : []),
  ];

  return (
    <DashboardThemeProvider>
      <div className="dashboard-app flex h-screen overflow-hidden">
      <SidebarWrapper
        links={navLinks}
        lockedHrefs={isSuperAdmin ? [] : [...lockedHrefs]}
        orgName={orgDisplayName}
        isSuperAdmin={isSuperAdmin}
        isImpersonating={isImpersonating}
        name={sidebarName}
        email={sidebarEmail}
        role={sidebarRole}
        plan={isSuperAdmin ? null : activePlan}
        planExpiresAt={isSuperAdmin ? null : (activePlanExpiresAt?.toISOString() ?? null)}
        lockedPlanMap={lockedPlanMap}
      />
      <main className="flex-1 w-full overflow-y-auto">
        {!isSuperAdmin && !isImpersonating && (
          <TrialBanner trialEndsAt={activeTrialEndsAt?.toISOString() ?? null} />
        )}
        {isImpersonating && impersonateOrgName && (
          <ImpersonationBanner orgName={impersonateOrgName} />
        )}
        {!isSuperAdmin && (
          <Suspense fallback={null}>
            <SuiteBridgeBanner />
          </Suspense>
        )}
        <CommandPalette />
        {!isSuperAdmin && (
          <OnboardingTour
            plan={activePlan}
            orgName={orgDisplayName}
            storageKeyScope={impersonateOrgId ?? profile.organizationId ?? "account"}
            features={tourLinks}
          />
        )}
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
      </div>
    </DashboardThemeProvider>
  );
}

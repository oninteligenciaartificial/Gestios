import type { BusinessType } from "./business-types";

export const DENTALGEST_BUSINESS_TYPE: BusinessType = "DENTAL";

export const DENTALGEST_NAV_HREFS = [
  "/dashboard",
  "/notifications",
  "/inventory",
  "/suppliers",
  "/purchase-orders",
  "/categories",
  "/billing",
  "/settings",
  "/help",
  "/support",
] as const;

export const DENTALGEST_ALLOWED_DASHBOARD_ROUTES = [
  ...DENTALGEST_NAV_HREFS,
] as const;

export const DENTALGEST_BLOCKED_ROUTE_FALLBACK = "/inventory?source=dentalgest";
export const DENTALGEST_COMMERCE_DISABLED_ERROR =
  "Tienda online no disponible en modo operativo DentalGest.";
export const DENTALGEST_REGISTRATION_DISABLED_ERROR =
  "Registro publico no disponible en modo operativo DentalGest.";
export const DENTALGEST_ADDONS_DISABLED_ERROR =
  "Add-ons no disponibles en modo operativo DentalGest.";
export const DENTALGEST_MODULE_DISABLED_ERROR =
  "Modulo no disponible en modo operativo DentalGest.";

export function isDentalGestOperationalMode(businessType: string | null | undefined): boolean {
  return businessType === DENTALGEST_BUSINESS_TYPE;
}

export function normalizeDashboardHref(href: string): string {
  const [path] = href.split("?");
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "");
}

export function isDentalGestDashboardRouteAllowed(pathname: string): boolean {
  const normalizedPath = normalizeDashboardHref(pathname);

  return DENTALGEST_ALLOWED_DASHBOARD_ROUTES.some((allowedRoute) => {
    const normalizedAllowedRoute = normalizeDashboardHref(allowedRoute);
    return normalizedPath === normalizedAllowedRoute || normalizedPath.startsWith(`${normalizedAllowedRoute}/`);
  });
}

export function filterDentalGestNavLinks<T extends { href: string }>(links: readonly T[]): T[] {
  const allowedRoutes = new Set(DENTALGEST_NAV_HREFS.map(normalizeDashboardHref));

  return links.filter((link) => allowedRoutes.has(normalizeDashboardHref(link.href)));
}

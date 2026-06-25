"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FolderTree,
  HelpCircle,
  Home,
  LifeBuoy,
  Lock,
  MessageCircle,
  Package,
  Percent,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { FEATURE_PLAN, PLAN_META, type PlanType } from "@/lib/plans";

interface NavLink { href: string; label: string }

interface Props {
  links: NavLink[];
  lockedHrefs: string[];
  onNavigate?: () => void;
  lockedPlanMap?: Record<string, PlanType>;
}

const hrefFeatureMap: Record<string, string> = {
  "/reports": "reports",
  "/suppliers": "suppliers",
  "/branches": "sucursales",
};

type NavIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

const hrefIconMap: Record<string, NavIcon> = {
  "/dashboard": Home,
  "/notifications": Bell,
  "/pos": ShoppingCart,
  "/ventas": Receipt,
  "/inventory": Package,
  "/orders": ClipboardList,
  "/customers": Users,
  "/reports": BarChart3,
  "/caja": CreditCard,
  "/tienda": Store,
  "/suppliers": Truck,
  "/purchase-orders": ShoppingBag,
  "/discounts": Percent,
  "/categories": FolderTree,
  "/branches": Building2,
  "/conversations": MessageCircle,
  "/staff": UserCog,
  "/billing": CreditCard,
  "/settings": Settings,
  "/help": HelpCircle,
  "/support": LifeBuoy,
  "/superadmin": Home,
  "/superadmin/organizations": Building2,
  "/superadmin/users": Users,
  "/superadmin/payments": CreditCard,
};

const SECTION_ORDER = ["inicio", "operacion", "inventario", "crecimiento", "gestion", "admin"] as const;
type SectionKey = typeof SECTION_ORDER[number];

const GENERAL_SECTION_LABELS: Record<SectionKey, string> = {
  inicio: "Inicio",
  operacion: "Operacion diaria",
  inventario: "Inventario y compras",
  crecimiento: "Ventas y crecimiento",
  gestion: "Cuenta y soporte",
  admin: "Superadmin",
};

const DENTAL_SECTION_LABELS: Record<SectionKey, string> = {
  inicio: "Inicio",
  operacion: "Operacion dental",
  inventario: "Insumos y compras",
  crecimiento: "Coordinacion",
  gestion: "Cuenta y soporte",
  admin: "Superadmin",
};

function navPath(href: string): string {
  return href.split("?")[0] ?? href;
}

function getSectionKey(href: string): SectionKey {
  const path = navPath(href);
  if (path.startsWith("/superadmin")) return "admin";
  if (path === "/dashboard" || path === "/notifications") return "inicio";
  if (path === "/pos" || path === "/ventas" || path === "/orders" || path === "/caja") return "operacion";
  if (path === "/inventory" || path === "/suppliers" || path === "/purchase-orders" || path === "/categories" || path === "/branches") return "inventario";
  if (path === "/customers" || path === "/tienda" || path === "/discounts" || path === "/conversations") return "crecimiento";
  return "gestion";
}

function inferDentalMode(links: NavLink[]): boolean {
  return links.some((link) =>
    link.label.toLowerCase().includes("dental") ||
    link.label.toLowerCase().includes("insumos")
  );
}

export function SidebarNav({ links, lockedHrefs, onNavigate, lockedPlanMap }: Props) {
  const pathname = usePathname();
  const [criticalStock, setCriticalStock] = useState(0);
  const lockedSet = new Set(lockedHrefs);
  const sectionLabels = inferDentalMode(links) ? DENTAL_SECTION_LABELS : GENERAL_SECTION_LABELS;
  const groupedLinks = SECTION_ORDER
    .map((section) => ({
      key: section,
      label: sectionLabels[section],
      links: links.filter((link) => getSectionKey(link.href) === section),
    }))
    .filter((section) => section.links.length > 0);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.ok ? r.json() : { data: [] })
      .then((res: { data?: { stock: number; minStock: number }[] } | { stock: number; minStock: number }[]) => {
        const products = Array.isArray(res) ? res : (res.data ?? []);
        setCriticalStock(products.filter(p => p.stock <= p.minStock).length);
      })
      .catch(() => {});
  }, []);

  function isActive(href: string) {
    const path = navPath(href);
    if (path === "/dashboard") return pathname === "/dashboard";
    if (path === "/superadmin") return pathname === "/superadmin";
    return pathname.startsWith(path);
  }

  function getRequiredPlanLabel(href: string): string {
    if (lockedPlanMap?.[href]) return PLAN_META[lockedPlanMap[href]].label;
    const feature = hrefFeatureMap[navPath(href)];
    if (feature && FEATURE_PLAN[feature]) return PLAN_META[FEATURE_PLAN[feature]].label;
    return "";
  }

  return (
    <nav className="flex flex-col gap-5 flex-1" aria-label="Navegacion principal">
      {groupedLinks.map((section) => (
        <div key={section.key} className="space-y-1.5">
          <div className="px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted/55">
            {section.label}
          </div>
          <div className="flex flex-col gap-1">
            {section.links.map((link) => {
              const locked = lockedSet.has(link.href);
              const Icon = hrefIconMap[navPath(link.href)] ?? Home;

              if (locked) {
                const requiredPlan = getRequiredPlanLabel(link.href);
                return (
                  <div
                    key={link.href}
                    data-tour-href={link.href}
                    title={requiredPlan ? `Requiere plan ${requiredPlan}` : "Actualiza tu plan para usar esta funcion"}
                    className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between opacity-40 cursor-not-allowed select-none"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon size={15} className="flex-shrink-0 text-brand-muted" aria-hidden />
                      <span className="truncate text-brand-muted">{link.label}</span>
                    </span>
                    <Lock size={13} className="text-brand-muted flex-shrink-0" />
                  </div>
                );
              }

              return (
                <a
                  key={link.href}
                  href={link.href}
                  data-tour-href={link.href}
                  onClick={onNavigate}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    isActive(link.href)
                      ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange border border-brand-kinetic-orange/30"
                      : "text-brand-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon size={15} className="flex-shrink-0" aria-hidden />
                    <span className="truncate">{link.label}</span>
                  </span>
                  {link.href === "/inventory" && criticalStock > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {criticalStock > 9 ? "9+" : criticalStock}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

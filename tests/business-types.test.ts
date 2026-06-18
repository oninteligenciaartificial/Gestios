import { describe, expect, it } from "vitest";
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_SCHEMAS, BUSINESS_TYPES, hasVariantSupport } from "@/lib/business-types";
import { getBusinessUI } from "@/lib/business-ui";
import {
  filterDentalGestNavLinks,
  isDentalGestDashboardRouteAllowed,
  isDentalGestOperationalMode,
} from "@/lib/dentalgest-mode";

describe("business types", () => {
  it("includes DENTAL as an operational business type", () => {
    expect(BUSINESS_TYPES).toContain("DENTAL");
    expect(BUSINESS_TYPE_LABELS.DENTAL).toBe("Clinica Dental / Consultorio");
  });

  it("configures dental inventory variants and expiry-ready UI", () => {
    expect(BUSINESS_TYPE_SCHEMAS.DENTAL).toEqual({
      presentacion: ["Caja", "Frasco", "Unidad", "Kit", "Paquete"],
      area: ["Bioseguridad", "Operatoria", "Ortodoncia", "Endodoncia", "Limpieza"],
    });
    expect(hasVariantSupport("DENTAL")).toBe(true);

    const ui = getBusinessUI("DENTAL");
    expect(ui.pageTitle).toBe("Inventario Operativo Dental");
    expect(ui.sidebarLabels.inventory).toBe("Inventario Dental");
    expect(ui.showBatchExpiry).toBe(true);
  });

  it("scopes DentalGest mode to dental operational navigation", () => {
    const links = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/notifications", label: "Notificaciones" },
      { href: "/pos", label: "Punto de Venta" },
      { href: "/ventas", label: "Ventas" },
      { href: "/inventory", label: "Inventario Dental" },
      { href: "/inventory?vencimientos=1", label: "Vencimientos" },
      { href: "/suppliers", label: "Proveedores Dentales" },
      { href: "/purchase-orders", label: "Ordenes de Compra" },
      { href: "/categories", label: "Areas de Insumos" },
      { href: "/billing", label: "Plan y Pagos" },
      { href: "/settings", label: "Configuracion" },
      { href: "/help", label: "Ayuda" },
      { href: "/support", label: "Soporte" },
    ];

    expect(isDentalGestOperationalMode("DENTAL")).toBe(true);
    expect(filterDentalGestNavLinks(links).map((link) => link.href)).toEqual([
      "/dashboard",
      "/notifications",
      "/inventory",
      "/inventory?vencimientos=1",
      "/suppliers",
      "/purchase-orders",
      "/categories",
      "/billing",
      "/settings",
      "/help",
      "/support",
    ]);
    expect(isDentalGestDashboardRouteAllowed("/inventory/lotes")).toBe(true);
    expect(isDentalGestDashboardRouteAllowed("/settings/sessions")).toBe(true);
    expect(isDentalGestDashboardRouteAllowed("/billing")).toBe(true);
    expect(isDentalGestDashboardRouteAllowed("/pos")).toBe(false);
    expect(isDentalGestDashboardRouteAllowed("/tienda")).toBe(false);
  });
});

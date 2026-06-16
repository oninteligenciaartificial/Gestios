import { describe, expect, it } from "vitest";
import {
  PLAN_PRICES_BOB,
  PLAN_LIMITS,
  ADDON_META,
  canUseAddon,
  canUseFeature,
  isPlanAtLeast,
} from "@/lib/plans";
import type { AddonType } from "@/lib/plans";

describe("PLAN_PRICES_BOB", () => {
  it("BASICO costs 350 BOB", () => {
    expect(PLAN_PRICES_BOB.BASICO).toBe(350);
  });

  it("CRECER costs 530 BOB", () => {
    expect(PLAN_PRICES_BOB.CRECER).toBe(530);
  });

  it("PRO costs 800 BOB", () => {
    expect(PLAN_PRICES_BOB.PRO).toBe(800);
  });

  it("EMPRESARIAL costs 1250 BOB", () => {
    expect(PLAN_PRICES_BOB.EMPRESARIAL).toBe(1250);
  });

  it("prices are in ascending order", () => {
    expect(PLAN_PRICES_BOB.BASICO).toBeLessThan(PLAN_PRICES_BOB.CRECER);
    expect(PLAN_PRICES_BOB.CRECER).toBeLessThan(PLAN_PRICES_BOB.PRO);
    expect(PLAN_PRICES_BOB.PRO).toBeLessThan(PLAN_PRICES_BOB.EMPRESARIAL);
  });
});

describe("PLAN_LIMITS â€” staff", () => {
  it("BASICO has 1 staff limit", () => {
    expect(PLAN_LIMITS.BASICO.maxStaff).toBe(1);
  });

  it("CRECER has 3 staff limit", () => {
    expect(PLAN_LIMITS.CRECER.maxStaff).toBe(3);
  });

  it("PRO has 10 staff limit", () => {
    expect(PLAN_LIMITS.PRO.maxStaff).toBe(10);
  });

  it("EMPRESARIAL has infinite staff", () => {
    expect(isFinite(PLAN_LIMITS.EMPRESARIAL.maxStaff)).toBe(false);
  });
});

describe("PLAN_LIMITS â€” discounts", () => {
  it("BASICO has 3 discount limit", () => {
    expect(PLAN_LIMITS.BASICO.maxDiscounts).toBe(3);
  });

  it("CRECER and above have infinite discounts", () => {
    expect(isFinite(PLAN_LIMITS.CRECER.maxDiscounts)).toBe(false);
    expect(isFinite(PLAN_LIMITS.PRO.maxDiscounts)).toBe(false);
    expect(isFinite(PLAN_LIMITS.EMPRESARIAL.maxDiscounts)).toBe(false);
  });
});

describe("canUseAddon", () => {
  it("returns true when addon is active", () => {
    const active: AddonType[] = ["WHATSAPP", "CONTABILIDAD"];
    expect(canUseAddon(active, "WHATSAPP")).toBe(true);
    expect(canUseAddon(active, "CONTABILIDAD")).toBe(true);
  });

  it("returns false when addon is not active", () => {
    const active: AddonType[] = ["WHATSAPP"];
    expect(canUseAddon(active, "FACTURACION")).toBe(false);
    expect(canUseAddon(active, "QR_BOLIVIA")).toBe(false);
  });

  it("returns false for empty addon list", () => {
    expect(canUseAddon([], "WHATSAPP")).toBe(false);
  });
});

describe("ADDON_META", () => {
  it("WHATSAPP has price in BOB", () => {
    expect(ADDON_META.WHATSAPP.price).toBe("Bs. 280/mes");
  });

  it("WHATSAPP is not comingSoon", () => {
    expect(ADDON_META.WHATSAPP.comingSoon).toBeUndefined();
  });

  it("INVENTARIO_AVANZADO is commercially available", () => {
    expect(ADDON_META.INVENTARIO_AVANZADO.price).toBe("Bs. 120/mes");
    expect(ADDON_META.INVENTARIO_AVANZADO.comingSoon).toBeUndefined();
  });

  it("FACTURACION is retired from the commercial product", () => {
    expect(ADDON_META.FACTURACION.comingSoon).toBe(true);
    expect(ADDON_META.FACTURACION.price).toBe("No disponible");
  });

  it("QR_BOLIVIA is comingSoon", () => {
    expect(ADDON_META.QR_BOLIVIA.comingSoon).toBe(true);
  });
});

describe("canUseFeature â€” extended", () => {
  it("BASICO cannot use suppliers (requires CRECER)", () => {
    expect(canUseFeature("BASICO", "suppliers")).toBe(false);
  });

  it("CRECER can use suppliers", () => {
    expect(canUseFeature("CRECER", "suppliers")).toBe(true);
  });

  it("BASICO cannot use registro_publico (requires PRO)", () => {
    expect(canUseFeature("BASICO", "registro_publico")).toBe(false);
    expect(canUseFeature("CRECER", "registro_publico")).toBe(false);
  });

  it("PRO can use registro_publico and tienda_online", () => {
    expect(canUseFeature("PRO", "registro_publico")).toBe(true);
    expect(canUseFeature("PRO", "tienda_online")).toBe(true);
  });

  it("only EMPRESARIAL can use sucursales and roles_avanzados", () => {
    expect(canUseFeature("PRO", "sucursales")).toBe(false);
    expect(canUseFeature("EMPRESARIAL", "sucursales")).toBe(true);
    expect(canUseFeature("PRO", "roles_avanzados")).toBe(false);
    expect(canUseFeature("EMPRESARIAL", "roles_avanzados")).toBe(true);
  });

  it("PRO can use pagos_qr", () => {
    expect(canUseFeature("CRECER", "pagos_qr")).toBe(false);
    expect(canUseFeature("PRO", "pagos_qr")).toBe(true);
  });

  it("facturacion_siat is disabled for every plan", () => {
    expect(canUseFeature("BASICO", "facturacion_siat")).toBe(false);
    expect(canUseFeature("CRECER", "facturacion_siat")).toBe(false);
    expect(canUseFeature("PRO", "facturacion_siat")).toBe(false);
    expect(canUseFeature("EMPRESARIAL", "facturacion_siat")).toBe(false);
  });
});

describe("isPlanAtLeast â€” full matrix", () => {
  it("every plan is at least BASICO", () => {
    const plans = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] as const;
    plans.forEach((p) => expect(isPlanAtLeast(p, "BASICO")).toBe(true));
  });

  it("only PRO and EMPRESARIAL are at least PRO", () => {
    expect(isPlanAtLeast("BASICO", "PRO")).toBe(false);
    expect(isPlanAtLeast("CRECER", "PRO")).toBe(false);
    expect(isPlanAtLeast("PRO", "PRO")).toBe(true);
    expect(isPlanAtLeast("EMPRESARIAL", "PRO")).toBe(true);
  });
});

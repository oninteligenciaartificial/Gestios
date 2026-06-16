import { describe, expect, it } from "vitest";
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_SCHEMAS, BUSINESS_TYPES, hasVariantSupport } from "@/lib/business-types";
import { getBusinessUI } from "@/lib/business-ui";

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
});

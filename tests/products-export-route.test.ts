/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getTenantProfile: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { export: { windowMs: 60_000, max: 10 } },
  checkOrgRateLimit: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
  },
}));

describe("GET /api/products/export", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "PRO" });
  });

  it("prefixes spreadsheet formula-like CSV fields", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([
      {
        name: "=IMPORTXML(\"http://bad\")",
        sku: "+SKU",
        price: 10,
        cost: 5,
        stock: 3,
        minStock: 1,
        unit: "unidad",
        barcode: "@barcode",
        category: { name: "-Categoria" },
        supplier: { name: "Proveedor" },
      },
    ]);

    const { GET } = await import("@/app/api/products/export/route");
    const res = await GET(new Request("http://localhost/api/products/export"));
    const csv = await res.text();

    expect(res.status).toBe(200);
    expect(csv).toContain("\"'=IMPORTXML(\"\"http://bad\"\")\"");
    expect(csv).toContain("\"'+SKU\"");
    expect(csv).toContain("\"'-Categoria\"");
    expect(csv).toContain("\"'@barcode\"");
  });
});

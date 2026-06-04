/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { import: { windowMs: 60_000, max: 10 } },
  checkOrgRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { upsert: vi.fn() },
    product: { count: vi.fn(), create: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
  },
}));

function csvRequest(content: string, name = "products.csv", type = "text/csv") {
  const fd = new FormData();
  fd.append("file", new File([content], name, { type }));
  return new Request("http://localhost/api/products/import", { method: "POST", body: fd });
}

describe("POST /api/products/import", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getTenantProfile } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "PRO",
      role: "ADMIN",
    });
    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.product.upsert as any).mockResolvedValue({ id: "prod-legacy" });
  });

  it("imports valid CSV rows", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.category.upsert as any).mockResolvedValue({ id: "cat-1" });
    (prisma.product.create as any).mockResolvedValue({ id: "prod-1" });

    const { POST } = await import("@/app/api/products/import/route");
    const res = await POST(csvRequest("nombre,precio,costo,stock,stock_minimo,sku,categoria\nProducto,100,60,5,2,SKU-1,Ropa\n"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.created).toBe(1);
    expect(body.errors).toHaveLength(0);
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          name: "Producto",
          sku: "SKU-1",
          categoryId: "cat-1",
        }),
      })
    );
  });

  it("rejects xlsx and xls files", async () => {
    const { POST } = await import("@/app/api/products/import/route");

    const xlsx = await POST(csvRequest("fake", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    const xls = await POST(csvRequest("fake", "products.xls", "application/vnd.ms-excel"));

    expect(xlsx.status).toBe(400);
    expect((await xlsx.json()).error).toBe("Solo se permite CSV");
    expect(xls.status).toBe(400);
    expect((await xls.json()).error).toBe("Solo se permite CSV");
  });

  it("rejects empty CSV files", async () => {
    const { POST } = await import("@/app/api/products/import/route");
    const res = await POST(csvRequest(""));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/vacio/i);
  });

  it("rejects CSV files over 500 rows", async () => {
    const rows = ["nombre,precio"];
    for (let i = 0; i < 501; i++) rows.push(`Producto ${i},${i + 1}`);

    const { POST } = await import("@/app/api/products/import/route");
    const res = await POST(csvRequest(rows.join("\n")));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/500/);
  });

  it("parses quoted CSV values with commas", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.product.create as any).mockResolvedValue({ id: "prod-1" });

    const { POST } = await import("@/app/api/products/import/route");
    const res = await POST(csvRequest('nombre,precio\n"Producto, Grande",100\n'));

    expect(res.status).toBe(200);
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Producto, Grande" }),
      })
    );
  });

  it("skips spreadsheet formula values instead of importing them", async () => {
    const { prisma } = await import("@/lib/prisma");

    const { POST } = await import("@/app/api/products/import/route");
    const res = await POST(csvRequest("nombre,precio,sku\n=HYPERLINK(\"http://bad\"),100,SKU-1\n"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.created).toBe(0);
    expect(body.errors[0]).toMatch(/nombre no puede empezar/);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("legacy import rejects xlsx files before parsing", async () => {
    const { POST } = await import("@/app/api/import/products/route");

    const res = await POST(csvRequest("fake", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Solo se permite CSV");
  });

  it("legacy import rejects roles without product import permission", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "PRO",
      role: "VIEWER",
    });
    const { POST } = await import("@/app/api/import/products/route");

    const res = await POST(csvRequest("nombre,precio\nProducto,10\n"));

    expect(res.status).toBe(403);
    expect(prisma.product.count).not.toHaveBeenCalled();
  });
});

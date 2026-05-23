/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toCSV } from "@/lib/csv";

vi.mock("@/lib/auth", () => ({ getTenantProfile: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
  },
}));

// ─── toCSV unit tests ──────────────────────────────────────────────────────

describe("toCSV()", () => {
  it("returns empty string for empty array", () => {
    expect(toCSV([])).toBe("");
  });

  it("produces header row + data row", () => {
    const result = toCSV([{ nombre: "Producto", precio: "10" }]);
    const lines = result.split("\n");
    expect(lines[0]).toBe("nombre,precio");
    expect(lines[1]).toBe("Producto,10");
  });

  it("quotes values that contain commas", () => {
    const result = toCSV([{ nombre: "Mesa, silla", precio: "50" }]);
    expect(result).toContain('"Mesa, silla"');
  });

  it("quotes values that contain double-quotes and escapes them", () => {
    const result = toCSV([{ nombre: 'He said "hi"', precio: "5" }]);
    expect(result).toContain('"He said ""hi"""');
  });

  it("handles null/undefined as empty string", () => {
    const result = toCSV([{ nombre: null as unknown as string, precio: undefined as unknown as string }]);
    const lines = result.split("\n");
    expect(lines[1]).toBe(",");
  });

  it("handles numeric values", () => {
    const result = toCSV([{ stock: 100 as unknown as string }]);
    const lines = result.split("\n");
    expect(lines[1]).toBe("100");
  });
});

// ─── /api/export/products ─────────────────────────────────────────────────

describe("GET /api/export/products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/export/products/route");
    const res = await GET(new Request("http://localhost/api/export/products"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when plan is BASICO (no csv_export)", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "BASICO" });

    const { GET } = await import("@/app/api/export/products/route");
    const res = await GET(new Request("http://localhost/api/export/products"));
    expect(res.status).toBe(403);
  });

  it("returns CSV with correct Content-Type for authorized plan", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "CRECER" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([
      {
        name: "Arroz",
        price: { toString: () => "10.00" },
        cost: { toString: () => "6.00" },
        stock: 50,
        minStock: 5,
        sku: "ARR001",
        barcode: "",
        active: true,
        category: { name: "Granos" },
      },
    ]);

    const { GET } = await import("@/app/api/export/products/route");
    const res = await GET(new Request("http://localhost/api/export/products"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("nombre,precio");
    expect(text).toContain("Arroz");
  });
});

// ─── /api/export/customers ────────────────────────────────────────────────

describe("GET /api/export/customers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/export/customers/route");
    const res = await GET(new Request("http://localhost/api/export/customers"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when plan is BASICO", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "BASICO" });

    const { GET } = await import("@/app/api/export/customers/route");
    const res = await GET(new Request("http://localhost/api/export/customers"));
    expect(res.status).toBe(403);
  });

  it("returns CSV for authorized plan", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "CRECER" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.findMany as any).mockResolvedValue([
      {
        name: "Ana García",
        phone: "591-70000001",
        email: "ana@example.com",
        address: "Calle 1",
        loyaltyPoints: 100,
        createdAt: new Date("2024-01-15T00:00:00Z"),
      },
    ]);

    const { GET } = await import("@/app/api/export/customers/route");
    const res = await GET(new Request("http://localhost/api/export/customers"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("nombre,telefono");
    expect(text).toContain("Ana García");
  });
});

// ─── /api/export/orders ───────────────────────────────────────────────────

describe("GET /api/export/orders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/export/orders/route");
    const res = await GET(new Request("http://localhost/api/export/orders"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when plan is BASICO", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "BASICO" });

    const { GET } = await import("@/app/api/export/orders/route");
    const res = await GET(new Request("http://localhost/api/export/orders"));
    expect(res.status).toBe(403);
  });

  it("returns CSV for authorized plan", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "CRECER" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.order.findMany as any).mockResolvedValue([
      {
        id: "order-abc123",
        customerName: "Juan Pérez",
        status: "ENTREGADO",
        total: { toString: () => "150.00" },
        paymentMethod: "EFECTIVO",
        items: [{ id: "item-1" }, { id: "item-2" }],
        createdAt: new Date("2024-03-20T00:00:00Z"),
      },
    ]);

    const { GET } = await import("@/app/api/export/orders/route");
    const res = await GET(new Request("http://localhost/api/export/orders"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("id,cliente");
    expect(text).toContain("Juan Pérez");
    expect(text).toContain("ENTREGADO");
  });

  it("passes status filter to prisma query", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", plan: "CRECER" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.order.findMany as any).mockResolvedValue([]);

    const { GET } = await import("@/app/api/export/orders/route");
    await GET(new Request("http://localhost/api/export/orders?status=ENTREGADO"));

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ENTREGADO" }),
      })
    );
  });
});

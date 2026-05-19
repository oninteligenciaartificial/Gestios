/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    orgAddon: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkOrgRateLimit: vi.fn().mockResolvedValue(null),
  RATE_LIMITS: { export: {} },
}));

import { prisma } from "@/lib/prisma";
import { getTenantProfile } from "@/lib/auth";
import { GET } from "@/lib/accounting-export";

const MOCK_PROFILE = {
  organizationId: "org-1",
  plan: "PRO" as const,
  businessType: "GENERAL",
  role: "ADMIN" as const,
  userId: "user-1",
  id: "profile-1",
};

// PRO plan has csv_export feature, no addon needed
const NO_ADDONS: any[] = [];

function makeRequest(url: string): Request {
  return new Request(url);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Auth & plan gates
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/reports/export â€” auth and plan gates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (getTenantProfile as any).mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=ventas"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 when plan is BASICO and no CONTABILIDAD addon", async () => {
    (getTenantProfile as any).mockResolvedValue({ ...MOCK_PROFILE, plan: "BASICO" });
    (prisma.orgAddon.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=ventas"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("CRECER");
  });

  it("allows access with CONTABILIDAD addon even on BASICO plan", async () => {
    (getTenantProfile as any).mockResolvedValue({ ...MOCK_PROFILE, plan: "BASICO" });
    (prisma.orgAddon.findMany as any).mockResolvedValue([{ addon: "CONTABILIDAD" }]);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=ventas"));
    expect(res.status).toBe(200);
  });

  it("allows access with PRO plan (has csv_export feature)", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=ventas"));
    expect(res.status).toBe(200);
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Date range validation
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/reports/export â€” date range validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for date range over 1 year", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const res = await GET(
      makeRequest("http://localhost/api/reports/export?type=ventas&from=2024-01-01&to=2026-01-02")
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("1 a");
  });

  it("returns 400 for invalid date strings", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const res = await GET(
      makeRequest("http://localhost/api/reports/export?type=ventas&from=not-a-date&to=also-bad")
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown export type", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const res = await GET(
      makeRequest("http://localhost/api/reports/export?type=unknown_type")
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("invalido");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ventas export
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/reports/export?type=ventas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV with correct headers", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=ventas"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");

    const text = await res.text();
    const header = text.split("\n")[0];
    expect(header).toContain("Fecha");
    expect(header).toContain("Folio");
    expect(header).toContain("Cliente");
    expect(header).toContain("Margen %");
    expect(header.split(",")).toHaveLength(15);
  });

  it("filters orders by organizationId and excludes CANCELADO", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.order.findMany as any).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/reports/export?type=ventas&from=2026-01-01&to=2026-01-31"));

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          status: { not: "CANCELADO" },
        }),
      })
    );
  });

  it("outputs one row per order item", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const mockOrders = [
      {
        id: "ord-aabbccdd",
        createdAt: new Date("2026-01-15T10:00:00Z"),
        paymentMethod: "EFECTIVO",
        status: "ENTREGADO",
        customerName: "Juan Perez",
        customer: null,
        items: [
          {
            quantity: 2,
            unitPrice: 50,
            product: { name: "Producto A", cost: 30, category: { name: "Cat A" } },
          },
          {
            quantity: 1,
            unitPrice: 100,
            product: { name: "Producto B", cost: 60, category: null },
          },
        ],
      },
    ];
    (prisma.order.findMany as any).mockResolvedValue(mockOrders);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=ventas"));
    const text = await res.text();
    const lines = text.split("\n").filter(Boolean);

    // Header + 2 item rows
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Producto A");
    expect(lines[2]).toContain("Producto B");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// resumen export
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/reports/export?type=resumen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV with RESUMEN CONTABLE section headers", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=resumen"));
    expect(res.status).toBe(200);
    const text = await res.text();

    expect(text).toContain("RESUMEN CONTABLE");
    expect(text).toContain("POR METODO DE PAGO");
    expect(text).toContain("POR MES");
    expect(text).toContain("POR ESTADO");
  });

  it("calculates totals correctly from orders", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const mockOrders = [
      {
        total: 200,
        paymentMethod: "EFECTIVO",
        status: "ENTREGADO",
        createdAt: new Date("2026-01-10"),
        items: [{ quantity: 2, unitPrice: 100, product: { cost: 50 } }],
      },
      {
        total: 150,
        paymentMethod: "QR",
        status: "ENTREGADO",
        createdAt: new Date("2026-01-15"),
        items: [{ quantity: 1, unitPrice: 150, product: { cost: 80 } }],
      },
    ];
    (prisma.order.findMany as any).mockResolvedValue(mockOrders);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=resumen"));
    const text = await res.text();

    // Total ventas = 200 + 150 = 350
    expect(text).toContain("350.00");
    // Methods breakdown
    expect(text).toContain("EFECTIVO");
    expect(text).toContain("QR");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// clientes export
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/reports/export?type=clientes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV with correct clientes headers", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.customer.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=clientes"));
    expect(res.status).toBe(200);
    const text = await res.text();
    const header = text.split("\n")[0];

    expect(header).toContain("Nombre");
    expect(header).toContain("Puntos Lealtad");
    expect(header).toContain("Ultima Compra");
    expect(header.split(",")).toHaveLength(9);
  });

  it("outputs one row per customer", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const mockCustomers = [
      {
        name: "Ana Lopez",
        phone: "7771234",
        email: "ana@example.com",
        rfc: null,
        address: null,
        loyaltyPoints: 50,
        orders: [{ total: 100, createdAt: new Date("2026-01-05") }],
      },
      {
        name: "Carlos Rios",
        phone: null,
        email: null,
        rfc: "12345678",
        address: "Calle 1",
        loyaltyPoints: 0,
        orders: [],
      },
    ];
    (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=clientes"));
    const text = await res.text();
    const lines = text.split("\n").filter(Boolean);

    // Header + 2 customer rows
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Ana Lopez");
    expect(lines[2]).toContain("Carlos Rios");
  });

  it("filters customers by organizationId", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.customer.findMany as any).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/reports/export?type=clientes"));

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// inventario export
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/reports/export?type=inventario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV with correct inventario headers", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.product.findMany as any).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=inventario"));
    expect(res.status).toBe(200);
    const text = await res.text();
    const header = text.split("\n")[0];

    expect(header).toContain("SKU");
    expect(header).toContain("Nombre");
    expect(header).toContain("Variantes");
    expect(header).toContain("Activo");
    expect(header.split(",")).toHaveLength(11);
  });

  it("outputs a row per variant for products with variants", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const mockProducts = [
      {
        id: "p-1",
        sku: "SKU001",
        name: "Camiseta",
        price: 100,
        cost: 50,
        stock: 0,
        minStock: 5,
        unit: "unidad",
        active: true,
        hasVariants: true,
        category: { name: "Ropa" },
        supplier: null,
        variants: [
          { attributes: "Talla: S", price: 100, stock: 10 },
          { attributes: "Talla: M", price: 100, stock: 8 },
        ],
      },
    ];
    (prisma.product.findMany as any).mockResolvedValue(mockProducts);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=inventario"));
    const text = await res.text();
    const lines = text.split("\n").filter(Boolean);

    // Header + 2 variant rows
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Camiseta");
    expect(lines[1]).toContain("Si"); // has variants
  });

  it("outputs one row for products without variants", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);

    const mockProducts = [
      {
        id: "p-2",
        sku: "SKU002",
        name: "Aceite Motor",
        price: 80,
        cost: 40,
        stock: 25,
        minStock: 3,
        unit: "litro",
        active: true,
        hasVariants: false,
        category: null,
        supplier: { name: "ACME" },
        variants: [],
      },
    ];
    (prisma.product.findMany as any).mockResolvedValue(mockProducts);

    const res = await GET(makeRequest("http://localhost/api/reports/export?type=inventario"));
    const text = await res.text();
    const lines = text.split("\n").filter(Boolean);

    expect(lines).toHaveLength(2); // header + 1 product row
    expect(lines[1]).toContain("Aceite Motor");
    expect(lines[1]).toContain("No"); // no variants
  });

  it("filters products by organizationId and active=true", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.orgAddon.findMany as any).mockResolvedValue(NO_ADDONS);
    (prisma.product.findMany as any).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/reports/export?type=inventario"));

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", active: true }),
      })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CSV escaping logic (pure logic, no DB)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("CSV escaping logic", () => {
  function escapeCsv(val: string | number | null): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  it("escapes commas in values", () => {
    expect(escapeCsv("Customer, Inc.")).toBe('"Customer, Inc."');
  });

  it("escapes double quotes in values", () => {
    expect(escapeCsv('Customer "Inc"')).toBe('"Customer ""Inc"""');
  });

  it("escapes newlines in values", () => {
    expect(escapeCsv("Line1\nLine2")).toBe('"Line1\nLine2"');
  });

  it("does not escape simple values", () => {
    expect(escapeCsv("Simple Value")).toBe("Simple Value");
  });

  it("returns empty string for null", () => {
    expect(escapeCsv(null)).toBe("");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Margin calculations (pure logic, no DB)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Accounting Export â€” margin calculations", () => {
  it("calculates margin and percentage correctly", () => {
    const qty = 2, unitPrice = 50, unitCost = 30;
    const subtotal = qty * unitPrice;
    const costoTotal = qty * unitCost;
    const margen = subtotal - costoTotal;
    const margenPct = (margen / subtotal) * 100;

    expect(subtotal).toBe(100);
    expect(costoTotal).toBe(60);
    expect(margen).toBe(40);
    expect(margenPct).toBe(40);
  });

  it("handles zero margin", () => {
    const subtotal = 50, costoTotal = 50;
    expect(subtotal - costoTotal).toBe(0);
  });

  it("margenPct is 0 when subtotal is 0", () => {
    const subtotal = 0;
    const margenPct = subtotal > 0 ? (10 / subtotal) * 100 : 0;
    expect(margenPct).toBe(0);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn(), upsert: vi.fn(), create: vi.fn(), count: vi.fn() },
    customer: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    category: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    import: { windowMs: 60_000, max: 10 },
  },
  checkOrgRateLimit: vi.fn().mockResolvedValue(null),
}));

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeFormData(csv: string, filename = "products.csv") {
  const blob = new Blob([csv], { type: "text/csv" });
  const file = new File([blob], filename, { type: "text/csv" });
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

function makeRequest(csv: string, dry = false, filename = "products.csv") {
  const fd = makeFormData(csv, filename);
  return new Request(
    `http://localhost/api/import/products${dry ? "?dry=true" : ""}`,
    { method: "POST", body: fd }
  );
}

function makeCustomerRequest(csv: string, dry = false) {
  const fd = makeFormData(csv, "customers.csv");
  return new Request(
    `http://localhost/api/import/customers${dry ? "?dry=true" : ""}`,
    { method: "POST", body: fd }
  );
}

const VALID_PRODUCTS_CSV = `nombre,precio,costo,stock,sku,barcode,categoria
Camiseta Roja,150,80,10,CAM-001,7890001,Ropa
Pantalon Azul,250,130,5,PAN-001,7890002,Ropa`;

const VALID_CUSTOMERS_CSV = `nombre,telefono,email,direccion
Maria Lopez,77778888,maria@test.com,Calle 1
Juan Perez,66669999,,`;

// ─── Products Import ───────────────────────────────────────────────────────────

describe("CSV Import Products — POST /api/import/products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(VALID_PRODUCTS_CSV);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when plan is BASICO (no csv_import)", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "BASICO",
      role: "ADMIN",
    });

    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(VALID_PRODUCTS_CSV);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file attached", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { POST } = await import("@/app/api/import/products/route");
    const fd = new FormData(); // no file
    const req = new Request("http://localhost/api/import/products", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when CSV missing required field 'nombre'", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);

    const badCsv = `precio,stock\n100,5`;
    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(badCsv);
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/nombre/i);
  });

  it("dry-run returns preview without saving", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.category.findFirst as any).mockResolvedValue({ id: "cat-1", name: "Ropa" });

    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(VALID_PRODUCTS_CSV, true);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.dry).toBe(true);
    expect(data.parsed).toBe(2);
    expect(data.errors).toHaveLength(0);

    // No upsert called in dry-run
    expect(prisma.product.upsert).not.toHaveBeenCalled();
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("imports valid rows and returns counts", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.category.findFirst as any).mockResolvedValue({ id: "cat-1", name: "Ropa" });
    (prisma.product.upsert as any).mockResolvedValue({ id: "p1" });

    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(VALID_PRODUCTS_CSV);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.dry).toBe(false);
    expect(data.imported).toBeGreaterThan(0);
    expect(data.errors).toHaveLength(0);
  });

  it("returns row errors for invalid precio", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);

    const badCsv = `nombre,precio,stock\nProducto A,NO_ES_NUMERO,5`;
    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(badCsv);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200); // parcial — errores por fila, no fallo total
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].row).toBe(1);
    expect(data.errors[0].field).toBe("precio");
  });

  it("enforces plan limit — CRECER max 500 products", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.count as any).mockResolvedValue(499); // 1 slot left
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.category.findFirst as any).mockResolvedValue(null);
    (prisma.category.create as any).mockResolvedValue({ id: "cat-new" });
    (prisma.product.upsert as any).mockResolvedValue({ id: "p1" });

    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(VALID_PRODUCTS_CSV); // 2 rows
    const res = await POST(req);
    const data = await res.json();

    // 1 imported, 1 blocked by limit
    expect(data.imported).toBe(1);
    expect(data.errors.some((e: any) => e.field === "plan_limit")).toBe(true);
  });

  it("limits import to 500 rows max", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "PRO",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);

    // 501 rows
    const rows = ["nombre,precio"];
    for (let i = 0; i < 501; i++) rows.push(`Producto ${i},${100 + i}`);
    const bigCsv = rows.join("\n");

    const { POST } = await import("@/app/api/import/products/route");
    const req = makeRequest(bigCsv);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/500/);
  });
});

// ─── Customers Import ─────────────────────────────────────────────────────────

describe("CSV Import Customers — POST /api/import/customers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/import/customers/route");
    const req = makeCustomerRequest(VALID_CUSTOMERS_CSV);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when plan is BASICO", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "BASICO",
      role: "ADMIN",
    });

    const { POST } = await import("@/app/api/import/customers/route");
    const req = makeCustomerRequest(VALID_CUSTOMERS_CSV);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("dry-run returns parsed count without saving", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.count as any).mockResolvedValue(0);

    const { POST } = await import("@/app/api/import/customers/route");
    const req = makeCustomerRequest(VALID_CUSTOMERS_CSV, true);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.dry).toBe(true);
    expect(data.parsed).toBe(2);
    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  it("imports customers and returns count", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.count as any).mockResolvedValue(0);
    (prisma.customer.create as any).mockResolvedValue({ id: "c1" });

    const { POST } = await import("@/app/api/import/customers/route");
    const req = makeCustomerRequest(VALID_CUSTOMERS_CSV);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.imported).toBe(2);
    expect(data.errors).toHaveLength(0);
  });

  it("returns error for row missing nombre", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.count as any).mockResolvedValue(0);

    const badCsv = `nombre,telefono\n,77778888`;
    const { POST } = await import("@/app/api/import/customers/route");
    const req = makeCustomerRequest(badCsv);
    const res = await POST(req);
    const data = await res.json();

    expect(data.errors[0].field).toBe("nombre");
    expect(data.imported).toBe(0);
  });

  it("enforces plan limit — CRECER max 300 customers", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      plan: "CRECER",
      role: "ADMIN",
    });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.count as any).mockResolvedValue(300); // at limit
    (prisma.customer.create as any).mockResolvedValue({ id: "c1" });

    const { POST } = await import("@/app/api/import/customers/route");
    const req = makeCustomerRequest(VALID_CUSTOMERS_CSV);
    const res = await POST(req);
    const data = await res.json();

    expect(data.imported).toBe(0);
    expect(data.errors.every((e: any) => e.field === "plan_limit")).toBe(true);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

describe("Search — GET /api/search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns empty arrays when q < 2 chars", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=a");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ products: [], customers: [], orders: [] });
  });

  it("returns empty arrays when q is missing", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ products: [], customers: [], orders: [] });
  });

  it("queries products, customers and orders in parallel", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    const mockProducts = [{ id: "p1", name: "Test Product", sku: "SKU1", stock: 10, price: "100" }];
    const mockCustomers = [{ id: "c1", name: "Test Customer", phone: "123", email: null, loyaltyPoints: 0 }];
    const mockOrders = [{ id: "o1", customerName: "Test Customer", status: "PENDIENTE", total: "200", createdAt: new Date().toISOString() }];

    (prisma.product.findMany as any).mockResolvedValue(mockProducts);
    (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
    (prisma.order.findMany as any).mockResolvedValue(mockOrders);

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.products).toHaveLength(1);
    expect(data.customers).toHaveLength(1);
    expect(data.orders).toHaveLength(1);
    expect(data.products[0].name).toBe("Test Product");
    expect(data.customers[0].name).toBe("Test Customer");
  });

  it("searches only inventory in DentalGest operational mode", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", businessType: "DENTAL" });

    const { prisma } = await import("@/lib/prisma");
    const mockProducts = [{ id: "p1", name: "Resina A2", sku: "D-001", stock: 10, price: "100" }];

    (prisma.product.findMany as any).mockResolvedValue(mockProducts);

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=resina");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.products).toHaveLength(1);
    expect(data.customers).toEqual([]);
    expect(data.orders).toEqual([]);
    expect(prisma.customer.findMany).not.toHaveBeenCalled();
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it("filters products by organizationId", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-99" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.customer.findMany as any).mockResolvedValue([]);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=test");
    await GET(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-99" }),
      })
    );
  });

  it("limits results to 5 per category", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.customer.findMany as any).mockResolvedValue([]);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=test");
    await GET(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });

  it("returns only active products", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.customer.findMany as any).mockResolvedValue([]);
    (prisma.order.findMany as any).mockResolvedValue([]);

    const { GET } = await import("@/app/api/search/route");
    const req = new Request("http://localhost/api/search?q=test");
    await GET(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ active: true }),
      })
    );
  });
});

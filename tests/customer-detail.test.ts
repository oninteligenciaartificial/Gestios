/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: vi.fn(() => true),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

describe("Customer Detail — GET /api/customers/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/customers/[id]/route");
    const req = new Request("http://localhost/api/customers/cust-1");
    const res = await GET(req, { params: Promise.resolve({ id: "cust-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when customer not found or wrong org", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.findFirst as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/customers/[id]/route");
    const req = new Request("http://localhost/api/customers/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("returns customer with orders when found", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    const mockCustomer = {
      id: "cust-1",
      organizationId: "org-1",
      name: "Maria Lopez",
      email: "maria@example.com",
      phone: "7777-8888",
      loyaltyPoints: 150,
      createdAt: new Date("2026-01-01"),
      orders: [
        {
          id: "ord-1",
          customerName: "Maria Lopez",
          status: "ENTREGADO",
          total: "300.00",
          paymentMethod: "EFECTIVO",
          createdAt: new Date("2026-03-01"),
          items: [
            { quantity: 2, product: { name: "Producto A" } },
          ],
        },
      ],
    };
    (prisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

    const { GET } = await import("@/app/api/customers/[id]/route");
    const req = new Request("http://localhost/api/customers/cust-1");
    const res = await GET(req, { params: Promise.resolve({ id: "cust-1" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.name).toBe("Maria Lopez");
    expect(data.loyaltyPoints).toBe(150);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].items[0].product.name).toBe("Producto A");
  });

  it("filters by both id and organizationId", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-5" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.findFirst as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/customers/[id]/route");
    const req = new Request("http://localhost/api/customers/cust-5");
    await GET(req, { params: Promise.resolve({ id: "cust-5" }) });

    expect(prisma.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cust-5", organizationId: "org-5" },
      })
    );
  });

  it("includes last 20 orders ordered by createdAt desc", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.customer.findFirst as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/customers/[id]/route");
    const req = new Request("http://localhost/api/customers/cust-1");
    await GET(req, { params: Promise.resolve({ id: "cust-1" }) });

    expect(prisma.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          orders: expect.objectContaining({
            take: 20,
            orderBy: { createdAt: "desc" },
          }),
        }),
      })
    );
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ getTenantProfile: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { aggregate: vi.fn(), count: vi.fn() },
    customer: { count: vi.fn() },
    product: { findMany: vi.fn() },
  },
}));

describe("GET /api/dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns prev field with revenue, orderCount, newCustomers", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");

    // current period calls (gte: thirtyDaysAgo)
    (prisma.order.aggregate as any)
      .mockResolvedValueOnce({ _sum: { total: 1000 }, _count: { id: 10 } }) // current
      .mockResolvedValueOnce({ _sum: { total: 800 }, _count: { id: 8 } });   // prev

    (prisma.order.count as any)
      .mockResolvedValueOnce(15)  // current orderCount
      .mockResolvedValueOnce(12); // prev orderCount

    (prisma.customer.count as any)
      .mockResolvedValueOnce(5)   // current newCustomers
      .mockResolvedValueOnce(4);  // prev newCustomers

    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    const body = await res.json();

    expect(body.prev).toBeDefined();
    expect(typeof body.prev.revenue).toBe("number");
    expect(typeof body.prev.orderCount).toBe("number");
    expect(typeof body.prev.newCustomers).toBe("number");
  });

  it("returns delta field with percentage values", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");

    (prisma.order.aggregate as any)
      .mockResolvedValueOnce({ _sum: { total: 1200 }, _count: { id: 12 } })
      .mockResolvedValueOnce({ _sum: { total: 1000 }, _count: { id: 10 } });

    (prisma.order.count as any)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(10);

    (prisma.customer.count as any)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(4);

    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    const body = await res.json();

    expect(body.delta).toBeDefined();
    expect(body.delta.revenue).toBeCloseTo(20); // (1200-1000)/1000*100
    expect(body.delta.orderCount).toBeCloseTo(100); // (20-10)/10*100
  });

  it("delta is null when previous period has 0 sales (avoid division by zero)", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");

    (prisma.order.aggregate as any)
      .mockResolvedValueOnce({ _sum: { total: 500 }, _count: { id: 5 } })
      .mockResolvedValueOnce({ _sum: { total: 0 }, _count: { id: 0 } });

    (prisma.order.count as any)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);

    (prisma.customer.count as any)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);

    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    const body = await res.json();

    expect(body.delta.revenue).toBeNull();
    expect(body.delta.orderCount).toBeNull();
    expect(body.delta.newCustomers).toBeNull();
  });

  it("delta is positive when current > previous", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");

    (prisma.order.aggregate as any)
      .mockResolvedValueOnce({ _sum: { total: 2000 }, _count: { id: 20 } })
      .mockResolvedValueOnce({ _sum: { total: 1000 }, _count: { id: 10 } });

    (prisma.order.count as any)
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(20);

    (prisma.customer.count as any)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);

    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    const body = await res.json();

    expect(body.delta.revenue).toBeGreaterThan(0);
    expect(body.delta.orderCount).toBeGreaterThan(0);
  });

  it("delta is negative when current < previous", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");

    (prisma.order.aggregate as any)
      .mockResolvedValueOnce({ _sum: { total: 500 }, _count: { id: 5 } })
      .mockResolvedValueOnce({ _sum: { total: 1000 }, _count: { id: 10 } });

    (prisma.order.count as any)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(20);

    (prisma.customer.count as any)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(8);

    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    const body = await res.json();

    expect(body.delta.revenue).toBeLessThan(0);
    expect(body.delta.orderCount).toBeLessThan(0);
  });
});

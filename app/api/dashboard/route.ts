import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { prisma } from "@/lib/prisma";

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = profile.organizationId as string;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  if (isDentalGestOperationalMode(profile.businessType)) {
    const expiryLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [inventoryTotal, stockAlerts, expiringSoon, supplierCount] = await Promise.all([
      prisma.product.count({ where: { organizationId: orgId, active: true } }),
      prisma.product.count({ where: { organizationId: orgId, active: true, stock: { lte: 5 } } }),
      prisma.product.count({
        where: { organizationId: orgId, active: true, batchExpiry: { gte: now, lte: expiryLimit } },
      }),
      prisma.supplier.count({ where: { organizationId: orgId } }),
    ]);

    return NextResponse.json({
      current: {
        revenue: 0,
        orderCount: 0,
        newCustomers: 0,
        avgTicket: 0,
        inventoryTotal,
        stockAlerts,
        expiringSoon,
        supplierCount,
      },
      prev: { revenue: 0, orderCount: 0, newCustomers: 0, avgTicket: 0 },
      delta: { revenue: null, orderCount: null, newCustomers: null, avgTicket: null },
    });
  }

  // Current period (last 30 days)
  const [currentRevAgg, currentOrderCount, currentNewCustomers] = await Promise.all([
    prisma.order.aggregate({
      where: { organizationId: orgId, status: "ENTREGADO", createdAt: { gte: thirtyDaysAgo } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.order.count({
      where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.customer.count({
      where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const currentRevenue = Number(currentRevAgg._sum.total ?? 0);
  const currentDeliveredCount = currentRevAgg._count.id;
  const currentAvgTicket = currentDeliveredCount > 0 ? currentRevenue / currentDeliveredCount : 0;

  // Previous period (days 31-60)
  const [prevRevAgg, prevOrderCount, prevNewCustomers] = await Promise.all([
    prisma.order.aggregate({
      where: { organizationId: orgId, status: "ENTREGADO", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.order.count({
      where: { organizationId: orgId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.customer.count({
      where: { organizationId: orgId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
  ]);

  const prevRevenue = Number(prevRevAgg._sum.total ?? 0);
  const prevDeliveredCount = prevRevAgg._count.id;
  const prevAvgTicket = prevDeliveredCount > 0 ? prevRevenue / prevDeliveredCount : 0;

  const prev = {
    revenue: prevRevenue,
    orderCount: prevOrderCount,
    newCustomers: prevNewCustomers,
    avgTicket: prevAvgTicket,
  };

  const delta = {
    revenue: calcDelta(currentRevenue, prevRevenue),
    orderCount: calcDelta(currentOrderCount, prevOrderCount),
    newCustomers: calcDelta(currentNewCustomers, prevNewCustomers),
    avgTicket: calcDelta(currentAvgTicket, prevAvgTicket),
  };

  return NextResponse.json({
    current: {
      revenue: currentRevenue,
      orderCount: currentOrderCount,
      newCustomers: currentNewCustomers,
      avgTicket: currentAvgTicket,
    },
    prev,
    delta,
  });
}

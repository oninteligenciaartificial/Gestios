import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  // Include full day for "to" date
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  const orgId = profile.organizationId;

  const [orders, topProductItems, stockAlerts, totalCustomers, staffSales, noMovementProducts] = await Promise.all([
    prisma.order.findMany({
      where: { organizationId: orgId, createdAt: { gte: from, lte: toEnd }, status: { not: "CANCELADO" } },
      select: { total: true, createdAt: true, paymentMethod: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { organizationId: orgId, createdAt: { gte: from, lte: toEnd }, status: { not: "CANCELADO" } } },
      include: { product: { select: { name: true, cost: true } } },
    }),
    prisma.product.findMany({
      where: { organizationId: orgId, active: true },
      select: { id: true, name: true, stock: true, minStock: true },
    }),
    prisma.customer.count({ where: { organizationId: orgId } }),
    prisma.order.groupBy({
      by: ["staffId"],
      where: { organizationId: orgId, createdAt: { gte: from, lte: toEnd }, status: { not: "CANCELADO" }, staffId: { not: null } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.product.findMany({
      where: {
        organizationId: orgId,
        active: true,
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        orderItems: { none: { order: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
      },
      select: { id: true, name: true, stock: true, updatedAt: true },
      take: 10,
    }),
  ]);

  // Get staff names for staffSales
  const staffIds = staffSales.map(s => s.staffId).filter(Boolean) as string[];
  const staffProfiles = staffIds.length > 0
    ? await prisma.profile.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } })
    : [];
  const staffMap = Object.fromEntries(staffProfiles.map(p => [p.id, p.name]));

  const totalRevenue = orders.reduce((sum: number, o: { total: unknown }) => sum + Number(o.total), 0);
  const totalOrders = orders.length;

  // Top selling products with margin
  const productSales: Record<string, { name: string; quantity: number; revenue: number; margin: number }> = {};
  for (const item of topProductItems) {
    const key = item.productId;
    if (!productSales[key]) productSales[key] = { name: item.product.name, quantity: 0, revenue: 0, margin: 0 };
    productSales[key].quantity += item.quantity;
    productSales[key].revenue += item.quantity * Number(item.unitPrice);
    productSales[key].margin += item.quantity * (Number(item.unitPrice) - Number(item.product.cost));
  }
  const topSelling = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const lowStock = stockAlerts.filter((p: { id: string; name: string; stock: number; minStock: number }) => p.stock <= p.minStock);

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {};
  for (const o of orders) {
    const method = o.paymentMethod ?? "EFECTIVO";
    paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + Number(o.total);
  }

  // Sales by staff
  const salesByStaff = staffSales.map(s => ({
    staffId: s.staffId,
    staffName: staffMap[s.staffId ?? ""] ?? "Sin asignar",
    total: Number(s._sum.total ?? 0),
    orders: s._count.id,
  }));

  // Total margin
  const totalMargin = Object.values(productSales).reduce((sum, p) => sum + p.margin, 0);

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalMargin,
    topSelling,
    lowStock,
    paymentBreakdown,
    salesByStaff,
    noMovement: noMovementProducts,
  });
}

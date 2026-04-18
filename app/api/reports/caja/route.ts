import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      organizationId: profile.organizationId,
      createdAt: { gte: startOfDay, lt: endOfDay },
      status: { not: "CANCELADO" },
    },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const cancelled = await prisma.order.count({
    where: {
      organizationId: profile.organizationId,
      createdAt: { gte: startOfDay, lt: endOfDay },
      status: "CANCELADO",
    },
  });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Top products sold today
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId;
      if (!productMap[key]) productMap[key] = { name: item.product.name, qty: 0, revenue: 0 };
      productMap[key].qty += item.quantity;
      productMap[key].revenue += item.quantity * Number(item.unitPrice);
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return NextResponse.json({
    date: startOfDay.toISOString(),
    totalRevenue,
    totalOrders,
    avgTicket,
    cancelled,
    topProducts,
    orders: orders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      total: Number(o.total),
      status: o.status,
      items: o.items.length,
      createdAt: o.createdAt,
    })),
  });
}

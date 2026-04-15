import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  const orgId = profile.organizationId;

  const [orders, topProducts, stockAlerts, totalCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { organizationId: orgId, createdAt: { gte: from, lte: to }, status: { not: "CANCELADO" } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { organizationId: orgId, createdAt: { gte: from, lte: to }, status: { not: "CANCELADO" } } },
      include: { product: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { organizationId: orgId, active: true },
      select: { id: true, name: true, stock: true, minStock: true },
    }),
    prisma.customer.count({ where: { organizationId: orgId } }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;

  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const item of topProducts) {
    const key = item.productId;
    if (!productSales[key]) productSales[key] = { name: item.product.name, quantity: 0, revenue: 0 };
    productSales[key].quantity += item.quantity;
    productSales[key].revenue += item.quantity * Number(item.unitPrice);
  }
  const topSelling = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const lowStock = stockAlerts.filter((p) => p.stock <= p.minStock);

  return NextResponse.json({ totalRevenue, totalOrders, totalCustomers, topSelling, lowStock });
}

import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], customers: [], orders: [] });

  const orgId = profile.organizationId;
  const lower = q.toLowerCase();

  const [products, customers, orders] = await Promise.all([
    prisma.product.findMany({
      where: {
        organizationId: orgId,
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, sku: true, stock: true, price: true },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: lower } },
          { email: { contains: lower } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true, loyaltyPoints: true },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { customerName: { contains: q, mode: "insensitive" } },
          { id: { contains: lower } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, customerName: true, status: true, total: true, createdAt: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ products, customers, orders });
}

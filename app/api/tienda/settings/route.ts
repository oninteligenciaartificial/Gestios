import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_COMMERCE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { canUseFeature, planGateError } from "@/lib/plans";

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile?.organizationId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType))
    return NextResponse.json({ error: DENTALGEST_COMMERCE_DISABLED_ERROR }, { status: 403 });
  if (!canUseFeature(profile.plan, "tienda_online"))
    return NextResponse.json(planGateError("tienda_online"), { status: 403 });

  const org = await prisma.organization.findUnique({
    where: { id: profile.organizationId },
    select: {
      slug: true,
      name: true,
      currency: true,
      _count: { select: { products: { where: { active: true } } } },
      orders: {
        where: { notes: { contains: "Email:" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, customerName: true, total: true, createdAt: true },
      },
    },
  });

  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  return NextResponse.json({
    slug: org.slug,
    name: org.name,
    currency: org.currency,
    activeProducts: org._count.products,
    lastOrder: org.orders[0] ?? null,
  });
}

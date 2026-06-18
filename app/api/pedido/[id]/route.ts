import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/pedido/[id] - public order tracking (no auth required).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await checkRateLimit(request, "public-order-tracking", RATE_LIMITS.read);
  if (rateLimited) return rateLimited;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      customerName: true,
      status: true,
      paymentMethod: true,
      total: true,
      shippingAddress: true,
      // notes omitted: contains serialized customer email/phone (PII).
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          name: true,
          slug: true,
          businessType: true,
        },
      },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          variantSnapshot: true,
          product: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (isDentalGestOperationalMode(order.organization.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }

  return NextResponse.json(order);
}

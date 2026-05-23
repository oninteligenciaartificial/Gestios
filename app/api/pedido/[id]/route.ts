import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pedido/[id] — public order tracking (no auth required)
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      notes: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          name: true,
          slug: true,
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

  return NextResponse.json(order);
}

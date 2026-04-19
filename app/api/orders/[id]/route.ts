import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdate } from "@/lib/email";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"]),
  notes: z.string().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, customer: true },
  });

  if (!order || order.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!order || order.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const updated = await prisma.order.update({ where: { id }, data: result.data });

  // Restore stock when cancelling
  if (result.data.status === "CANCELADO" && order.status !== "CANCELADO") {
    await Promise.all(
      order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );
  }

  // Re-decrement stock if un-cancelling
  if (result.data.status !== "CANCELADO" && order.status === "CANCELADO") {
    await Promise.all(
      order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );
  }

  // Send status update email if customer has email and status changed
  const customerEmail = order.customer?.email;
  if (customerEmail && result.data.status !== order.status) {
    const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });
    sendOrderStatusUpdate({
      to: customerEmail,
      customerName: order.customerName,
      orgName: org?.name ?? "Tu Tienda",
      orderId: order.id,
      status: result.data.status,
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}

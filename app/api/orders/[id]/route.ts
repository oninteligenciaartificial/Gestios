import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdate, sendLoyaltyPointsEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { reportAsyncError } from "@/lib/monitoring";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"]),
  notes: z.string().optional(),
});

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "pendiente",
  CONFIRMADO: "confirmado",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getTenantProfile();
  if (!profile || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }
  if (!hasPermission(profile.role, "orders:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

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
  if (order.status === "ENTREGADO" && result.data.status !== "ENTREGADO") {
    return NextResponse.json({ error: "Los pedidos entregados no pueden cambiar de estado" }, { status: 400 });
  }

  let updated: typeof order;
  try {
    updated = await prisma.$transaction(async (tx) => {
      if (result.data.status === "CANCELADO" && order.status !== "CANCELADO") {
        for (const item of order.items) {
          const res = item.variantId
            ? await tx.productVariant.updateMany({
                where: { id: item.variantId, productId: item.productId, organizationId: profile.organizationId },
                data: { stock: { increment: item.quantity } },
              })
            : await tx.product.updateMany({
                where: { id: item.productId, organizationId: profile.organizationId },
                data: { stock: { increment: item.quantity } },
              });
          if (res.count !== 1) throw new Error("STOCK_UPDATE_FAILED");
        }
      }

      if (result.data.status !== "CANCELADO" && order.status === "CANCELADO") {
        for (const item of order.items) {
          const res = item.variantId
            ? await tx.productVariant.updateMany({
                where: { id: item.variantId, productId: item.productId, organizationId: profile.organizationId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
              })
            : await tx.product.updateMany({
                where: { id: item.productId, organizationId: profile.organizationId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
              });
          if (res.count !== 1) throw new Error("STOCK_INSUFICIENTE");
        }
      }

      return tx.order.update({ where: { id }, data: result.data, include: { items: true, customer: true } });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "STOCK_INSUFICIENTE") {
      return NextResponse.json({ error: "Stock insuficiente para reactivar el pedido" }, { status: 409 });
    }
    if (msg === "STOCK_UPDATE_FAILED") {
      return NextResponse.json({ error: "No se pudo actualizar el stock del pedido" }, { status: 409 });
    }
    throw err;
  }

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: user.id, action: "update", entityType: "order", entityId: id, before: { status: order.status }, after: { status: result.data.status } });

  const customerEmail = order.customer?.email;
  const statusChanged = result.data.status !== order.status;

  if (statusChanged) {
    const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });
    const orgName = org?.name ?? "Tu Tienda";
    const statusLabel = STATUS_LABELS[result.data.status] ?? result.data.status.toLowerCase();

    createNotification({
      organizationId: profile.organizationId,
      type: "pedido_actualizado",
      title: "Pedido actualizado",
      body: `${order.customerName} ahora esta ${statusLabel}`,
      link: `/ventas/${order.id}`,
    }).catch((error) => {
      reportAsyncError("api.ordersById.createNotification", error, {
        orderId: order.id,
        organizationId: profile.organizationId,
      });
    });

    if (customerEmail) {
      sendOrderStatusUpdate({
        to: customerEmail,
        customerName: order.customerName,
        orgName,
        orderId: order.id,
        status: result.data.status,
      }).catch((error) => {
        reportAsyncError("api.ordersById.sendOrderStatusUpdate", error, {
          orderId: order.id,
          organizationId: profile.organizationId,
        });
      });
    }

    // Loyalty points on delivery — always accumulate, email only if customer has one
    if (result.data.status === "ENTREGADO" && order.customerId) {
      const POINTS_PER_BOB = 0.1; // 1 punto por cada Bs. 10
      const pointsEarned = Math.floor(Number(order.total) * POINTS_PER_BOB);
      const updatedCustomer = await prisma.customer.update({
        where: { id: order.customerId },
        data: { loyaltyPoints: { increment: pointsEarned } },
        select: { loyaltyPoints: true },
      });
      if (customerEmail) {
        sendLoyaltyPointsEmail({
          to: customerEmail,
          customerName: order.customerName,
          orgName,
          pointsEarned,
          totalPoints: updatedCustomer.loyaltyPoints,
        }).catch((error) => {
          reportAsyncError("api.ordersById.sendLoyaltyPointsEmail", error, {
            orderId: order.id,
            customerId: order.customerId,
            organizationId: profile.organizationId,
          });
        });
      }
    }
  }

  return NextResponse.json(updated);
}

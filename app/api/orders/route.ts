import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email";
import { createLowStockNotificationsForProducts, createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission } from "@/lib/permissions";
import { checkOrgRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { reportAsyncError } from "@/lib/monitoring";

const createSchema = z.object({
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"]).default("EFECTIVO"),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  loyaltyPointsRedeemed: z.number().int().min(0).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    variantId: z.string().optional(),
    variantSnapshot: z.record(z.string(), z.unknown()).optional(),
  })).min(1),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const VALID_STATUSES = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"] as const;
  type ValidStatus = typeof VALID_STATUSES[number];
  const validStatus = VALID_STATUSES.includes(status as ValidStatus) ? (status as ValidStatus) : undefined;

  const where = {
    organizationId: profile.organizationId,
    ...(validStatus ? { status: validStatus } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        customer: true,
        staff: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }
  if (!hasPermission(profile.role, "orders:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Rate limit: 60 orders per minute per org
  const rateLimited = await checkOrgRateLimit(profile.organizationId, "orders", { windowMs: 60_000, max: 60 });
  if (rateLimited) return rateLimited;

  const staffProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { customerName, customerId, paymentMethod, shippingAddress, notes, loyaltyPointsRedeemed, items } = result.data;

  const customer = customerId
    ? await prisma.customer.findFirst({
        where: { id: customerId, organizationId: profile.organizationId },
        select: { loyaltyPoints: true },
      })
    : null;
  if (customerId && !customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // V-01 fix: validate unitPrice against actual product/variant price to prevent manipulation
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = [...new Set(items.map((i) => i.variantId).filter((id): id is string => Boolean(id)))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId: profile.organizationId, active: true },
    select: { id: true, price: true },
  });
  const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]));
  const variants = variantIds.length > 0
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds }, organizationId: profile.organizationId, active: true },
        select: { id: true, productId: true, price: true },
      })
    : [];
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of items) {
    const productPrice = priceMap.get(item.productId);
    if (productPrice === undefined) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    const variant = item.variantId ? variantMap.get(item.variantId) : null;
    if (item.variantId && (!variant || variant.productId !== item.productId)) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }
    const expectedPrice = variant?.price !== null && variant?.price !== undefined
      ? Number(variant.price)
      : productPrice;
    if (Math.abs(item.unitPrice - expectedPrice) > 0.01) {
      return NextResponse.json({ error: "Precio manipulado. Recarga la página e intenta de nuevo." }, { status: 400 });
    }
  }

  const subtotalRaw = items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);

  // 10 points = Bs. 1 discount
  const POINTS_TO_BOB = 0.1;
  let pointsDiscount = 0;
  let actualPointsRedeemed = 0;
  if (loyaltyPointsRedeemed && loyaltyPointsRedeemed > 0 && customerId) {
    actualPointsRedeemed = Math.min(loyaltyPointsRedeemed, customer?.loyaltyPoints ?? 0);
    pointsDiscount = Math.min(actualPointsRedeemed * POINTS_TO_BOB, subtotalRaw);
  }
  const total = Math.max(0, subtotalRaw - pointsDiscount);

  let order: Prisma.OrderGetPayload<{ include: { items: { include: { product: true } }, customer: true } }>;
  try {
    order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          organizationId: profile.organizationId,
          customerName: customerName.trim(),
          customerId: customerId ?? null,
          staffId: staffProfile?.id ?? null,
          paymentMethod,
          shippingAddress: shippingAddress ?? null,
          notes: loyaltyPointsRedeemed && loyaltyPointsRedeemed > 0
            ? `${notes ? notes + " | " : ""}Puntos canjeados: ${actualPointsRedeemed} (-Bs. ${pointsDiscount.toFixed(2)})`
            : (notes ?? null),
          total,
          items: {
            create: items.map((i): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              variantId: i.variantId ?? null,
              variantSnapshot: (i.variantSnapshot ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
            })),
          },
        },
        include: { items: { include: { product: true } }, customer: true },
      });

      for (const item of items) {
        const stockResult = item.variantId
          ? await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                productId: item.productId,
                organizationId: profile.organizationId,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            })
          : await tx.product.updateMany({
              where: {
                id: item.productId,
                organizationId: profile.organizationId,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });
        if (stockResult.count !== 1) throw new Error("STOCK_CONFLICT");
      }

      if (actualPointsRedeemed > 0 && customerId) {
        const loyaltyResult = await tx.customer.updateMany({
          where: {
            id: customerId,
            organizationId: profile.organizationId,
            loyaltyPoints: { gte: actualPointsRedeemed },
          },
          data: { loyaltyPoints: { decrement: actualPointsRedeemed } },
        });
        if (loyaltyResult.count !== 1) throw new Error("LOYALTY_CONFLICT");
      }

      return createdOrder;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CONFLICT") {
      return NextResponse.json({ error: "Stock insuficiente o producto no disponible" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "LOYALTY_CONFLICT") {
      return NextResponse.json({ error: "Puntos insuficientes" }, { status: 409 });
    }
    throw error;
  }

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: user.id, action: "create", entityType: "order", entityId: order.id, after: { total, items: items.length, paymentMethod } });

  const productsAfterStock = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId: profile.organizationId, active: true },
    select: { id: true, name: true, stock: true, minStock: true, hasVariants: true },
  });
  createLowStockNotificationsForProducts({
    organizationId: profile.organizationId,
    products: productsAfterStock,
  }).catch((error) => {
    reportAsyncError("api.orders.lowStockNotifications", error, {
      orderId: order.id,
      organizationId: profile.organizationId,
    });
  });

  const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });
  const orgName = org?.name ?? "Tu Tienda";
  const orderItems = order.items.map(i => ({ name: i.product.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) }));
  const formattedTotal = Number(order.total).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  createNotification({
    organizationId: profile.organizationId,
    type: "nuevo_pedido",
    title: "Nuevo pedido recibido",
    body: `${order.customerName} - Bs. ${formattedTotal}`,
    link: `/ventas/${order.id}`,
  }).catch((error) => {
    reportAsyncError("api.orders.createNotification", error, {
      orderId: order.id,
      organizationId: profile.organizationId,
    });
  });

  // Confirmation email to customer
  const customerEmail = order.customer?.email;
  if (customerEmail) {
    sendOrderConfirmation({
      to: customerEmail,
      customerName: order.customerName,
      orgName,
      orderId: order.id,
      items: orderItems,
      total: Number(order.total),
      paymentMethod,
    }).catch((error) => {
      reportAsyncError("api.orders.sendOrderConfirmation", error, {
        orderId: order.id,
        organizationId: profile.organizationId,
      });
    });
  }

  // New order alert to admin
  const adminProfiles = await prisma.profile.findMany({
    where: { organizationId: profile.organizationId, role: "ADMIN" },
    select: { userId: true },
  });
  if (adminProfiles.length > 0) {
    const supabaseAdmin = createAdminClient();
    const adminEmails = (await Promise.all(
      adminProfiles.map(p => supabaseAdmin.auth.admin.getUserById(p.userId).then(r => r.data.user?.email))
    )).filter(Boolean) as string[];
    for (const email of adminEmails) {
      sendNewOrderAlert({
        to: email,
        orgName,
        orderId: order.id,
        customerName: order.customerName,
        total: Number(order.total),
        items: orderItems,
        paymentMethod,
      }).catch((error) => {
        reportAsyncError("api.orders.sendNewOrderAlert", error, {
          orderId: order.id,
          organizationId: profile.organizationId,
          email,
        });
      });
    }
  }

  return NextResponse.json(order, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";
import { sendOrderConfirmation } from "@/lib/email";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { PlanType } from "@/lib/plans";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";

const schema = z.object({
  slug: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    variantId: z.string().optional(),
    variantSnapshot: z.record(z.string(), z.unknown()).optional(),
  })).min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { slug, customerName, customerEmail, customerPhone, shippingAddress, notes, items } = result.data;

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, plan: true },
  });

  if (!org) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  if (!canUseFeature(org.plan as PlanType, "tienda_online"))
    return NextResponse.json({ error: "Tienda no disponible" }, { status: 403 });

  const ip = getRequestIp(new Headers(request.headers));
  const rateLimit = await consumeRateLimit(`tienda:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId: org.id, active: true },
    select: {
      id: true, stock: true, hasVariants: true, price: true,
      variants: { select: { id: true, stock: true, price: true } },
    },
  });
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  for (const item of items) {
    const p = productMap[item.productId];
    if (!p) return NextResponse.json({ error: `Producto no disponible` }, { status: 400 });

    let price: number;
    if (item.variantId) {
      const v = p.variants.find(v => v.id === item.variantId);
      if (!v || v.stock < item.quantity) return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
      price = Number(v.price ?? p.price);
    } else {
      if (!p.hasVariants && p.stock < item.quantity) return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
      price = Number(p.price);
    }

    if (Math.abs(item.unitPrice - price) > 0.01) {
      return NextResponse.json({ error: "Precio manipulado. Recarga la página e intenta de nuevo." }, { status: 400 });
    }
  }

  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const notesStr = [
    notes,
    customerEmail ? `Email: ${customerEmail}` : null,
    customerPhone ? `Tel: ${customerPhone}` : null,
  ].filter(Boolean).join(" | ") || null;

  // Interactive transaction: atomic stock check + decrement + order creation
  // Throwing inside rolls back everything — prevents race conditions / negative stock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Decrement stock atomically — updateMany returns {count:0} if stock insufficient
      for (const i of items) {
        const res = i.variantId
          ? await tx.productVariant.updateMany({
              where: { id: i.variantId, stock: { gte: i.quantity } },
              data: { stock: { decrement: i.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: i.productId, stock: { gte: i.quantity } },
              data: { stock: { decrement: i.quantity } },
            });
        if (res.count === 0) {
          throw new Error("STOCK_INSUFICIENTE");
        }
      }
      // All stock decrements succeeded — create the order
      return tx.order.create({
        data: {
          organizationId: org.id,
          customerName: customerName.trim(),
          paymentMethod: "TRANSFERENCIA",
          status: "PENDIENTE",
          total,
          shippingAddress: shippingAddress ?? null,
          notes: notesStr,
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
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "STOCK_INSUFICIENTE") {
      return NextResponse.json({ error: "Stock insuficiente. Alguien más compró antes. Recarga e intenta de nuevo." }, { status: 409 });
    }
    throw err;
  }

  if (customerEmail) {
    const orderItems = order.items.map(i => ({ name: i.product.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) }));
    sendOrderConfirmation({
      to: customerEmail,
      customerName: order.customerName,
      orgName: org.name,
      orderId: order.id,
      total,
      paymentMethod: "TRANSFERENCIA",
      items: orderItems,
    }).catch(() => null);
  }

  return NextResponse.json({ orderId: order.id, total }, { status: 201 });
}

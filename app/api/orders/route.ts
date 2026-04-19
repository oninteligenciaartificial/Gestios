import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { z } from "zod";

const createSchema = z.object({
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"]).default("EFECTIVO"),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      organizationId: profile.organizationId,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      items: { include: { product: true } },
      customer: true,
      staff: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const staffProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { customerName, customerId, paymentMethod, shippingAddress, notes, items } = result.data;
  const total = items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);

  const order = await prisma.order.create({
    data: {
      organizationId: profile.organizationId,
      customerName: customerName.trim(),
      customerId: customerId ?? null,
      staffId: staffProfile?.id ?? null,
      paymentMethod,
      shippingAddress: shippingAddress ?? null,
      notes: notes ?? null,
      total,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  await Promise.all(
    items.map((i) =>
      prisma.product.update({
        where: { id: i.productId },
        data: { stock: { decrement: i.quantity } },
      })
    )
  );

  // Send confirmation email if customer has an email
  const customerEmail = order.customer?.email;
  if (customerEmail) {
    const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });
    sendOrderConfirmation({
      to: customerEmail,
      customerName: order.customerName,
      orgName: org?.name ?? "Tu Tienda",
      orderId: order.id,
      items: order.items.map(i => ({ name: i.product.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
      total: Number(order.total),
      paymentMethod,
    }).catch(() => {});
  }

  return NextResponse.json(order, { status: 201 });
}

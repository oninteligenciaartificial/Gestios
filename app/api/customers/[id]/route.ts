import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  rfc: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

const patchSchema = z.object({
  loyaltyPointsAdjustment: z.number().int(),
  reason: z.string().min(1),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }

  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: profile.organizationId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, customerName: true, status: true, total: true,
          paymentMethod: true, createdAt: true,
          items: { select: { quantity: true, product: { select: { name: true } } } },
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }
  if (!hasPermission(profile.role, "customers:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = patchSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const existing = await prisma.customer.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { loyaltyPointsAdjustment, reason } = result.data;
  const newPoints = Math.max(0, existing.loyaltyPoints + loyaltyPointsAdjustment);

  const customer = await prisma.customer.update({
    where: { id },
    data: { loyaltyPoints: newPoints },
  });

  logAudit({
    orgId: profile.organizationId,
    orgPlan: profile.plan,
    userId: profile.userId,
    action: "loyalty_adjustment",
    entityType: "customer",
    entityId: id,
    before: { loyaltyPoints: existing.loyaltyPoints },
    after: { loyaltyPoints: newPoints, adjustment: loyaltyPointsAdjustment, reason },
  });

  return NextResponse.json(customer);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }
  if (!hasPermission(profile.role, "customers:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const existing = await prisma.customer.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data = result.data;
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      phone: data.phone ?? null,
      email: data.email || null,
      address: data.address ?? null,
      rfc: data.rfc ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      notes: data.notes ?? null,
    },
  });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "update", entityType: "customer", entityId: id, before: { name: existing.name, phone: existing.phone, email: existing.email }, after: { name: customer.name, phone: customer.phone, email: customer.email } });

  return NextResponse.json(customer);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }
  if (!hasPermission(profile.role, "customers:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.customer.delete({ where: { id } });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "delete", entityType: "customer", entityId: id, before: { name: existing.name }, after: null });

  return NextResponse.json({ ok: true });
}

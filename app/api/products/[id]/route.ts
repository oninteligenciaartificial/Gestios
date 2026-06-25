import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createLowStockNotificationForProduct } from "@/lib/notifications";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!product || product.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  if (result.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: result.data.categoryId, organizationId: profile.organizationId },
      select: { id: true },
    });
    if (!category) return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
  }

  if (result.data.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: result.data.supplierId, organizationId: profile.organizationId },
      select: { id: true },
    });
    if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }

  const updated = await prisma.product.update({ where: { id }, data: result.data });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "update", entityType: "product", entityId: id, before: { name: product.name, price: product.price, stock: product.stock }, after: { name: updated.name, price: updated.price, stock: updated.stock } });

  createLowStockNotificationForProduct({
    organizationId: profile.organizationId,
    product: {
      id: updated.id,
      name: updated.name,
      stock: updated.stock,
      minStock: updated.minStock,
      hasVariants: updated.hasVariants,
    },
  }).catch(() => {});

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await prisma.product.update({ where: { id }, data: { active: false } });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "delete", entityType: "product", entityId: id, before: { name: product.name }, after: null });

  return NextResponse.json({ ok: true });
}

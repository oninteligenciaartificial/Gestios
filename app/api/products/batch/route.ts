import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createLowStockNotificationsForProducts } from "@/lib/notifications";

const batchSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  action: z.enum(["price", "stock", "deactivate", "activate"]),
  value: z.number().optional(),
});

export async function PATCH(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { ids, action, value } = parsed.data;

  if ((action === "price" || action === "stock") && value === undefined) {
    return NextResponse.json({ error: "value is required for price and stock actions" }, { status: 400 });
  }

  const requiredPermission = action === "deactivate" ? "products:delete" : "products:edit";
  if (!hasPermission(profile.role, requiredPermission)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  // Verify ownership: only update products belonging to this org
  const ownedProducts = await prisma.product.findMany({
    where: { id: { in: ids }, organizationId: profile.organizationId },
    select: { id: true, stock: true },
  });

  const ownedIds = ownedProducts.map((p) => p.id);

  if (ownedIds.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  if (action === "price") {
    await prisma.product.updateMany({
      where: { id: { in: ownedIds }, organizationId: profile.organizationId },
      data: { price: value! },
    });
  } else if (action === "stock") {
    // Update each product's stock individually (increment)
    await Promise.all(
      ownedProducts.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { stock: Math.max(0, p.stock + value!) },
        })
      )
    );
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: ownedIds }, organizationId: profile.organizationId, active: true },
      select: { id: true, name: true, stock: true, minStock: true, hasVariants: true },
    });
    createLowStockNotificationsForProducts({
      organizationId: profile.organizationId,
      products: updatedProducts,
    }).catch(() => {});
  } else if (action === "deactivate") {
    await prisma.product.updateMany({
      where: { id: { in: ownedIds }, organizationId: profile.organizationId },
      data: { active: false },
    });
  } else if (action === "activate") {
    await prisma.product.updateMany({
      where: { id: { in: ownedIds }, organizationId: profile.organizationId },
      data: { active: true },
    });
  }

  return NextResponse.json({ updated: ownedIds.length });
}

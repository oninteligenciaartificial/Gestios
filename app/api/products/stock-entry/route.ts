import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const existing = await prisma.product.findFirst({
    where: { id: result.data.productId, organizationId: profile.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const updated = await prisma.product.update({
    where: { id: result.data.productId },
    data: { stock: { increment: result.data.quantity } },
  });

  return NextResponse.json(updated);
}

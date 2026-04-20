import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(["PORCENTAJE", "MONTO_FIJO"]),
  value: z.number().min(0),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan, "discounts")) return NextResponse.json(planGateError("discounts"), { status: 403 });

  const discounts = await prisma.discount.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(discounts);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const discount = await prisma.discount.create({
    data: {
      organizationId: profile.organizationId,
      code: result.data.code,
      description: result.data.description ?? null,
      type: result.data.type,
      value: result.data.value,
      expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : null,
    },
  });

  return NextResponse.json(discount, { status: 201 });
}

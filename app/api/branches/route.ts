import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan, "sucursales")) {
    return NextResponse.json(planGateError("sucursales"), { status: 403 });
  }

  const branches = await prisma.branch.findMany({
    where: { organizationId: profile.organizationId, active: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  if (!canUseFeature(profile.plan, "sucursales")) {
    return NextResponse.json(planGateError("sucursales"), { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const branch = await prisma.branch.create({
    data: {
      organizationId: profile.organizationId,
      name: result.data.name,
      address: result.data.address ?? null,
      phone: result.data.phone ?? null,
    },
  });

  return NextResponse.json(branch, { status: 201 });
}

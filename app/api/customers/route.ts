import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  rfc: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const customers = await prisma.customer.findMany({
    where: {
      organizationId: profile.organizationId,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { maxCustomers } = PLAN_LIMITS[profile.plan];
  if (isFinite(maxCustomers)) {
    const count = await prisma.customer.count({ where: { organizationId: profile.organizationId } });
    if (count >= maxCustomers) {
      return NextResponse.json({ error: `Tu plan permite hasta ${maxCustomers} clientes. Actualiza tu plan para agregar más.`, upgrade: true, requiredPlan: "PRO" }, { status: 403 });
    }
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      organizationId: profile.organizationId,
      name: result.data.name.trim(),
      phone: result.data.phone ?? null,
      email: result.data.email || null,
      address: result.data.address ?? null,
      rfc: result.data.rfc ?? null,
      birthday: result.data.birthday ? new Date(result.data.birthday) : null,
      notes: result.data.notes ?? null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}

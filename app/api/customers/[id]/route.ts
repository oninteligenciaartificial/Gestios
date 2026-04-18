import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

  return NextResponse.json(customer);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

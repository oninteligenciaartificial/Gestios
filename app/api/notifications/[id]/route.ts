import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as { read?: boolean };

  const notif = await prisma.notification.findFirst({
    where: { id, organizationId: profile.organizationId },
  });
  if (!notif) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.notification.update({
    where: { id },
    data: { ...(body.read !== undefined && { read: body.read }) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const notif = await prisma.notification.findFirst({
    where: { id, organizationId: profile.organizationId },
  });
  if (!notif) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

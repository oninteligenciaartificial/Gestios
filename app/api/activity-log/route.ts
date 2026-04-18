import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const logs = await prisma.activityLog.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const { action, entity, entityId, details, userName } = body as {
    action: string; entity: string; entityId?: string; details?: string; userName: string;
  };

  if (!action || !entity || !userName) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const log = await prisma.activityLog.create({
    data: {
      organizationId: profile.organizationId,
      userId: profile.userId,
      userName,
      action,
      entity,
      entityId: entityId ?? null,
      details: details ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

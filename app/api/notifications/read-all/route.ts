import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { count } = await prisma.notification.updateMany({
    where: { organizationId: profile.organizationId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ updated: count });
}

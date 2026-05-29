import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(): Promise<NextResponse> {
  try {
    const profile = await getTenantProfile();
    if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { count } = await prisma.notification.updateMany({
      where: { organizationId: profile.organizationId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true, updated: count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

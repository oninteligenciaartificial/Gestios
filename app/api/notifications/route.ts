import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const profile = await getTenantProfile();
    if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true" || searchParams.get("unread_only") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          organizationId: profile.organizationId,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { organizationId: profile.organizationId, read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const profile = await getTenantProfile();
    if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (profile.role !== "ADMIN" && profile.role !== "MANAGER") {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }

    const body = await request.json() as { type: string; title: string; body: string; link?: string };
    if (!body.type || !body.title || !body.body) {
      return NextResponse.json({ error: "type, title y body requeridos" }, { status: 400 });
    }

    const notif = await prisma.notification.create({
      data: {
        organizationId: profile.organizationId,
        type: body.type,
        title: body.title,
        body: body.body,
        link: body.link ?? null,
      },
    });

    return NextResponse.json(notif, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

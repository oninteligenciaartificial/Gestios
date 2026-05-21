import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSuperAdmin } from "@/lib/superadmin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export async function POST(request: Request) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const rateLimited = await checkRateLimit(request, "superadmin-impersonate", { windowMs: 60_000, max: 10 });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const schema = z.object({ orgId: z.string().min(1) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid orgId" }, { status: 400 });
  const { orgId } = parsed.data;

  let org;
  try {
    org = await prisma.organization.findUnique({ where: { id: orgId } });
  } catch {
    return NextResponse.json({ error: "Error al buscar organizacion" }, { status: 500 });
  }
  if (!org) return NextResponse.json({ error: "Organizacion no encontrada" }, { status: 404 });

  const cookieStore = await cookies();
  cookieStore.set("impersonate_org_id", orgId, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  cookieStore.set("impersonate_org_name", org.name, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const cookieStore = await cookies();
  cookieStore.delete("impersonate_org_id");
  cookieStore.delete("impersonate_org_name");

  return NextResponse.json({ ok: true });
}

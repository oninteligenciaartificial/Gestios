// Helper compartido: verifica que el usuario sea SUPERADMIN
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.role !== "SUPERADMIN") return null;
  return profile;
}

// GET /api/superadmin — stats generales de la plataforma
export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const [totalOrgs, totalUsers, totalOrders] = await Promise.all([
    prisma.organization.count(),
    prisma.profile.count(),
    prisma.order.count(),
  ]);

  return NextResponse.json({ totalOrgs, totalUsers, totalOrders });
}

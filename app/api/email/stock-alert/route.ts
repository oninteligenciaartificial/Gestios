import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLowStockAlert } from "@/lib/email";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const allProducts = await prisma.product.findMany({
    where: { organizationId: profile.organizationId, active: true },
    select: { name: true, stock: true, minStock: true },
  });

  const lowStock = allProducts.filter(p => p.stock <= p.minStock);

  if (lowStock.length === 0) {
    return NextResponse.json({ message: "No hay productos con stock bajo" });
  }

  const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });

  await sendLowStockAlert({
    to: user.email!,
    orgName: org?.name ?? "Tu Tienda",
    products: lowStock,
  });

  return NextResponse.json({ sent: true, count: lowStock.length });
}

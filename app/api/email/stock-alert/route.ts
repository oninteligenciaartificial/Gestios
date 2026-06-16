import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { sendLowStockAlert } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan, "stock_alert")) return NextResponse.json(planGateError("stock_alert"), { status: 403 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "stock-alert-email", RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

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

  await createNotification({
    organizationId: profile.organizationId,
    type: "stock_bajo",
    title: "Alerta de stock bajo enviada",
    body: `${lowStock.length} producto(s) necesitan reabastecimiento`,
    link: "/inventory",
    userId: user.id,
  });

  return NextResponse.json({ sent: true, count: lowStock.length });
}

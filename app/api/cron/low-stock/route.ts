import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLowStockAlert } from "@/lib/email";
import { reportAsyncError } from "@/lib/monitoring";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyCronSecret } from "@/lib/cron-auth";

// Runs daily at 8:30 AM — alerts org admins of products at or below minStock
// Only for orgs with stock_alert feature (CRECER+)
export async function GET(request: Request) {
  const rateLimited = await checkRateLimit(request, "cron-low-stock", RATE_LIMITS.cron);
  if (rateLimited) return rateLimited;

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    where: { plan: { in: ["CRECER", "PRO", "EMPRESARIAL"] } },
    select: { id: true, name: true, plan: true },
  });

  const supabaseAdmin = createAdminClient();
  let sent = 0;

  for (const org of orgs) {
    // Prisma can't compare two columns directly — filter in JS
    const products = (await prisma.product.findMany({
      where: { organizationId: org.id, active: true },
      select: { name: true, stock: true, minStock: true },
    })).filter(p => p.stock <= p.minStock);

    if (products.length === 0) continue;

    const adminProfiles = await prisma.profile.findMany({
      where: { organizationId: org.id, role: "ADMIN" },
      select: { userId: true },
    });

    const adminEmails = (await Promise.all(
      adminProfiles.map(p => supabaseAdmin.auth.admin.getUserById(p.userId).then(r => r.data.user?.email))
    )).filter(Boolean) as string[];

    for (const email of adminEmails) {
      await sendLowStockAlert({ to: email, orgName: org.name, products }).catch((error) => {
        reportAsyncError("cron.lowStock.sendLowStockAlert", error, {
          organizationId: org.id,
          email,
          productCount: products.length,
        });
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}

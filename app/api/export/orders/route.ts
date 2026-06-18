import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { canUseFeature, planGateError } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { toCSV } from "@/lib/csv";

export async function GET(req: Request) {
  const profile = await getTenantProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }

  if (!canUseFeature(profile.plan, "csv_export")) {
    return NextResponse.json(planGateError("csv_export"), { status: 403 });
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      organizationId: profile.organizationId,
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    include: { items: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const rows = orders.map(o => ({
    id: o.id,
    cliente: o.customerName,
    estado: o.status,
    total: o.total.toString(),
    metodo_pago: o.paymentMethod,
    items_count: o.items.length,
    creado_en: o.createdAt.toISOString().slice(0, 10),
  }));

  const csv = toCSV(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ventas.csv"',
    },
  });
}

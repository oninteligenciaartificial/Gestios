import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { canUseFeature, planGateError } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { toCSV } from "@/lib/csv";

export async function GET(request: Request) {
  void request;

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

  const customers = await prisma.customer.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { name: "asc" },
  });

  const rows = customers.map(c => ({
    nombre: c.name,
    telefono: c.phone ?? "",
    email: c.email ?? "",
    direccion: c.address ?? "",
    puntos_fidelidad: c.loyaltyPoints,
    creado_en: c.createdAt.toISOString().slice(0, 10),
  }));

  const csv = toCSV(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clientes.csv"',
    },
  });
}

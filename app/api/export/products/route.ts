import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { canUseFeature, planGateError } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { toCSV } from "@/lib/csv";

export async function GET(request: Request) {
  void request;

  const profile = await getTenantProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!canUseFeature(profile.plan, "csv_export")) {
    return NextResponse.json(planGateError("csv_export"), { status: 403 });
  }

  const products = await prisma.product.findMany({
    where: { organizationId: profile.organizationId, active: true },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const rows = products.map(p => ({
    nombre: p.name,
    precio: p.price.toString(),
    costo: p.cost.toString(),
    stock: p.stock,
    minstock: p.minStock,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    categoria: p.category?.name ?? "",
    activo: p.active ? "1" : "0",
  }));

  const csv = toCSV(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="productos.csv"',
    },
  });
}

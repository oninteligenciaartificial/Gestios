import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_MODULE_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { prisma } from "@/lib/prisma";
import { canUseFeature, PLAN_LIMITS, type PlanType } from "@/lib/plans";

const MAX_ROWS = 500;

interface RowError {
  row: number;
  field: string;
  message: string;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });

  return { headers, rows };
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_MODULE_DISABLED_ERROR }, { status: 403 });
  }

  if (!canUseFeature(profile.plan as PlanType, "csv_import")) {
    return NextResponse.json(
      { error: "Plan CRECER o superior requerido para importación CSV" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const isDry = url.searchParams.get("dry") === "true";

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo CSV requerido" }, { status: 400 });

  const text = await file.text();
  const { rows } = parseCSV(text);

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ROWS} filas por importación` },
      { status: 400 }
    );
  }

  const planLimits = PLAN_LIMITS[profile.plan as PlanType];
  const maxCustomers = planLimits.maxCustomers;
  const currentCount = await prisma.customer.count({
    where: { organizationId: profile.organizationId },
  });

  const errors: RowError[] = [];
  let imported = 0;
  let slotsUsed = currentCount;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    if (!row.nombre) {
      errors.push({ row: rowNum, field: "nombre", message: "Nombre requerido" });
      continue;
    }

    if (isFinite(maxCustomers) && slotsUsed >= maxCustomers) {
      errors.push({
        row: rowNum,
        field: "plan_limit",
        message: `Límite de clientes del plan alcanzado (${maxCustomers})`,
      });
      continue;
    }

    if (!isDry) {
      await prisma.customer.create({
        data: {
          name: row.nombre,
          phone: row.telefono || null,
          email: row.email || null,
          address: row.direccion || null,
          organizationId: profile.organizationId,
          loyaltyPoints: 0,
        },
      });
    }

    imported++;
    slotsUsed++;
  }

  return NextResponse.json({
    dry: isDry,
    parsed: rows.length,
    imported,
    errors,
  });
}

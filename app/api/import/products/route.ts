import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, PLAN_LIMITS, type PlanType } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/permissions";

const MAX_ROWS = 500;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const CSV_MIME_TYPES = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", ""]);

interface RowError {
  row: number;
  field: string;
  message: string;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => {
      if (h === "__proto__" || h === "constructor" || h === "prototype") return ["", ""];
      return [h, values[i] ?? ""];
    }).filter(([h]) => h));
  });

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv") && CSV_MIME_TYPES.has(file.type);
}

function hasSpreadsheetFormulaRisk(value: string): boolean {
  return /^[=+\-@\t\r]/.test(value.trimStart());
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:import")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  if (!canUseFeature(profile.plan as PlanType, "csv_import")) {
    return NextResponse.json(
      { error: "Plan CRECER o superior requerido para importación CSV" },
      { status: 403 }
    );
  }

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "products-import-legacy", RATE_LIMITS.import);
  if (rateLimited) return rateLimited;

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
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Archivo demasiado grande (max 5 MB)" }, { status: 413 });
  if (!isCsvFile(file)) return NextResponse.json({ error: "Solo se permite CSV" }, { status: 400 });

  const text = await file.text();
  const { headers, rows } = parseCSV(text);

  if (!headers.includes("nombre")) {
    return NextResponse.json({ error: "Columna 'nombre' requerida en CSV" }, { status: 400 });
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ROWS} filas por importación` },
      { status: 400 }
    );
  }

  const planLimits = PLAN_LIMITS[profile.plan as PlanType];
  const maxProducts = planLimits.maxProducts;
  const currentCount = await prisma.product.count({
    where: { organizationId: profile.organizationId, active: true },
  });

  // Pre-load existing SKUs to detect updates vs creates
  const existingSkus = new Set(
    (await prisma.product.findMany({
      where: { organizationId: profile.organizationId },
      select: { sku: true },
    }))
      .map((p) => p.sku)
      .filter(Boolean) as string[]
  );

  const errors: RowError[] = [];
  let imported = 0;
  let updated = 0;
  let slotsUsed = currentCount;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Validate nombre
    if (!row.nombre) {
      errors.push({ row: rowNum, field: "nombre", message: "Nombre requerido" });
      continue;
    }
    for (const field of ["nombre", "sku", "barcode", "categoria"] as const) {
      if (row[field] && hasSpreadsheetFormulaRisk(row[field])) {
        errors.push({ row: rowNum, field, message: "No puede empezar con =, +, -, @, tab o retorno" });
      }
    }
    if (errors.some((error) => error.row === rowNum)) continue;

    // Validate precio
    const precio = parseFloat(row.precio ?? "");
    if (isNaN(precio) || precio < 0) {
      errors.push({ row: rowNum, field: "precio", message: "Precio inválido o faltante" });
      continue;
    }

    const sku = row.sku || undefined;
    const isUpdate = sku ? existingSkus.has(sku) : false;

    // Plan limit check (only for new products)
    if (!isUpdate) {
      if (isFinite(maxProducts) && slotsUsed >= maxProducts) {
        errors.push({
          row: rowNum,
          field: "plan_limit",
          message: `Límite de productos del plan alcanzado (${maxProducts})`,
        });
        continue;
      }
    }

    if (!isDry) {
      // Resolve category
      let categoryId: string | undefined;
      if (row.categoria) {
        const existing = await prisma.category.findFirst({
          where: { organizationId: profile.organizationId, name: row.categoria },
        });
        if (existing) {
          categoryId = existing.id;
        } else {
          const created = await prisma.category.create({
            data: {
              name: row.categoria,
              organizationId: profile.organizationId,
              businessType: "GENERAL",
            },
          });
          categoryId = created.id;
        }
      }

      const costo = row.costo ? parseFloat(row.costo) : undefined;
      const stock = row.stock ? parseInt(row.stock) : 0;
      const minStock = row.minstock ? parseInt(row.minstock) : 0;

      const createData = {
        name: row.nombre,
        price: precio.toString(),
        ...(costo != null && { cost: costo.toString() }),
        stock,
        minStock,
        sku: sku ?? null,
        barcode: row.barcode || null,
        categoryId: categoryId ?? null,
        organizationId: profile.organizationId,
        active: true,
      };

      await prisma.product.upsert({
        where: {
          organizationId_sku: {
            organizationId: profile.organizationId,
            sku: sku ?? `__no_sku_row_${rowNum}`,
          },
        },
        create: createData,
        update: {
          name: row.nombre,
          price: precio.toString(),
          ...(costo != null && { cost: costo.toString() }),
          stock,
          ...(row.barcode && { barcode: row.barcode }),
          ...(categoryId && { categoryId }),
        },
      });
    }

    if (isUpdate) {
      updated++;
    } else {
      imported++;
      slotsUsed++;
    }
  }

  return NextResponse.json({
    dry: isDry,
    parsed: rows.length,
    imported,
    updated,
    errors,
  });
}

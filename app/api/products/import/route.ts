import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 500;
const CSV_MIME_TYPES = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", ""]);

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

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = Object.create(null);
    headers.forEach((header, index) => {
      if (header === "__proto__" || header === "constructor" || header === "prototype") return;
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv") && CSV_MIME_TYPES.has(file.type);
}

function hasSpreadsheetFormulaRisk(value: string): boolean {
  return /^[=+\-@\t\r]/.test(value.trimStart());
}

function validateSpreadsheetSafe(value: string, rowNumber: number, field: string, errors: string[]): boolean {
  if (!hasSpreadsheetFormulaRisk(value)) return true;
  errors.push(`Fila ${rowNumber}: ${field} no puede empezar con =, +, -, @, tab o retorno`);
  return false;
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Solo admins pueden importar" }, { status: 403 });

  if (!canUseFeature(profile.plan, "csv_import")) return NextResponse.json(planGateError("csv_import"), { status: 403 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "products-import", RATE_LIMITS.import);
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se subio ningun archivo" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Archivo demasiado grande (máx 5 MB)" }, { status: 413 });

  if (!isCsvFile(file)) {
    return NextResponse.json({ error: "Solo se permite CSV" }, { status: 400 });
  }

  const sanitizedRows = parseCsv(await file.text());
  if (sanitizedRows.length === 0) return NextResponse.json({ error: "El archivo esta vacio" }, { status: 400 });
  if (sanitizedRows.length > MAX_ROWS) return NextResponse.json({ error: "Maximo 500 productos por importacion" }, { status: 400 });

  const orgId = profile.organizationId;
  const created: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < sanitizedRows.length; i++) {
    const row = sanitizedRows[i];
    const name = String(row.nombre ?? row.name ?? row.Nombre ?? "").trim().slice(0, 255);
    if (!name) { errors.push(`Fila ${i + 2}: nombre requerido`); continue; }

    const price = Math.max(0, Math.min(999999, Number(row.precio ?? row.price ?? row.Precio ?? 0)));
    const cost = Math.max(0, Math.min(999999, Number(row.costo ?? row.cost ?? row.Costo ?? 0)));
    const stock = Math.max(0, Math.min(999999, Number(row.stock ?? row.Stock ?? 0)));
    const minStock = Math.max(0, Math.min(9999, Number(row.stock_minimo ?? row.min_stock ?? row["Stock Minimo"] ?? 5)));
    const sku = String(row.sku ?? row.SKU ?? "").trim().slice(0, 100) || null;
    const categoryName = String(row.categoria ?? row.category ?? row.Categoria ?? "").trim().slice(0, 100);
    if (!validateSpreadsheetSafe(name, i + 2, "nombre", errors)) continue;
    if (sku && !validateSpreadsheetSafe(sku, i + 2, "sku", errors)) continue;
    if (categoryName && !validateSpreadsheetSafe(categoryName, i + 2, "categoria", errors)) continue;

    let categoryId: string | null = null;
    if (categoryName) {
      const cat = await prisma.category.upsert({
        where: { organizationId_name: { organizationId: orgId, name: categoryName } },
        create: { organizationId: orgId, name: categoryName },
        update: {},
      });
      categoryId = cat.id;
    }

    try {
      await prisma.product.create({
        data: {
          organizationId: orgId,
          name,
          sku,
          price,
          cost,
          stock: Math.max(0, Math.floor(stock)),
          minStock: Math.max(0, Math.floor(minStock)),
          categoryId,
          active: true,
        },
      });
      created.push(name);
    } catch {
      errors.push(`Fila ${i + 2}: ${name} — SKU duplicado o error`);
    }
  }

  return NextResponse.json({ created: created.length, errors });
}

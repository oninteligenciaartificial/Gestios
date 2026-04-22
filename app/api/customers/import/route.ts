import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, PLAN_LIMITS, limitGateError } from "@/lib/plans";

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!canUseFeature(profile.plan, "csv_import")) {
    return NextResponse.json(
      { error: "La importación CSV requiere el plan Crecer o superior.", upgrade: true, requiredPlan: "CRECER" },
      { status: 403 }
    );
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo" }, { status: 400 });
  }

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "El archivo está vacío o no tiene datos" }, { status: 400 });
  }

  // Parse header: name,phone,email,address,notes
  const header = lines[0].toLowerCase().split(",").map(h => h.trim());
  const idx = {
    name: header.indexOf("name") !== -1 ? header.indexOf("name") : header.indexOf("nombre"),
    phone: header.indexOf("phone") !== -1 ? header.indexOf("phone") : header.indexOf("telefono"),
    email: header.indexOf("email") !== -1 ? header.indexOf("email") : header.indexOf("correo"),
    address: header.indexOf("address") !== -1 ? header.indexOf("address") : header.indexOf("direccion"),
    notes: header.indexOf("notes") !== -1 ? header.indexOf("notes") : header.indexOf("notas"),
  };

  if (idx.name === -1) {
    return NextResponse.json({ error: "El CSV debe tener una columna 'name' o 'nombre'" }, { status: 400 });
  }

  // Check customer limit before importing
  const maxCustomers = PLAN_LIMITS[profile.plan].maxCustomers;
  const currentCount = await prisma.customer.count({ where: { organizationId: profile.organizationId } });

  const rows = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    return {
      name: cols[idx.name] ?? "",
      phone: idx.phone !== -1 ? cols[idx.phone] || null : null,
      email: idx.email !== -1 ? cols[idx.email] || null : null,
      address: idx.address !== -1 ? cols[idx.address] || null : null,
      notes: idx.notes !== -1 ? cols[idx.notes] || null : null,
    };
  }).filter(r => r.name.length > 0);

  if (maxCustomers !== Infinity && currentCount + rows.length > maxCustomers) {
    return NextResponse.json(
      limitGateError("clientes", maxCustomers, profile.plan),
      { status: 403 }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      await prisma.customer.create({
        data: { ...row, organizationId: profile.organizationId },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, imported, skipped });
}

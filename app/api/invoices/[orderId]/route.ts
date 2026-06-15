import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";

function unavailable() {
  return NextResponse.json(
    { error: "Facturacion electronica no disponible en GestiOS." },
    { status: 410 },
  );
}

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return unavailable();
}

export async function POST() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return unavailable();
}

export async function DELETE() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return unavailable();
}

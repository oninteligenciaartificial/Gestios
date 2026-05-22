import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { generateSampleData } from "@/lib/sample-data";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Idempotency guard — products are created first, so their presence means data was loaded
  const existing = await prisma.product.count({ where: { organizationId: profile.organizationId } });
  if (existing > 0) {
    return NextResponse.json({ error: "Sample data already loaded", alreadyLoaded: true }, { status: 409 });
  }

  const result = await generateSampleData({
    organizationId: profile.organizationId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    businessType: profile.businessType as any,
  });

  return NextResponse.json(result, { status: 201 });
}

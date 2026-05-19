import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { generateSampleData } from "@/lib/sample-data";

export async function POST() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const result = await generateSampleData({
    organizationId: profile.organizationId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    businessType: profile.businessType as any,
  });

  return NextResponse.json(result, { status: 201 });
}

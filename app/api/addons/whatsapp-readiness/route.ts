import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { DENTALGEST_ADDONS_DISABLED_ERROR, isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { getWhatsAppBotReadiness } from "@/lib/whatsapp-readiness";

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDentalGestOperationalMode(profile.businessType)) {
    return NextResponse.json({ error: DENTALGEST_ADDONS_DISABLED_ERROR }, { status: 403 });
  }

  const readiness = await getWhatsAppBotReadiness(profile.organizationId);
  return NextResponse.json(readiness);
}

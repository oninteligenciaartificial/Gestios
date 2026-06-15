import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const rateLimited = await checkRateLimit(request, "cron-siat-cufd-disabled", RATE_LIMITS.cron);
  if (rateLimited) return rateLimited;

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { ok: false, error: "Facturacion electronica no disponible en GestiOS." },
    { status: 410 },
  );
}

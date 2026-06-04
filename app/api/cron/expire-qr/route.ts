import { NextResponse } from "next/server";
import { expireStaleQrs } from "@/lib/qr-bolivia";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyCronSecret } from "@/lib/cron-auth";

// Runs every 5 minutes — marks QRs past expiresAt as EXPIRADO
export async function GET(request: Request) {
  const rateLimited = await checkRateLimit(request, "cron-expire-qr", RATE_LIMITS.cron);
  if (rateLimited) return rateLimited;

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expired } = await expireStaleQrs();
  return NextResponse.json({ ok: true, expired });
}

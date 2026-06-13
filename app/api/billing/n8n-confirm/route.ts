import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPaymentRequestByReference } from "@/lib/billing";
import { verifyApiKey } from "@/lib/api-key";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const bodySchema = z.object({
  reference: z.string().regex(/^PAGO-[A-Z0-9]+-\d+$/, "Referencia BCP invalida"),
});

export async function POST(request: Request): Promise<NextResponse> {
  const rateLimited = await checkRateLimit(request, "billing-n8n-confirm", RATE_LIMITS.superadmin);
  if (rateLimited) return rateLimited;

  if (!process.env.GESTIOS_API_KEY) {
    return NextResponse.json({ error: "GESTIOS_API_KEY no configurada" }, { status: 503 });
  }

  if (!verifyApiKey(request, "GESTIOS_API_KEY")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const result = await confirmPaymentRequestByReference(parsed.data.reference, "n8n-auto");
  if (!result) {
    return NextResponse.json({ error: "Solicitud de pago no encontrada o ya procesada" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    paymentRequestId: result.paymentRequestId,
    organizationId: result.organizationId,
    reference: result.reference,
    plan: result.plan,
    months: result.months,
    confirmedAt: result.confirmedAt.toISOString(),
    planExpiresAt: result.planExpiresAt.toISOString(),
  });
}

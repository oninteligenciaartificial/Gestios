import { NextResponse } from "next/server";
import { z } from "zod";
import { getSuperAdmin } from "@/lib/superadmin";
import { prisma } from "@/lib/prisma";
import type { PlanType } from "@/lib/plans";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const bodySchema = z.object({
  reference: z.string().min(1),
  organizationId: z.string().min(1),
});

// POST /api/billing/confirm — superadmin confirma pago manual y activa plan
export async function POST(request: Request): Promise<NextResponse> {
  const rateLimited = await checkRateLimit(request, "billing-confirm", RATE_LIMITS.superadmin);
  if (rateLimited) return rateLimited;

  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { reference, organizationId } = parsed.data;

  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      reference,
      organizationId,
      status: "PENDIENTE",
    },
  });

  if (!paymentRequest) {
    return NextResponse.json(
      { error: "Solicitud de pago no encontrada o ya procesada" },
      { status: 404 }
    );
  }

  const planExpiresAt = new Date();
  planExpiresAt.setMonth(planExpiresAt.getMonth() + paymentRequest.months);

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: "CONFIRMADO",
        confirmedAt: new Date(),
        confirmedBy: admin.userId,
      },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: paymentRequest.plan as PlanType,
        planExpiresAt,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `Workspace actualizado a ${paymentRequest.plan}`,
    plan: paymentRequest.plan,
    planExpiresAt,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const BANK_INFO = {
  bank: "BCP Bolivia",
  account: "701-51726678-3-55",
  owner: "Urcullo Mercado Sergio",
} as const;

const bodySchema = z.object({
  plan: z.enum(["BASICO", "CRECER", "PRO", "EMPRESARIAL"]),
  months: z.number().int().min(1).max(12).default(1),
});

function calcDiscount(months: number): number {
  if (months >= 12) return 15;
  if (months >= 6) return 10;
  if (months >= 3) return 5;
  return 0;
}

// POST /api/billing/checkout — genera referencia de transferencia bancaria
export async function POST(request: Request): Promise<NextResponse> {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "billing-checkout", RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

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

  const { plan, months } = parsed.data;

  const pending = await prisma.paymentRequest.findFirst({
    where: { organizationId: profile.organizationId, status: "PENDIENTE" },
  });
  if (pending) {
    return NextResponse.json(
      { error: "Ya tienes una solicitud de pago pendiente. Cancélala antes de crear una nueva." },
      { status: 409 }
    );
  }

  const pricePerMonth = PLAN_PRICES_BOB[plan as PlanType];
  const discount = calcDiscount(months);
  const amountBOB = Math.round(pricePerMonth * months * (1 - discount / 100));
  const reference = `PAGO-${profile.organizationId.slice(0, 8).toUpperCase()}-${Date.now()}`;

  await prisma.paymentRequest.create({
    data: {
      organizationId: profile.organizationId,
      plan: plan as PlanType,
      months,
      amountBOB,
      reference,
    },
  });

  return NextResponse.json({
    success: true,
    reference,
    amount: amountBOB,
    currency: "BOB",
    plan,
    months,
    discount,
    instructions: {
      bank: BANK_INFO.bank,
      account: BANK_INFO.account,
      owner: BANK_INFO.owner,
      reference,
      description: "Incluir la referencia exacta en el detalle de la transferencia.",
    },
  });
}

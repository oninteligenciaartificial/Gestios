import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";
import { checkOrgRateLimit } from "@/lib/rate-limit";
import { sendPlainNotification } from "@/lib/email";
import { reportAsyncError } from "@/lib/monitoring";
import { z } from "zod";

const PAYMENT_REVIEW_EMAIL =
  process.env.PAYMENT_REVIEW_EMAIL ?? process.env.SUPERADMIN_EMAIL ?? "business@onia.com.bo";

const createSchema = z.object({
  plan: z.enum(["BASICO", "CRECER", "PRO", "EMPRESARIAL"]),
  months: z.number().int().min(1).max(12).default(1),
  reference: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const requests = await prisma.paymentRequest.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Rate limit: 5 payment requests per minute per org
  const rateLimited = await checkOrgRateLimit(profile.organizationId, "payments", { windowMs: 60_000, max: 5 });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { plan, months, reference, notes } = result.data;
  const pricePerMonth = PLAN_PRICES_BOB[plan as PlanType];
  const amountBOB = pricePerMonth * months;

  const pending = await prisma.paymentRequest.findFirst({
    where: { organizationId: profile.organizationId, status: "PENDIENTE" },
  });
  if (pending) {
    return NextResponse.json({ error: "Ya tienes una solicitud de pago pendiente." }, { status: 409 });
  }

  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      organizationId: profile.organizationId,
      plan: plan as PlanType,
      months,
      amountBOB,
      reference: reference?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(paymentRequest, { status: 201 });
}

export async function PATCH(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const result = z.object({
    id: z.string().min(1),
    action: z.enum(["ensure_reference", "notify_paid"]).default("ensure_reference"),
  }).safeParse(body);
  if (!result.success) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const existing = await prisma.paymentRequest.findFirst({
    where: { id: result.data.id, organizationId: profile.organizationId, status: "PENDIENTE" },
    include: { organization: { select: { name: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Solicitud no encontrada o ya procesada" }, { status: 404 });

  if (result.data.action === "notify_paid") {
    if (!existing.reference) {
      return NextResponse.json({ error: "Genera una referencia antes de reportar el pago." }, { status: 400 });
    }

    const amount = Number(existing.amountBOB).toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    sendPlainNotification({
      to: PAYMENT_REVIEW_EMAIL,
      subject: `Pago reportado — ${existing.organization.name}`,
      text: [
        "Un cliente marco su pago como realizado en GestiOS.",
        "",
        `Organizacion: ${existing.organization.name}`,
        `Solicitud: ${existing.id}`,
        `Plan: ${existing.plan}`,
        `Meses: ${existing.months}`,
        `Monto: Bs. ${amount}`,
        `Referencia: ${existing.reference}`,
        "",
        "Si BCP/n8n recibe la referencia exacta, el plan deberia activarse automaticamente.",
        "Si no llega con esa referencia, revisar manualmente en /superadmin/payments.",
      ].join("\n"),
    }).catch((error) => {
      reportAsyncError("api.payments.notifyPaid", error, {
        paymentRequestId: existing.id,
        organizationId: existing.organizationId,
      });
    });

    return NextResponse.json({ ok: true });
  }

  if (existing.reference) return NextResponse.json(existing);

  const reference = `PAGO-${profile.organizationId.slice(0, 8).toUpperCase()}-${Date.now()}`;
  const updated = await prisma.paymentRequest.update({
    where: { id: existing.id },
    data: { reference },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const existing = await prisma.paymentRequest.findFirst({
    where: { id, organizationId: profile.organizationId, status: "PENDIENTE" },
  });
  if (!existing) return NextResponse.json({ error: "Solicitud no encontrada o ya procesada" }, { status: 404 });

  await prisma.paymentRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

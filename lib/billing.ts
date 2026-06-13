import { prisma } from "@/lib/prisma";
import type { PlanType } from "@/lib/plans";

type ConfirmPaymentResult = {
  paymentRequestId: string;
  organizationId: string;
  organizationName: string;
  reference: string | null;
  plan: PlanType;
  months: number;
  confirmedAt: Date;
  planExpiresAt: Date;
};

export async function confirmPaymentRequestByReference(
  reference: string,
  confirmedBy: string
): Promise<ConfirmPaymentResult | null> {
  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: { reference, status: "PENDIENTE" },
    select: {
      id: true,
      organizationId: true,
      reference: true,
      plan: true,
      months: true,
      organization: {
        select: {
          name: true,
          planExpiresAt: true,
        },
      },
    },
  });

  if (!paymentRequest) return null;

  const confirmedAt = new Date();
  const base =
    paymentRequest.organization.planExpiresAt && paymentRequest.organization.planExpiresAt > confirmedAt
      ? paymentRequest.organization.planExpiresAt
      : confirmedAt;
  const planExpiresAt = new Date(base);
  planExpiresAt.setMonth(planExpiresAt.getMonth() + paymentRequest.months);

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: "CONFIRMADO",
        confirmedAt,
        confirmedBy,
      },
    }),
    prisma.organization.update({
      where: { id: paymentRequest.organizationId },
      data: {
        plan: paymentRequest.plan as PlanType,
        planExpiresAt,
        trialEndsAt: null,
      },
    }),
  ]);

  return {
    paymentRequestId: paymentRequest.id,
    organizationId: paymentRequest.organizationId,
    organizationName: paymentRequest.organization.name,
    reference: paymentRequest.reference,
    plan: paymentRequest.plan as PlanType,
    months: paymentRequest.months,
    confirmedAt,
    planExpiresAt,
  };
}

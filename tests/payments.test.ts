/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkOrgRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/email", () => ({
  sendPlainNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/monitoring", () => ({
  reportAsyncError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentRequest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/payments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const profile = {
  organizationId: "org-12345678",
  role: "ADMIN",
};

const pendingPayment = {
  id: "pay-1",
  organizationId: "org-12345678",
  plan: "CRECER",
  months: 1,
  amountBOB: 530,
  reference: null,
  status: "PENDIENTE",
  organization: { name: "Tienda Demo" },
};

describe("PATCH /api/payments", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(profile);
  });

  it("generates a missing reference for a pending payment", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.paymentRequest.findFirst as any).mockResolvedValue(pendingPayment);
    (prisma.paymentRequest.update as any).mockResolvedValue({
      ...pendingPayment,
      reference: "PAGO-ORG-123",
    });

    const { PATCH } = await import("@/app/api/payments/route");
    const res = await PATCH(patchRequest({ id: "pay-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.reference).toBe("PAGO-ORG-123");
    expect(prisma.paymentRequest.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { reference: expect.stringMatching(/^PAGO-/) },
    });
  });

  it("sends a review email when the user reports the payment", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { sendPlainNotification } = await import("@/lib/email");
    (prisma.paymentRequest.findFirst as any).mockResolvedValue({
      ...pendingPayment,
      reference: "PAGO-ORG12345-1781380000000",
    });

    const { PATCH } = await import("@/app/api/payments/route");
    const res = await PATCH(patchRequest({ id: "pay-1", action: "notify_paid" }));

    expect(res.status).toBe(200);
    expect(sendPlainNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Pago reportado"),
        text: expect.stringContaining("PAGO-ORG12345-1781380000000"),
      })
    );
  });
});

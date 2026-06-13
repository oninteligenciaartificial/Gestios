/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { superadmin: { windowMs: 60_000, max: 20 } },
  checkRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentRequest: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

function request(body: unknown, token = "test-api-key") {
  return new Request("http://localhost/api/billing/n8n-confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/billing/n8n-confirm", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.GESTIOS_API_KEY = "test-api-key";
    const { prisma } = await import("@/lib/prisma");
    (prisma.paymentRequest.update as any).mockResolvedValue({});
    (prisma.organization.update as any).mockResolvedValue({});
    (prisma.$transaction as any).mockResolvedValue([]);
  });

  it("rejects missing or invalid API key", async () => {
    const { POST } = await import("@/app/api/billing/n8n-confirm/route");

    const res = await POST(request({ reference: "PAGO-ABC12345-1781380000000" }, "wrong"));

    expect(res.status).toBe(401);
  });

  it("returns 404 when the payment request is not pending", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.paymentRequest.findFirst as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/billing/n8n-confirm/route");
    const res = await POST(request({ reference: "PAGO-ABC12345-1781380000000" }));

    expect(res.status).toBe(404);
  });

  it("confirms pending payment and activates the organization plan", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.paymentRequest.findFirst as any).mockResolvedValue({
      id: "pay-1",
      organizationId: "org-1",
      reference: "PAGO-ABC12345-1781380000000",
      plan: "CRECER",
      months: 2,
      organization: {
        name: "Org",
        planExpiresAt: null,
      },
    });

    const { POST } = await import("@/app/api/billing/n8n-confirm/route");
    const res = await POST(request({ reference: "PAGO-ABC12345-1781380000000" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.paymentRequest.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: expect.objectContaining({
        status: "CONFIRMADO",
        confirmedBy: "n8n-auto",
        confirmedAt: expect.any(Date),
      }),
    });
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: expect.objectContaining({
        plan: "CRECER",
        planExpiresAt: expect.any(Date),
        trialEndsAt: null,
      }),
    });
  });

  it("rejects references outside the BCP payment format", async () => {
    const { POST } = await import("@/app/api/billing/n8n-confirm/route");

    const res = await POST(request({ reference: "QR_CRECER_12_org" }));

    expect(res.status).toBe(400);
  });
});

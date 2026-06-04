/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  product: { updateMany: vi.fn() },
  productVariant: { updateMany: vi.fn() },
  order: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    $transaction: vi.fn(async (callback) => callback(tx)),
  },
}));

vi.mock("@/lib/email", () => ({
  sendOrderConfirmation: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 }),
  getRequestIp: vi.fn(() => "127.0.0.1"),
}));

function checkoutRequest(item: Record<string, unknown>) {
  return new Request("http://localhost/api/tienda/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: "prueba",
      customerName: "Ana",
      customerEmail: "ana@example.com",
      items: [item],
    }),
  });
}

describe("POST /api/tienda/checkout", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({ id: "org-1", name: "Prueba", plan: "PRO" });
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.productVariant.updateMany.mockResolvedValue({ count: 1 });
    tx.order.create.mockResolvedValue({
      id: "order-1",
      customerName: "Ana",
      items: [{ quantity: 1, unitPrice: 80, product: { name: "Producto" } }],
    });
  });

  it("loads only active variants and decrements variant stock with tenant scope", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([
      {
        id: "prod-1",
        stock: 0,
        hasVariants: true,
        price: 100,
        variants: [{ id: "var-1", productId: "prod-1", stock: 5, price: 80 }],
      },
    ]);

    const { POST } = await import("@/app/api/tienda/checkout/route");
    const res = await POST(checkoutRequest({ productId: "prod-1", variantId: "var-1", quantity: 1, unitPrice: 80 }));

    expect(res.status).toBe(201);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          variants: expect.objectContaining({ where: { active: true } }),
        }),
      })
    );
    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({
      where: {
        id: "var-1",
        productId: "prod-1",
        organizationId: "org-1",
        active: true,
        stock: { gte: 1 },
      },
      data: { stock: { decrement: 1 } },
    });
  });

  it("rejects checkout when requested variant is inactive or not returned", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findMany as any).mockResolvedValue([
      { id: "prod-1", stock: 0, hasVariants: true, price: 100, variants: [] },
    ]);

    const { POST } = await import("@/app/api/tienda/checkout/route");
    const res = await POST(checkoutRequest({ productId: "prod-1", variantId: "inactive-var", quantity: 1, unitPrice: 80 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Stock insuficiente");
    expect(tx.productVariant.updateMany).not.toHaveBeenCalled();
  });
});

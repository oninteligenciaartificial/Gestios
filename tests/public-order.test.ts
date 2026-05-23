/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: vi.fn() },
  },
}));

describe("Public Order — GET /api/pedido/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when order not found", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.order.findUnique as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/pedido/[id]/route");
    const req = new Request("http://localhost/api/pedido/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns order data when found", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockOrder = {
      id: "order-123",
      customerName: "John Doe",
      status: "PENDIENTE",
      paymentMethod: "EFECTIVO",
      total: "250.00",
      shippingAddress: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organization: { name: "Mi Tienda", slug: "mi-tienda" },
      items: [
        {
          quantity: 2,
          unitPrice: "125.00",
          variantSnapshot: null,
          product: { name: "Producto A" },
        },
      ],
    };
    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

    const { GET } = await import("@/app/api/pedido/[id]/route");
    const req = new Request("http://localhost/api/pedido/order-123");
    const res = await GET(req, { params: Promise.resolve({ id: "order-123" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.customerName).toBe("John Doe");
    expect(data.status).toBe("PENDIENTE");
    expect(data.items).toHaveLength(1);
    expect(data.organization.name).toBe("Mi Tienda");
  });

  it("requires no auth — public endpoint", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "order-456",
      customerName: "Jane",
      status: "ENTREGADO",
      paymentMethod: "TARJETA",
      total: "100.00",
      shippingAddress: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organization: { name: "Tienda", slug: "tienda" },
      items: [],
    });

    const { GET } = await import("@/app/api/pedido/[id]/route");
    // No auth headers — still should work
    const req = new Request("http://localhost/api/pedido/order-456");
    const res = await GET(req, { params: Promise.resolve({ id: "order-456" }) });
    expect(res.status).toBe(200);
  });

  it("includes items with product names", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "order-789",
      customerName: "Ana",
      status: "CONFIRMADO",
      paymentMethod: "TRANSFERENCIA",
      total: "500.00",
      shippingAddress: "Calle 1",
      notes: "Urgente",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organization: { name: "Shop", slug: "shop" },
      items: [
        { quantity: 1, unitPrice: "300.00", variantSnapshot: null, product: { name: "Producto X" } },
        { quantity: 2, unitPrice: "100.00", variantSnapshot: { label: "Talla L" }, product: { name: "Producto Y" } },
      ],
    });

    const { GET } = await import("@/app/api/pedido/[id]/route");
    const req = new Request("http://localhost/api/pedido/order-789");
    const res = await GET(req, { params: Promise.resolve({ id: "order-789" }) });
    const data = await res.json();

    expect(data.items).toHaveLength(2);
    expect(data.items[0].product.name).toBe("Producto X");
    expect(data.items[1].variantSnapshot).toEqual({ label: "Talla L" });
    expect(data.notes).toBe("Urgente");
    expect(data.shippingAddress).toBe("Calle 1");
  });
});

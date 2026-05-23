/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

describe("Product Detail — GET /api/products/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/products/[id]/route");
    const req = new Request("http://localhost/api/products/prod-1");
    const res = await GET(req, { params: Promise.resolve({ id: "prod-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when product not found", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findUnique as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/products/[id]/route");
    const req = new Request("http://localhost/api/products/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when product belongs to different org", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findUnique as any).mockResolvedValue({
      id: "prod-1",
      organizationId: "org-2", // different org
      name: "Stolen Product",
      price: "100",
      cost: null,
      stock: 5,
      minStock: 0,
      sku: null,
      barcode: null,
      description: null,
      imageUrl: null,
      active: true,
      category: null,
      variants: [],
    });

    const { GET } = await import("@/app/api/products/[id]/route");
    const req = new Request("http://localhost/api/products/prod-1");
    const res = await GET(req, { params: Promise.resolve({ id: "prod-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns product with category and variants when org matches", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    const mockProduct = {
      id: "prod-1",
      organizationId: "org-1",
      name: "Camiseta",
      price: "150.00",
      cost: "80.00",
      stock: 25,
      minStock: 5,
      sku: "CAM-001",
      barcode: "7898888",
      description: "Tela premium",
      imageUrl: "https://example.com/img.jpg",
      active: true,
      category: { name: "Ropa" },
      variants: [
        { id: "v1", name: "Talla S", price: "150.00", stock: 10, createdAt: new Date() },
        { id: "v2", name: "Talla M", price: "150.00", stock: 15, createdAt: new Date() },
      ],
    };
    (prisma.product.findUnique as any).mockResolvedValue(mockProduct);

    const { GET } = await import("@/app/api/products/[id]/route");
    const req = new Request("http://localhost/api/products/prod-1");
    const res = await GET(req, { params: Promise.resolve({ id: "prod-1" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.name).toBe("Camiseta");
    expect(data.sku).toBe("CAM-001");
    expect(data.category.name).toBe("Ropa");
    expect(data.variants).toHaveLength(2);
  });

  it("returns product without variants when none exist", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findUnique as any).mockResolvedValue({
      id: "prod-2",
      organizationId: "org-1",
      name: "Libro",
      price: "50.00",
      cost: null,
      stock: 100,
      minStock: 10,
      sku: null,
      barcode: null,
      description: null,
      imageUrl: null,
      active: true,
      category: null,
      variants: [],
    });

    const { GET } = await import("@/app/api/products/[id]/route");
    const req = new Request("http://localhost/api/products/prod-2");
    const res = await GET(req, { params: Promise.resolve({ id: "prod-2" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.variants).toHaveLength(0);
    expect(data.category).toBeNull();
  });

  it("includes product with correct id in findUnique call", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.product.findUnique as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/products/[id]/route");
    const req = new Request("http://localhost/api/products/prod-xyz");
    await GET(req, { params: Promise.resolve({ id: "prod-xyz" }) });

    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "prod-xyz" } })
    );
  });
});

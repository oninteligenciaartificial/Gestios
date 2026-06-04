/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock prisma before any imports that use it
vi.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseOrder: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supplier: { findFirst: vi.fn() },
    product: { findMany: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { getTenantProfile } from "@/lib/auth";
import { GET, POST, PATCH, DELETE } from "@/app/api/purchase-orders/route";

const MOCK_PROFILE = {
  organizationId: "org-1",
  plan: "PRO" as const,
  businessType: "GENERAL",
  role: "ADMIN" as const,
  userId: "user-1",
  id: "profile-1",
};

function makeRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("GET /api/purchase-orders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (getTenantProfile as any).mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/purchase-orders"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 when role lacks suppliers:view permission", async () => {
    (getTenantProfile as any).mockResolvedValue({ ...MOCK_PROFILE, role: "CAJERO" });

    const res = await GET(makeRequest("http://localhost/api/purchase-orders"));
    expect(res.status).toBe(403);
  });

  it("returns list filtered by organizationId", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);

    const mockOrders = [
      { id: "po-1", organizationId: "org-1", status: "BORRADOR", total: 500 },
      { id: "po-2", organizationId: "org-1", status: "ENVIADO", total: 300 },
    ];
    (prisma.purchaseOrder.count as any).mockResolvedValue(2);
    (prisma.purchaseOrder.findMany as any).mockResolvedValue(mockOrders);

    const res = await GET(makeRequest("http://localhost/api/purchase-orders"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
    expect(body.meta.page).toBe(1);

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
      })
    );
  });

  it("filters by status when provided", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.count as any).mockResolvedValue(1);
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/purchase-orders?status=ENVIADO"));

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", status: "ENVIADO" }),
      })
    );
  });

  it("filters by supplierId when provided", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.count as any).mockResolvedValue(0);
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/purchase-orders?supplierId=sup-1"));

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ supplierId: "sup-1" }),
      })
    );
  });

  it("paginates using page and limit params", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.count as any).mockResolvedValue(50);
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/purchase-orders?page=2&limit=10"));

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("POST /api/purchase-orders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (getTenantProfile as any).mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when role lacks suppliers:create permission", async () => {
    (getTenantProfile as any).mockResolvedValue({ ...MOCK_PROFILE, role: "CAJERO" });

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({ supplierId: "sup-1", items: [{ productId: "p", quantity: 1, unitCost: 10 }] }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when body is invalid (empty items)", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({ supplierId: "sup-1", items: [] }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when required fields are missing", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when supplier not found in org", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.supplier.findFirst as any).mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId: "sup-x",
          items: [{ productId: "prod-1", quantity: 2, unitCost: 50 }],
        }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(404);
  });

  it("creates a purchase order and returns 201 with correct total", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.supplier.findFirst as any).mockResolvedValue({ id: "sup-1", name: "ACME" });
    (prisma.product.findMany as any).mockResolvedValue([{ id: "prod-1" }, { id: "prod-2" }]);

    const createdPO = {
      id: "po-new",
      organizationId: "org-1",
      supplierId: "sup-1",
      total: 200,
      status: "BORRADOR",
      supplier: { name: "ACME" },
      items: [],
    };
    (prisma.purchaseOrder.create as any).mockResolvedValue(createdPO);

    const payload = {
      supplierId: "sup-1",
      items: [
        { productId: "prod-1", quantity: 2, unitCost: 50 },
        { productId: "prod-2", quantity: 1, unitCost: 100 },
      ],
    };

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("po-new");

    // Total = 2*50 + 1*100 = 200
    expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          supplierId: "sup-1",
          total: 200,
        }),
      })
    );
  });

  it("includes items in the create call", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.supplier.findFirst as any).mockResolvedValue({ id: "sup-1", name: "ACME" });
    (prisma.product.findMany as any).mockResolvedValue([{ id: "prod-1" }]);
    (prisma.purchaseOrder.create as any).mockResolvedValue({
      id: "po-new",
      supplier: { name: "ACME" },
      items: [],
    });

    await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId: "sup-1",
          items: [{ productId: "prod-1", quantity: 3, unitCost: 20 }],
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [{ productId: "prod-1", quantity: 3, unitCost: 20 }],
          },
        }),
      })
    );
  });

  it("returns 404 when any product does not belong to the org", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.supplier.findFirst as any).mockResolvedValue({ id: "sup-1", name: "ACME" });
    (prisma.product.findMany as any).mockResolvedValue([{ id: "prod-1" }]);

    const res = await POST(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId: "sup-1",
          items: [
            { productId: "prod-1", quantity: 2, unitCost: 50 },
            { productId: "prod-other-org", quantity: 1, unitCost: 100 },
          ],
        }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).toBe(404);
    expect(prisma.purchaseOrder.create).not.toHaveBeenCalled();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PATCH
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("PATCH /api/purchase-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as any).mockImplementation(async (callback: any) => callback(prisma));
  });

  it("returns 401 when unauthenticated", async () => {
    (getTenantProfile as any).mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "ENVIADO" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);

    const res = await PATCH(
      makeRequest("http://localhost/api/purchase-orders", {
        method: "PATCH",
        body: JSON.stringify({ status: "ENVIADO" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when purchase order not found in org", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/purchase-orders?id=po-x", {
        method: "PATCH",
        body: JSON.stringify({ status: "ENVIADO" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(404);
  });

  it("updates status without touching stock when not transitioning to RECIBIDO", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue({ id: "po-1", status: "BORRADOR", items: [] });
    (prisma.purchaseOrder.update as any).mockResolvedValue({
      id: "po-1",
      status: "ENVIADO",
      supplier: { name: "ACME" },
      items: [],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "ENVIADO" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(200);
    expect(prisma.product.updateMany).not.toHaveBeenCalled();
  });

  it("increments product stock when transitioning to RECIBIDO", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
      id: "po-1",
      status: "ENVIADO",
      items: [
        { productId: "prod-1", quantity: 10 },
        { productId: "prod-2", quantity: 5 },
      ],
    });
    (prisma.purchaseOrder.update as any).mockResolvedValue({
      id: "po-1",
      status: "RECIBIDO",
      supplier: { name: "ACME" },
      items: [],
    });
    (prisma.product.updateMany as any).mockResolvedValue({ count: 1 });

    const res = await PATCH(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "RECIBIDO" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1", organizationId: "org-1" },
        data: { stock: { increment: 10 } },
      })
    );
    expect(prisma.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-2", organizationId: "org-1" },
        data: { stock: { increment: 5 } },
      })
    );
  });

  it("does NOT increment stock when order was already RECIBIDO", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue({ id: "po-1", status: "RECIBIDO", items: [] });
    (prisma.purchaseOrder.update as any).mockResolvedValue({
      id: "po-1",
      status: "RECIBIDO",
      supplier: { name: "ACME" },
      items: [],
    });

    await PATCH(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "RECIBIDO" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(prisma.product.updateMany).not.toHaveBeenCalled();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("DELETE /api/purchase-orders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (getTenantProfile as any).mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", { method: "DELETE" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);

    const res = await DELETE(
      makeRequest("http://localhost/api/purchase-orders", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when order not found in org", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/purchase-orders?id=po-x", { method: "DELETE" })
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to delete a RECIBIDO order", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue({ id: "po-1", status: "RECIBIDO" });

    const res = await DELETE(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("recibida");
  });

  it("deletes a BORRADOR order successfully", async () => {
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue({ id: "po-1", status: "BORRADOR" });
    (prisma.purchaseOrder.delete as any).mockResolvedValue({ id: "po-1" });

    const res = await DELETE(
      makeRequest("http://localhost/api/purchase-orders?id=po-1", { method: "DELETE" })
    );
    expect(res.status).toBe(200);
    expect(prisma.purchaseOrder.delete).toHaveBeenCalledWith({ where: { id: "po-1" } });
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Logic-only (no DB) â€” preserved from original
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Purchase Order Status Workflow (logic)", () => {
  it("allows BORRADOR â†’ ENVIADO â†’ PARCIAL â†’ RECIBIDO", () => {
    const workflow = ["BORRADOR", "ENVIADO", "PARCIAL", "RECIBIDO"];
    expect(workflow).toContain("BORRADOR");
    expect(workflow).toContain("RECIBIDO");
  });

  it("prevents deletion of RECIBIDO orders", () => {
    const deletable = ["BORRADOR", "ENVIADO", "PARCIAL", "CANCELADO"];
    expect(deletable).not.toContain("RECIBIDO");
  });
});

describe("Purchase Order Total Calculation (logic)", () => {
  it("calculates total correctly", () => {
    const items = [
      { quantity: 10, unitCost: 10 },
      { quantity: 5, unitCost: 20 },
    ];
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    expect(total).toBe(200);
  });

  it("handles zero quantity", () => {
    const items = [{ quantity: 0, unitCost: 50 }];
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    expect(total).toBe(0);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getTenantProfile } from "@/lib/auth";
import { PATCH } from "@/app/api/products/batch/route";

const MOCK_PROFILE = {
  organizationId: "org-1",
  plan: "PRO" as const,
  businessType: "GENERAL",
  role: "ADMIN" as const,
  userId: "user-1",
  id: "profile-1",
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/products/batch", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/products/batch — auth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (getTenantProfile as any).mockResolvedValue(null);

    const res = await PATCH(makeRequest({ ids: ["id-1"], action: "activate" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 when role cannot edit products", async () => {
    (getTenantProfile as any).mockResolvedValue({ ...MOCK_PROFILE, role: "VIEWER" });

    const res = await PATCH(makeRequest({ ids: ["id-1"], action: "price", value: 10 }));
    expect(res.status).toBe(403);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 when role cannot delete/deactivate products", async () => {
    (getTenantProfile as any).mockResolvedValue({ ...MOCK_PROFILE, role: "MANAGER" });

    const res = await PATCH(makeRequest({ ids: ["id-1"], action: "deactivate" }));
    expect(res.status).toBe(403);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/products/batch — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
  });

  it("returns 400 when ids is empty", async () => {
    const res = await PATCH(makeRequest({ ids: [], action: "activate" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when action=price without value", async () => {
    const res = await PATCH(makeRequest({ ids: ["id-1"], action: "price" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/value/i);
  });

  it("returns 400 when action=stock without value", async () => {
    const res = await PATCH(makeRequest({ ids: ["id-1"], action: "stock" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/value/i);
  });

  it("returns 400 when action is invalid", async () => {
    const res = await PATCH(makeRequest({ ids: ["id-1"], action: "delete_all" }));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/products/batch — org isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
  });

  it("returns updated=0 when ids belong to another org", async () => {
    // findMany returns empty — ids don't belong to this org
    (prisma.product.findMany as any).mockResolvedValue([]);

    const res = await PATCH(makeRequest({ ids: ["other-org-prod"], action: "activate" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(0);
  });
});

describe("PATCH /api/products/batch — price action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
  });

  it("updates price for owned products", async () => {
    (prisma.product.findMany as any).mockResolvedValue([
      { id: "p1", stock: 10 },
      { id: "p2", stock: 5 },
    ]);
    (prisma.product.updateMany as any).mockResolvedValue({ count: 2 });

    const res = await PATCH(makeRequest({ ids: ["p1", "p2"], action: "price", value: 99.99 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(2);

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1", "p2"] }, organizationId: "org-1" },
      data: { price: 99.99 },
    });
  });
});

describe("PATCH /api/products/batch — stock action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
  });

  it("adjusts stock by value (positive)", async () => {
    (prisma.product.findMany as any).mockResolvedValue([{ id: "p1", stock: 10 }]);
    (prisma.product.update as any).mockResolvedValue({ id: "p1", stock: 15 });

    const res = await PATCH(makeRequest({ ids: ["p1"], action: "stock", value: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(1);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: 15 },
    });
  });

  it("does not set stock below 0 (negative adjustment clamped)", async () => {
    (prisma.product.findMany as any).mockResolvedValue([{ id: "p1", stock: 3 }]);
    (prisma.product.update as any).mockResolvedValue({ id: "p1", stock: 0 });

    const res = await PATCH(makeRequest({ ids: ["p1"], action: "stock", value: -10 }));
    expect(res.status).toBe(200);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: 0 },
    });
  });
});

describe("PATCH /api/products/batch — activate/deactivate actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantProfile as any).mockResolvedValue(MOCK_PROFILE);
  });

  it("deactivates owned products", async () => {
    (prisma.product.findMany as any).mockResolvedValue([{ id: "p1", stock: 10 }, { id: "p2", stock: 5 }]);
    (prisma.product.updateMany as any).mockResolvedValue({ count: 2 });

    const res = await PATCH(makeRequest({ ids: ["p1", "p2"], action: "deactivate" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(2);

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1", "p2"] }, organizationId: "org-1" },
      data: { active: false },
    });
  });

  it("activates owned products", async () => {
    (prisma.product.findMany as any).mockResolvedValue([{ id: "p1", stock: 0 }]);
    (prisma.product.updateMany as any).mockResolvedValue({ count: 1 });

    const res = await PATCH(makeRequest({ ids: ["p1"], action: "activate" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(1);

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1"] }, organizationId: "org-1" },
      data: { active: true },
    });
  });
});

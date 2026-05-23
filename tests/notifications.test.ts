/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

const mockNotif = {
  id: "notif-1",
  organizationId: "org-1",
  userId: null,
  type: "stock_bajo",
  title: "Stock bajo",
  body: "Producto X tiene 2 unidades",
  read: false,
  link: "/inventory/prod-1",
  createdAt: new Date().toISOString(),
};

describe("Notifications — GET /api/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/notifications/route");
    const req = new Request("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns notifications and unread count", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.findMany as any).mockResolvedValue([mockNotif]);
    (prisma.notification.count as any).mockResolvedValue(1);

    const { GET } = await import("@/app/api/notifications/route");
    const req = new Request("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.notifications).toHaveLength(1);
    expect(data.unreadCount).toBe(1);
  });

  it("filters by unread_only=true", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.findMany as any).mockResolvedValue([]);
    (prisma.notification.count as any).mockResolvedValue(0);

    const { GET } = await import("@/app/api/notifications/route");
    const req = new Request("http://localhost/api/notifications?unread_only=true");
    await GET(req);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ read: false }),
      })
    );
  });
});

describe("Notifications — PATCH /api/notifications/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/notifications/[id]/route");
    const req = new Request("http://localhost/api/notifications/notif-1", {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "notif-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when notif not in org", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.findFirst as any).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/notifications/[id]/route");
    const req = new Request("http://localhost/api/notifications/notif-x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "notif-x" }) });
    expect(res.status).toBe(404);
  });

  it("marks notification as read", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.findFirst as any).mockResolvedValue(mockNotif);
    (prisma.notification.update as any).mockResolvedValue({ ...mockNotif, read: true });

    const { PATCH } = await import("@/app/api/notifications/[id]/route");
    const req = new Request("http://localhost/api/notifications/notif-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "notif-1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.read).toBe(true);
  });
});

describe("Notifications — POST /api/notifications/read-all", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/notifications/read-all/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("marks all unread as read and returns count", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

    const { POST } = await import("@/app/api/notifications/read-all/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(5);
  });
});

describe("createNotification helper", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates notification without throwing", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.create as any).mockResolvedValue(mockNotif);

    const { createNotification } = await import("@/lib/notifications");
    await expect(
      createNotification({
        organizationId: "org-1",
        type: "stock_bajo",
        title: "Stock bajo",
        body: "Producto X tiene stock bajo",
        link: "/inventory/prod-1",
      })
    ).resolves.not.toThrow();
  });

  it("silently catches errors", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.notification.create as any).mockRejectedValue(new Error("DB down"));

    const { createNotification } = await import("@/lib/notifications");
    await expect(
      createNotification({ organizationId: "org-1", type: "custom", title: "T", body: "B" })
    ).resolves.not.toThrow();
  });
});

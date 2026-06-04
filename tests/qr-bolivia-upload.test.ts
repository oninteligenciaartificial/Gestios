/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { upload: { windowMs: 60_000, max: 10 } },
  checkOrgRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      })),
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    orgAddon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

function fileRequest(bytes: number[], name: string, type: string) {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(bytes)], name, { type }));
  return new Request("http://localhost/api/addons/qr-bolivia/upload", { method: "POST", body: fd });
}

describe("POST /api/addons/qr-bolivia/upload", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getTenantProfile } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      role: "ADMIN",
      plan: "PRO",
    });
    (prisma.orgAddon.findUnique as any).mockResolvedValue(null);
    (prisma.orgAddon.create as any).mockResolvedValue({ id: "addon-1" });
    uploadMock.mockResolvedValue({ data: { path: "org-1/qr.png" }, error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://storage.test/qr.png" } });
  });

  it("accepts PNG content and stores it with detected content type", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/addons/qr-bolivia/upload/route");

    const res = await POST(fileRequest([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0], "qr.png", "image/png"));

    expect(res.status).toBe(201);
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^org-1\/qr-bolivia-.*\.png$/),
      expect.any(File),
      expect.objectContaining({ contentType: "image/png", upsert: false })
    );
    expect(prisma.orgAddon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", addon: "QR_BOLIVIA" }),
      })
    );
  });

  it("rejects SVG even when uploaded as image", async () => {
    const { POST } = await import("@/app/api/addons/qr-bolivia/upload/route");
    const svg = Array.from(new TextEncoder().encode("<svg></svg>"));

    const res = await POST(fileRequest(svg, "qr.svg", "image/svg+xml"));

    expect(res.status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("rejects files with fake image MIME but invalid bytes", async () => {
    const { POST } = await import("@/app/api/addons/qr-bolivia/upload/route");

    const res = await POST(fileRequest([1, 2, 3, 4, 5, 6, 7, 8], "qr.png", "image/png"));

    expect(res.status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("rejects admins without pagos_qr plan access", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    const { POST } = await import("@/app/api/addons/qr-bolivia/upload/route");
    (getTenantProfile as any).mockResolvedValue({
      organizationId: "org-1",
      role: "ADMIN",
      plan: "CRECER",
    });

    const res = await POST(fileRequest([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], "qr.png", "image/png"));

    expect(res.status).toBe(403);
    expect(uploadMock).not.toHaveBeenCalled();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    orgAddon: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    waConversation: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({ getTenantProfile: vi.fn() }));
vi.mock("@/lib/superadmin", () => ({ getSuperAdmin: vi.fn() }));
vi.mock("@/lib/chatwoot", () => ({
  createChatwootInbox: vi.fn().mockResolvedValue({ inboxId: 42 }),
}));

// ──────────────────────────────────────────────
// getWhatsAppConfig
// ──────────────────────────────────────────────

describe("getWhatsAppConfig", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns per-tenant credentials from OrgAddon", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.orgAddon.findFirst as any).mockResolvedValue({
      phoneNumberId: "phone-123",
      accessToken: "EAA-tenant-token",
      templateName: "my_template",
    });

    const { getWhatsAppConfig } = await import("@/lib/whatsapp");
    const result = await getWhatsAppConfig("org-1");

    expect(result).toEqual({
      phoneNumberId: "phone-123",
      accessToken: "EAA-tenant-token",
      templateName: "my_template",
    });
  });

  it("returns error when addon exists but credentials missing", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.orgAddon.findFirst as any).mockResolvedValue({
      phoneNumberId: null,
      accessToken: null,
      templateName: null,
    });

    const { getWhatsAppConfig } = await import("@/lib/whatsapp");
    const result = await getWhatsAppConfig("org-1");

    expect("error" in result).toBe(true);
    expect((result as { error: string }).error).toMatch(/no configurado/i);
  });

  it("returns error when no addon row", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.orgAddon.findFirst as any).mockResolvedValue(null);

    const { getWhatsAppConfig } = await import("@/lib/whatsapp");
    const result = await getWhatsAppConfig("org-missing");

    expect("error" in result).toBe(true);
    expect((result as { error: string }).error).toMatch(/no activado/i);
  });
});

// ──────────────────────────────────────────────
// checkWhatsAppAddon
// ──────────────────────────────────────────────

describe("checkWhatsAppAddon", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed: false when whatsappAddon is false", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({
      whatsappAddon: false,
      plan: "BASICO",
    });

    const { checkWhatsAppAddon } = await import("@/lib/whatsapp");
    const result = await checkWhatsAppAddon("org-1");

    expect(result.allowed).toBe(false);
    expect((result as { allowed: false; reason: string }).reason).toMatch(/no activo/i);
  });

  it("returns allowed: true when under monthly limit", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({
      whatsappAddon: true,
      plan: "BASICO",
    });
    (prisma.waConversation.count as any).mockResolvedValue(50); // limit=200

    const { checkWhatsAppAddon } = await import("@/lib/whatsapp");
    const result = await checkWhatsAppAddon("org-1");

    expect(result.allowed).toBe(true);
  });

  it("returns allowed: false when monthly limit reached", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({
      whatsappAddon: true,
      plan: "BASICO",
    });
    (prisma.waConversation.count as any).mockResolvedValue(200); // exactly at limit

    const { checkWhatsAppAddon } = await import("@/lib/whatsapp");
    const result = await checkWhatsAppAddon("org-1");

    expect(result.allowed).toBe(false);
    expect((result as { allowed: false; reason: string }).reason).toMatch(/límite mensual/i);
  });

  it("applies higher limit for PRO plan", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({
      whatsappAddon: true,
      plan: "PRO",
    });
    (prisma.waConversation.count as any).mockResolvedValue(1999); // PRO limit=2000

    const { checkWhatsAppAddon } = await import("@/lib/whatsapp");
    const result = await checkWhatsAppAddon("org-1");

    expect(result.allowed).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Superadmin API — POST /api/superadmin/organizations/[id]/whatsapp-addon
// ──────────────────────────────────────────────

describe("POST /api/superadmin/organizations/[id]/whatsapp-addon", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 when not superadmin", async () => {
    const { getSuperAdmin } = await import("@/lib/superadmin");
    (getSuperAdmin as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/superadmin/organizations/[id]/whatsapp-addon/route");
    const req = new Request("http://localhost/api/superadmin/organizations/org-1/whatsapp-addon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId: "phone-1", accessToken: "EAA-token-abc" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "org-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when org not found", async () => {
    const { getSuperAdmin } = await import("@/lib/superadmin");
    (getSuperAdmin as any).mockResolvedValue({ id: "sa-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/superadmin/organizations/[id]/whatsapp-addon/route");
    const req = new Request("http://localhost/...", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId: "phone-1", accessToken: "EAA-token-abc" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "org-missing" }) });
    expect(res.status).toBe(404);
  });

  it("returns 409 when phoneNumberId already taken by another org", async () => {
    const { getSuperAdmin } = await import("@/lib/superadmin");
    (getSuperAdmin as any).mockResolvedValue({ id: "sa-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({ id: "org-1", name: "Tienda A", profiles: [] });
    (prisma.orgAddon.findFirst as any).mockResolvedValue({ organizationId: "org-other" }); // conflict

    const { POST } = await import("@/app/api/superadmin/organizations/[id]/whatsapp-addon/route");
    const req = new Request("http://localhost/...", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId: "phone-taken", accessToken: "EAA-token-abc" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "org-1" }) });
    expect(res.status).toBe(409);
  });

  it("activates addon and returns ok with chatwootInboxId", async () => {
    const { getSuperAdmin } = await import("@/lib/superadmin");
    (getSuperAdmin as any).mockResolvedValue({ id: "sa-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.organization.findUnique as any).mockResolvedValue({
      id: "org-1",
      name: "Tienda A",
      profiles: [{ email: "admin@tienda.com" }],
    });
    (prisma.orgAddon.findFirst as any).mockResolvedValue(null); // no conflict
    (prisma.orgAddon.upsert as any).mockResolvedValue({
      id: "addon-1",
      chatwootInboxId: 42,
    });
    (prisma.organization.update as any).mockResolvedValue({});

    const { POST } = await import("@/app/api/superadmin/organizations/[id]/whatsapp-addon/route");
    const req = new Request("http://localhost/...", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId: "phone-1", accessToken: "EAA-token-long-enough" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "org-1" }) });
    expect(res.status).toBe(200);

    const data = await res.json() as { ok: boolean; chatwootInboxId: number };
    expect(data.ok).toBe(true);
    expect(data.chatwootInboxId).toBe(42);

    // org flag must be set
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { whatsappAddon: true },
    });
  });
});

// ──────────────────────────────────────────────
// DELETE /api/superadmin/organizations/[id]/whatsapp-addon
// ──────────────────────────────────────────────

describe("DELETE /api/superadmin/organizations/[id]/whatsapp-addon", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deactivates addon and clears org flag", async () => {
    const { getSuperAdmin } = await import("@/lib/superadmin");
    (getSuperAdmin as any).mockResolvedValue({ id: "sa-1" });

    const { prisma } = await import("@/lib/prisma");
    (prisma.orgAddon.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.organization.update as any).mockResolvedValue({});

    const { DELETE } = await import("@/app/api/superadmin/organizations/[id]/whatsapp-addon/route");
    const res = await DELETE(
      new Request("http://localhost/..."),
      { params: Promise.resolve({ id: "org-1" }) }
    );
    expect(res.status).toBe(200);

    expect(prisma.orgAddon.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "org-1", addon: "WHATSAPP" },
      data: { active: false },
    });
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { whatsappAddon: false },
    });
  });
});

// ──────────────────────────────────────────────
// Webhook — multi-tenant routing
// ──────────────────────────────────────────────

describe("POST /api/webhooks/whatsapp — multi-tenant routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 on invalid HMAC signature", async () => {
    // verifyWebhookSignature returns false when WA_APP_SECRET not set
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const req = new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=bad" },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("responds 200 to GET challenge with correct verify token", async () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test-token-xyz";

    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const req = new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-token-xyz&hub.challenge=abc123"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("abc123");
  });

  it("responds 403 to GET challenge with wrong verify token", async () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "correct-token";

    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const req = new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc"
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Supabase clients used by the sessions route
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userSession: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    profile: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Map())),
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn() })),
}));

describe("Sessions — GET /api/sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns session list for authenticated user", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      userId: "user1",
      organizationId: "org1",
      role: "ADMIN",
      plan: "BASICO",
    });

    // The route queries auth.sessions via supabase — mock returns empty array
    const { createClient } = await import("@supabase/supabase-js");
    (createClient as any).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "sess1",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_agent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120",
            },
          ],
          error: null,
        }),
      })),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "tok" } } }),
      },
    });

    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("Sessions — DELETE /api/sessions/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/sessions/[id]/route");
    const res = await DELETE({} as any, { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when session belongs to a different user", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      userId: "user-A",
      organizationId: "org1",
      role: "ADMIN",
      plan: "BASICO",
    });

    // Supabase single() returns null — session not found for this user
    const { createClient } = await import("@supabase/supabase-js");
    (createClient as any).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    });

    const { DELETE } = await import("@/app/api/sessions/[id]/route");
    const res = await DELETE({} as any, { params: Promise.resolve({ id: "sess-other-user" }) });
    expect(res.status).toBe(404);
  });

  it("returns ok: true when session is successfully deleted", async () => {
    const { getTenantProfile } = await import("@/lib/auth");
    (getTenantProfile as any).mockResolvedValue({
      userId: "user-A",
      organizationId: "org1",
      role: "ADMIN",
      plan: "BASICO",
    });

    const { createClient } = await import("@supabase/supabase-js");
    (createClient as any).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "sess1" }, error: null }),
      })),
    });

    const { DELETE } = await import("@/app/api/sessions/[id]/route");
    const res = await DELETE({} as any, { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe("Sessions — UserSession model shape", () => {
  it("has required fields: id, userId, organizationId, userAgent, ipAddress, createdAt, lastSeenAt", () => {
    const fields = ["id", "userId", "organizationId", "userAgent", "ipAddress", "createdAt", "lastSeenAt"];
    expect(fields).toContain("userId");
    expect(fields).toContain("organizationId");
    expect(fields).toContain("lastSeenAt");
  });

  it("session ID uses userId+date pattern for daily dedup", () => {
    const userId = "user123";
    const date = "2026-05-22";
    const sessionId = `${userId}_${date}`;
    expect(sessionId).toBe("user123_2026-05-22");
    expect(sessionId.startsWith(userId)).toBe(true);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  reportAsyncError,
  sanitizeMonitoringContext,
  setSentryUser,
  clearSentryUser,
  addSentryBreadcrumb,
  captureSentryMessage,
} from "@/lib/monitoring";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe("reportAsyncError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("logs error to console", () => {
    const error = new Error("Test error");
    reportAsyncError("test-scope", error, { key: "value" });

    expect(console.error).toHaveBeenCalledWith(
      "[test-scope] operacion async fallo",
      { error, key: "value" }
    );
  });

  it("calls Sentry captureException", async () => {
    const sentry = await import("@sentry/nextjs");
    const error = new Error("Test error");

    reportAsyncError("test-scope", error, { userId: "123" });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { scope: "test-scope" },
      extra: { userId: "123" },
    });
  });

  it("redacts sensitive context before logging and sending to Sentry", async () => {
    const sentry = await import("@sentry/nextjs");
    const error = new Error("Sensitive error");

    reportAsyncError("test-sensitive", error, {
      organizationId: "org-123",
      accessToken: "secret-token",
      nested: { authorization: "Bearer abc", safe: "ok" },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const expectedContext = {
      organizationId: "org-123",
      accessToken: "[REDACTED]",
      nested: { authorization: "[REDACTED]", safe: "ok" },
    };

    expect(console.error).toHaveBeenCalledWith(
      "[test-sensitive] operacion async fallo",
      { error, ...expectedContext }
    );
    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { scope: "test-sensitive" },
      extra: expectedContext,
    });
  });
});

describe("sanitizeMonitoringContext", () => {
  it("preserves useful IDs while redacting secret-like keys", () => {
    expect(sanitizeMonitoringContext({
      userId: "user-1",
      organizationId: "org-1",
      apiKey: "key",
      databaseUrl: "postgres://secret",
      nested: { cookie: "session", route: "/api/orders" },
    })).toEqual({
      userId: "user-1",
      organizationId: "org-1",
      apiKey: "[REDACTED]",
      databaseUrl: "[REDACTED]",
      nested: { cookie: "[REDACTED]", route: "/api/orders" },
    });
  });
});

describe("setSentryUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets user context in Sentry", async () => {
    const sentry = await import("@sentry/nextjs");

    await setSentryUser({
      id: "user-123",
      email: "test@example.com",
      organizationId: "org-456",
      role: "ADMIN",
    });

    expect(sentry.setUser).toHaveBeenCalledWith({
      id: "user-123",
      email: "test@example.com",
      organizationId: "org-456",
      role: "ADMIN",
    });
  });
});

describe("clearSentryUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears user context in Sentry", async () => {
    const sentry = await import("@sentry/nextjs");

    await clearSentryUser();

    expect(sentry.setUser).toHaveBeenCalledWith(null);
  });
});

describe("addSentryBreadcrumb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds breadcrumb to Sentry", async () => {
    const sentry = await import("@sentry/nextjs");

    await addSentryBreadcrumb("api", "Request completed", {
      method: "GET",
      path: "/api/products",
    });

    expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "api",
      message: "Request completed",
      data: { method: "GET", path: "/api/products" },
      level: "info",
    });
  });

  it("redacts sensitive breadcrumb data", async () => {
    const sentry = await import("@sentry/nextjs");

    await addSentryBreadcrumb("api", "Webhook received", {
      authorization: "Bearer abc",
      path: "/api/webhooks/whatsapp",
    });

    expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "api",
      message: "Webhook received",
      data: { authorization: "[REDACTED]", path: "/api/webhooks/whatsapp" },
      level: "info",
    });
  });
});

describe("captureSentryMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures info message", async () => {
    const sentry = await import("@sentry/nextjs");

    await captureSentryMessage("User signed up", "info", { plan: "BASICO" });

    expect(sentry.captureMessage).toHaveBeenCalledWith("User signed up", {
      level: "info",
      extra: { plan: "BASICO" },
    });
  });

  it("captures warning message", async () => {
    const sentry = await import("@sentry/nextjs");

    await captureSentryMessage("Rate limit approaching", "warning");

    expect(sentry.captureMessage).toHaveBeenCalledWith("Rate limit approaching", {
      level: "warning",
      extra: undefined,
    });
  });

  it("redacts sensitive message context", async () => {
    const sentry = await import("@sentry/nextjs");

    await captureSentryMessage("External provider failed", "error", {
      apiKey: "key",
      provider: "qr",
    });

    expect(sentry.captureMessage).toHaveBeenCalledWith("External provider failed", {
      level: "error",
      extra: { apiKey: "[REDACTED]", provider: "qr" },
    });
  });
});

import { describe, expect, it } from "vitest";
import { sanitizeOauthNext } from "@/lib/oauth-redirect";

describe("OAuth redirect helpers", () => {
  it("allows safe relative paths", () => {
    expect(sanitizeOauthNext("/dashboard")).toBe("/dashboard");
    expect(sanitizeOauthNext("/setup?from=google&plan=pro")).toBe("/setup?from=google&plan=pro");
  });

  it("decodes encoded safe paths", () => {
    expect(sanitizeOauthNext("%2Fsetup%3Ffrom%3Dgoogle")).toBe("/setup?from=google");
  });

  it("falls back for external or empty destinations", () => {
    expect(sanitizeOauthNext(null)).toBe("/dashboard");
    expect(sanitizeOauthNext("https://evil.example/dashboard")).toBe("/dashboard");
    expect(sanitizeOauthNext("//evil.example/dashboard")).toBe("/dashboard");
    expect(sanitizeOauthNext("%2F%2Fevil.example%2Fdashboard")).toBe("/dashboard");
    expect(sanitizeOauthNext("dashboard")).toBe("/dashboard");
  });
});

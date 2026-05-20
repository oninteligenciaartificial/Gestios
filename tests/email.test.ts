/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock prisma before importing email module
const mockCreate = vi.fn().mockResolvedValue({ id: "log-1" });
const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: {
      create: mockCreate,
      updateMany: mockUpdateMany,
    },
  },
}));

vi.mock("@/lib/monitoring", () => ({
  reportAsyncError: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 90, resetAt: Date.now() + 86400000 }),
}));

// Mock Resend SDK — vi.hoisted ensures mockResendSend is available inside vi.mock factory
const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ data: { id: "msg-123" }, error: null }),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockResendSend };
  },
}));

describe("sendEmail core", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    mockResendSend.mockClear();
    mockResendSend.mockResolvedValue({ data: { id: "msg-123" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM_ADDRESS = "noreply@onia.com.bo";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;
    vi.restoreAllMocks();
  });

  it("should skip sending when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "test@example.com",
      customerName: "Test",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: expect.stringContaining("RESEND_API_KEY not configured"),
        }),
      })
    );
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("should use EMAIL_FROM_ADDRESS when configured", async () => {
    process.env.EMAIL_FROM_ADDRESS = "custom@onia.com.bo";

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Org",
      orderId: "cm1234567890",
      items: [{ name: "Item", quantity: 2, unitPrice: 50 }],
      total: 100,
      paymentMethod: "TARJETA",
    });

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining("custom@onia.com.bo"),
      })
    );
  });

  it("should fallback to noreply@onia.com.bo when no sender env set", async () => {
    delete process.env.EMAIL_FROM_ADDRESS;
    delete process.env.BREVO_SENDER_EMAIL;

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Org",
      orderId: "cm1234567890",
      items: [{ name: "Item", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining("noreply@onia.com.bo"),
      })
    );
  });
});

describe("email types", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ id: "log-1" });
    mockResendSend.mockClear();
    mockResendSend.mockResolvedValue({ data: { id: "msg-123" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM_ADDRESS = "noreply@onia.com.bo";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;
    vi.restoreAllMocks();
  });

  it("sendWelcomeEmail should log with type 'welcome_email'", async () => {
    const { sendWelcomeEmail } = await import("@/lib/email");
    await sendWelcomeEmail({
      to: "new@example.com",
      customerName: "New Customer",
      orgName: "Test Org",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "welcome_email",
          to: "new@example.com",
          status: "SENT",
          brevoMessageId: "msg-123",
        }),
      })
    );
  });

  it("sendBirthdayEmail should log with type 'birthday_email'", async () => {
    const { sendBirthdayEmail } = await import("@/lib/email");
    await sendBirthdayEmail({
      to: "birthday@example.com",
      customerName: "Birthday Person",
      orgName: "Test Org",
      discountCode: "CUMPLE20",
      discountValue: 20,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "birthday_email", to: "birthday@example.com" }),
      })
    );
  });

  it("sendLowStockAlert should log with type 'low_stock_alert'", async () => {
    const { sendLowStockAlert } = await import("@/lib/email");
    await sendLowStockAlert({
      to: "admin@example.com",
      orgName: "Test Org",
      products: [{ name: "Product A", stock: 2, minStock: 10 }],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "low_stock_alert", to: "admin@example.com" }),
      })
    );
  });

  it("sendPlanExpiryWarning should log with type 'plan_expiry_warning'", async () => {
    const { sendPlanExpiryWarning } = await import("@/lib/email");
    await sendPlanExpiryWarning({ to: "admin@example.com", orgName: "Test Org", daysLeft: 3, planLabel: "Pro" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "plan_expiry_warning", to: "admin@example.com" }),
      })
    );
  });

  it("sendPlanExpired should log with type 'plan_expired'", async () => {
    const { sendPlanExpired } = await import("@/lib/email");
    await sendPlanExpired({ to: "admin@example.com", orgName: "Test Org", planLabel: "Pro" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "plan_expired", to: "admin@example.com" }),
      })
    );
  });

  it("sendPlanActivatedEmail should log with type 'plan_activated'", async () => {
    const { sendPlanActivatedEmail } = await import("@/lib/email");
    await sendPlanActivatedEmail({ to: "admin@example.com", orgName: "Test Org", plan: "PRO", expiresAt: new Date("2026-06-01") });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "plan_activated", to: "admin@example.com" }),
      })
    );
  });

  it("sendNewOrderAlert should log with type 'new_order_alert'", async () => {
    const { sendNewOrderAlert } = await import("@/lib/email");
    await sendNewOrderAlert({
      to: "admin@example.com",
      orgName: "Test Org",
      orderId: "cm1234567890",
      customerName: "Customer",
      total: 150,
      items: [{ name: "Product", quantity: 3, unitPrice: 50 }],
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "new_order_alert", to: "admin@example.com" }),
      })
    );
  });

  it("sendOrderStatusUpdate should log with type 'order_status_update'", async () => {
    const { sendOrderStatusUpdate } = await import("@/lib/email");
    await sendOrderStatusUpdate({ to: "customer@example.com", customerName: "Customer", orgName: "Test Org", orderId: "cm1234567890", status: "ENTREGADO" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "order_status_update", to: "customer@example.com" }),
      })
    );
  });

  it("sendLoyaltyPointsEmail should log with type 'loyalty_points_email'", async () => {
    const { sendLoyaltyPointsEmail } = await import("@/lib/email");
    await sendLoyaltyPointsEmail({ to: "customer@example.com", customerName: "Customer", orgName: "Test Org", pointsEarned: 15, totalPoints: 150 });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "loyalty_points_email", to: "customer@example.com" }),
      })
    );
  });

  it("sendExpiryAlert should log with type 'expiry_alert'", async () => {
    const { sendExpiryAlert } = await import("@/lib/email");
    await sendExpiryAlert({
      to: "admin@example.com",
      orgName: "Test Org",
      products: [{ name: "Product", sku: "SKU-001", batchExpiry: new Date(), daysLeft: 2 }],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "expiry_alert", to: "admin@example.com" }),
      })
    );
  });

  it("sendInactiveCustomerEmail should log with type 'inactive_customer_email'", async () => {
    const { sendInactiveCustomerEmail } = await import("@/lib/email");
    await sendInactiveCustomerEmail({ to: "inactive@example.com", customerName: "Inactive", orgName: "Test Org", daysSinceLastOrder: 45 });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "inactive_customer_email", to: "inactive@example.com" }),
      })
    );
  });

  it("sendPlainNotification should log with type 'plain_notification'", async () => {
    const { sendPlainNotification } = await import("@/lib/email");
    await sendPlainNotification({ to: "admin@example.com", subject: "Test", text: "Test content" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "plain_notification", to: "admin@example.com" }),
      })
    );
  });

  it("sendOrderConfirmation should log with type 'order_confirmation'", async () => {
    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "order_confirmation", to: "customer@example.com" }),
      })
    );
  });
});

describe("error handling", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ id: "log-1" });
    mockResendSend.mockClear();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM_ADDRESS = "noreply@onia.com.bo";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;
    vi.restoreAllMocks();
  });

  it("should log FAILED status when Resend returns error", async () => {
    mockResendSend.mockResolvedValue({ data: null, error: { message: "Invalid API key", name: "validation_error" } });

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: "Invalid API key",
        }),
      })
    );
  });

  it("should log FAILED status when Resend SDK throws", async () => {
    mockResendSend.mockRejectedValue(new Error("Network error"));

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: "Network error",
        }),
      })
    );
  });
});

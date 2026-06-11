/**
 * WhatsApp Business API helpers — multi-tenant.
 * Each tenant stores their own phoneNumberId + accessToken in OrgAddon.
 * Fallback to env vars only for local testing.
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const WA_API_URL = `https://graph.facebook.com/v20.0`;

// Monthly message limit per plan for WhatsApp add-on
const WA_MONTHLY_LIMITS: Record<string, number> = {
  BASICO: 200,
  CRECER: 500,
  PRO: 2000,
  EMPRESARIAL: 10000,
};

// ──────────────────────────────────────────────
// Config resolution — per-tenant from DB
// ──────────────────────────────────────────────

export interface WaConfig {
  phoneNumberId: string;
  accessToken: string;
  templateName: string;
}

/**
 * Resolve WhatsApp credentials for a given org.
 * Reads accessToken from OrgAddon row (System User token — never expires).
 * Falls back to env vars only when organizationId is absent (local dev/tests).
 */
export async function getWhatsAppConfig(
  organizationId?: string
): Promise<WaConfig | { error: string }> {
  if (organizationId) {
    const addon = await prisma.orgAddon.findFirst({
      where: { organizationId, addon: "WHATSAPP", active: true },
      select: { phoneNumberId: true, accessToken: true, templateName: true },
    });

    if (addon?.phoneNumberId && addon?.accessToken) {
      return {
        phoneNumberId: addon.phoneNumberId,
        accessToken: addon.accessToken,
        templateName: addon.templateName ?? "appointment_reminder",
      };
    }

    if (addon) {
      return { error: "WhatsApp add-on no configurado — falta phoneNumberId o accessToken" };
    }

    return { error: "WhatsApp add-on no activado para esta organización" };
  }

  // Local dev / test fallback
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? process.env.WA_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return { error: "WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN no configurados" };
  }
  return { phoneNumberId, accessToken, templateName: "appointment_reminder" };
}

// ──────────────────────────────────────────────
// Add-on gate — monthly message limit
// ──────────────────────────────────────────────

export async function checkWhatsAppAddon(
  organizationId: string
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { whatsappAddon: true, plan: true },
  });

  if (!org?.whatsappAddon) {
    return { allowed: false, reason: "WhatsApp add-on no activo" };
  }

  const limit = WA_MONTHLY_LIMITS[org.plan] ?? 200;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.waConversation.count({
    where: { organizationId, openedAt: { gte: startOfMonth } },
  });

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Límite mensual de ${limit} conversaciones WhatsApp alcanzado (plan ${org.plan})`,
    };
  }

  return { allowed: true };
}

// ──────────────────────────────────────────────
// Send helpers
// ──────────────────────────────────────────────

interface SendTextArgs {
  to: string;
  text: string;
  organizationId?: string;
}

interface SendTemplateArgs {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
  organizationId?: string;
}

export async function sendWhatsAppText(
  args: SendTextArgs
): Promise<{ success: boolean; error?: string }> {
  const config = await getWhatsAppConfig(args.organizationId);
  if ("error" in config) return { success: false, error: config.error };

  const res = await fetch(`${WA_API_URL}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: args.to,
      type: "text",
      text: { body: args.text },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    return { success: false, error: JSON.stringify(err) };
  }

  return { success: true };
}

export async function sendWhatsAppTemplate(
  args: SendTemplateArgs
): Promise<{ success: boolean; error?: string }> {
  const config = await getWhatsAppConfig(args.organizationId);
  if ("error" in config) return { success: false, error: config.error };

  const res = await fetch(`${WA_API_URL}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: args.to,
      type: "template",
      template: {
        name: args.templateName,
        language: { code: args.languageCode ?? "es_MX" },
        components: args.components ?? [],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    return { success: false, error: JSON.stringify(err) };
  }

  return { success: true };
}

// ──────────────────────────────────────────────
// Webhook signature validation
// ──────────────────────────────────────────────

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const appSecret =
    process.env.WHATSAPP_APP_SECRET ?? process.env.WA_APP_SECRET;
  if (!appSecret) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(body)
    .digest("hex");

  const expectedBuf = Buffer.from(`sha256=${expected}`);
  const sigBuf = Buffer.from(signature);
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

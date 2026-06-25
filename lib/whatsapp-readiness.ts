import { prisma } from "@/lib/prisma";

const DEFAULT_PUBLIC_BASE_URL = "https://www.gestioshq.app";

export interface ReadinessCheck {
  key: string;
  label: string;
  ok: boolean;
  requiredFor: "whatsapp" | "bot";
  owner: "superadmin" | "infra" | "operacion";
}

export interface WhatsAppBotReadiness {
  whatsappReady: boolean;
  botReady: boolean;
  webhookUrl: string;
  checks: ReadinessCheck[];
  manualRequirements: string[];
  nextSteps: string[];
}

function publicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  return DEFAULT_PUBLIC_BASE_URL;
}

function hasEnv(...names: string[]): boolean {
  return names.some((name) => Boolean(process.env[name]));
}

export async function getWhatsAppBotReadiness(organizationId: string): Promise<WhatsAppBotReadiness> {
  const addon = await prisma.orgAddon.findFirst({
    where: { organizationId, addon: "WHATSAPP", active: true },
    select: {
      active: true,
      phoneNumberId: true,
      accessToken: true,
      templateName: true,
      onboardingAt: true,
      chatwootInboxId: true,
    },
  });

  const checks: ReadinessCheck[] = [
    {
      key: "addon_active",
      label: "Add-on WhatsApp activo para la organizacion",
      ok: Boolean(addon?.active),
      requiredFor: "whatsapp",
      owner: "superadmin",
    },
    {
      key: "phone_number_id",
      label: "Phone Number ID de Meta guardado",
      ok: Boolean(addon?.phoneNumberId),
      requiredFor: "whatsapp",
      owner: "superadmin",
    },
    {
      key: "tenant_access_token",
      label: "Access token permanente guardado",
      ok: Boolean(addon?.accessToken),
      requiredFor: "whatsapp",
      owner: "superadmin",
    },
    {
      key: "verify_token",
      label: "Verify token del webhook configurado",
      ok: hasEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "WA_VERIFY_TOKEN"),
      requiredFor: "whatsapp",
      owner: "infra",
    },
    {
      key: "app_secret",
      label: "App secret de Meta para validar firmas",
      ok: hasEnv("WHATSAPP_APP_SECRET", "WA_APP_SECRET"),
      requiredFor: "whatsapp",
      owner: "infra",
    },
    {
      key: "openai_key",
      label: "OPENAI_API_KEY configurada para respuestas IA",
      ok: hasEnv("OPENAI_API_KEY"),
      requiredFor: "bot",
      owner: "infra",
    },
    {
      key: "human_handoff",
      label: "Responsable humano definido para escalamiento",
      ok: Boolean(addon?.chatwootInboxId || addon?.onboardingAt),
      requiredFor: "bot",
      owner: "operacion",
    },
  ];

  const whatsappReady = checks
    .filter((check) => check.requiredFor === "whatsapp")
    .every((check) => check.ok);
  const botReady = whatsappReady && checks
    .filter((check) => check.requiredFor === "bot")
    .every((check) => check.ok);

  const nextSteps = checks
    .filter((check) => !check.ok)
    .map((check) => check.label);

  return {
    whatsappReady,
    botReady,
    webhookUrl: `${publicBaseUrl()}/api/webhooks/whatsapp`,
    checks,
    manualRequirements: [
      "Base de respuestas aprobada por el negocio.",
      "Guion de calificacion y preguntas obligatorias.",
      "Reglas de cuando derivar a humano.",
      "Horarios de atencion y promesas permitidas.",
      "Prueba con numero interno antes de venderlo como activo.",
    ],
    nextSteps,
  };
}

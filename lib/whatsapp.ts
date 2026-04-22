const WA_API_URL = `https://graph.facebook.com/v20.0`;

interface SendTextMessageArgs {
  to: string;
  text: string;
}

interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
}

export async function sendWhatsAppText(args: SendTextMessageArgs): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp no configurado" };
  }

  const res = await fetch(`${WA_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    const err = await res.json().catch(() => ({}));
    return { success: false, error: JSON.stringify(err) };
  }

  return { success: true };
}

export async function sendWhatsAppTemplate(args: SendTemplateMessageArgs): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp no configurado" };
  }

  const res = await fetch(`${WA_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    const err = await res.json().catch(() => ({}));
    return { success: false, error: JSON.stringify(err) };
  }

  return { success: true };
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const appSecret = process.env.WA_APP_SECRET;
  if (!appSecret) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto.createHmac("sha256", appSecret).update(body).digest("hex");
  return `sha256=${expected}` === signature;
}

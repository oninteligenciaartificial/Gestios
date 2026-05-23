/**
 * Chatwoot Cloud helper — SaaS-level account (not per-tenant).
 * One Chatwoot account owned by the SaaS; one inbox per tenant.
 */

const BASE_URL = process.env.CHATWOOT_BASE_URL ?? "https://app.chatwoot.com";
const API_TOKEN = process.env.CHATWOOT_API_TOKEN ?? "";
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    "api_access_token": API_TOKEN,
  };
}

export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
}

/**
 * Create a WhatsApp Cloud API inbox in Chatwoot for a tenant.
 * Returns the inbox id to store in OrgAddon.chatwootInboxId.
 */
export async function createChatwootInbox(
  name: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ inboxId: number } | { error: string }> {
  if (!API_TOKEN || !ACCOUNT_ID) {
    return { error: "CHATWOOT_API_TOKEN / CHATWOOT_ACCOUNT_ID no configurados" };
  }

  const res = await fetch(`${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name,
      channel: {
        type: "Channel::Whatsapp",
        phone_number: phoneNumberId,
        provider: "whatsapp_cloud",
        provider_config: {
          access_token: accessToken,
          phone_number_id: phoneNumberId,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    return { error: JSON.stringify(err) };
  }

  const data = await res.json() as ChatwootInbox;
  return { inboxId: data.id };
}

/**
 * Upsert a contact in Chatwoot by phone number (E.164 format).
 * Returns the Chatwoot contact id.
 */
export async function syncContactToChatwoot(contact: {
  name: string;
  phone: string;
  email?: string;
  inboxId: number;
}): Promise<{ contactId: number } | { error: string }> {
  if (!API_TOKEN || !ACCOUNT_ID) {
    return { error: "CHATWOOT_API_TOKEN / CHATWOOT_ACCOUNT_ID no configurados" };
  }

  // Search first
  const searchRes = await fetch(
    `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/search?q=${encodeURIComponent(contact.phone)}&include_contacts=true`,
    { headers: headers() }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json() as { payload: Array<{ id: number }> };
    if (searchData.payload?.length > 0) {
      return { contactId: searchData.payload[0].id };
    }
  }

  // Create
  const createRes = await fetch(`${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: contact.name,
      phone_number: contact.phone,
      email: contact.email,
      inbox_id: contact.inboxId,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({})) as Record<string, unknown>;
    return { error: JSON.stringify(err) };
  }

  const created = await createRes.json() as { id: number };
  return { contactId: created.id };
}

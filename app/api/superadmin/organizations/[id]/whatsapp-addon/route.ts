/**
 * POST  /api/superadmin/organizations/[id]/whatsapp-addon
 *   — Activate (or update) WhatsApp add-on for a tenant.
 *   — Creates Chatwoot inbox, triggers n8n WF-08 onboarding.
 *
 * DELETE /api/superadmin/organizations/[id]/whatsapp-addon
 *   — Deactivate add-on.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/superadmin";
import { createChatwootInbox } from "@/lib/chatwoot";

const activateSchema = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(10),
  templateName: z.string().default("appointment_reminder"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id: orgId } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { phoneNumberId, accessToken, templateName } = parsed.data;

  // Fetch org to verify it exists + get name
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, profiles: { select: { email: true }, take: 1 } },
  });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  // Check phoneNumberId not already in use by another org
  const conflict = await prisma.orgAddon.findFirst({
    where: {
      addon: "WHATSAPP",
      phoneNumberId,
      active: true,
      organizationId: { not: orgId },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: `phoneNumberId ya está registrado para otra organización` },
      { status: 409 }
    );
  }

  // Create Chatwoot inbox (fire-and-forget if env not set)
  let chatwootInboxId: number | undefined;
  const chatwootResult = await createChatwootInbox(
    `${org.name} — WhatsApp`,
    phoneNumberId,
    accessToken
  );
  if (!("error" in chatwootResult)) {
    chatwootInboxId = chatwootResult.inboxId;
  }

  // Upsert OrgAddon row
  const addon = await prisma.orgAddon.upsert({
    where: { organizationId_addon: { organizationId: orgId, addon: "WHATSAPP" } },
    create: {
      organizationId: orgId,
      addon: "WHATSAPP",
      active: true,
      phoneNumberId,
      accessToken,
      templateName,
      ...(chatwootInboxId !== undefined && { chatwootInboxId }),
    },
    update: {
      active: true,
      phoneNumberId,
      accessToken,
      templateName,
      ...(chatwootInboxId !== undefined && { chatwootInboxId }),
    },
  });

  // Enable flag on org
  await prisma.organization.update({
    where: { id: orgId },
    data: { whatsappAddon: true },
  });

  // Trigger n8n WF-08 onboarding (fire-and-forget)
  const n8nUrl = process.env.N8N_WEBHOOK_WHATSAPP_ONBOARDING;
  if (n8nUrl) {
    fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgId,
        orgName: org.name,
        phoneNumberId,
        chatwootInboxId,
        adminEmail: org.profiles[0]?.email,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    addonId: addon.id,
    chatwootInboxId: addon.chatwootInboxId,
  });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id: orgId } = await params;

  await prisma.orgAddon.updateMany({
    where: { organizationId: orgId, addon: "WHATSAPP" },
    data: { active: false },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { whatsappAddon: false },
  });

  return NextResponse.json({ ok: true });
}

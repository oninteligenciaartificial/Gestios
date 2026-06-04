import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  organizationName: z.string().min(1).max(100),
  userName: z.string().min(1).max(100),
  businessType: z.enum(["GENERAL", "ROPA", "SUPLEMENTOS", "ELECTRONICA", "FARMACIA", "FERRETERIA"]).optional(),
  authUserId: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const rateLimited = await checkRateLimit(request, "setup", RATE_LIMITS.setup);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo permite el setup si este usuario no tiene perfil todavia
  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ error: "Ya tienes una cuenta configurada" }, { status: 409 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { organizationName, userName, businessType, authUserId, email } = result.data;

  if (authUserId && authUserId !== user.id) {
    return NextResponse.json({ error: "La sesion de Google no coincide con el usuario enviado" }, { status: 403 });
  }

  if (email && user.email && email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "El email no coincide con la sesion de Google" }, { status: 403 });
  }

  // Crear slug unico a partir del nombre
  const slug = organizationName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50) + "-" + Date.now().toString(36);

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [org] = await prisma.$transaction([
    prisma.organization.create({
      data: {
        name: organizationName.trim(),
        slug,
        trialEndsAt,
        businessType: businessType ?? "GENERAL",
        profiles: {
          create: {
            userId: user.id,
            name: userName.trim(),
            role: "ADMIN",
          },
        },
      },
    }),
  ]);

  sendWelcomeEmail({
    to: user.email!,
    customerName: userName.trim(),
    orgName: organizationName.trim(),
  }).catch(() => {});

  // Trigger n8n WF-GS-05 new tenant alert (fire-and-forget)
  // Configure N8N_WEBHOOK_NEW_TENANT in Vercel environment variables
  const n8nNewTenantUrl = process.env.N8N_WEBHOOK_NEW_TENANT;
  if (n8nNewTenantUrl) {
    fetch(n8nNewTenantUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: org.id,
        orgName: org.name,
        plan: org.plan,
        businessType: org.businessType,
        slug: org.slug,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ organizationId: org.id }, { status: 201 });
}

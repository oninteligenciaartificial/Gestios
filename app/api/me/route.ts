import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  return NextResponse.json({ ...profile, email: user.email });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  orgName: z.string().min(1).optional(),
  orgPhone: z.string().optional(),
  orgAddress: z.string().optional(),
  orgRfc: z.string().optional(),
  orgLogoUrl: z.string().optional(),
  orgCurrency: z.string().optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = patchSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { name, orgName, orgPhone, orgAddress, orgRfc, orgLogoUrl, orgCurrency } = result.data;

  await prisma.profile.update({
    where: { id: profile.id },
    data: { ...(name ? { name } : {}) },
  });

  if (profile.organizationId && profile.role === "ADMIN") {
    await prisma.organization.update({
      where: { id: profile.organizationId },
      data: {
        ...(orgName ? { name: orgName } : {}),
        phone: orgPhone ?? undefined,
        address: orgAddress ?? undefined,
        rfc: orgRfc ?? undefined,
        logoUrl: orgLogoUrl ?? undefined,
        currency: orgCurrency ?? undefined,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Retorna el profile del usuario autenticado que tenga organizationId (ADMIN o STAFF).
 *  Retorna null si no hay sesion, no tiene perfil, o es SUPERADMIN (sin org). */
export async function getTenantProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !profile.organizationId) return null;

  return profile as typeof profile & { organizationId: string };
}

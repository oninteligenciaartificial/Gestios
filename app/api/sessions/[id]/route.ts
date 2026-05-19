import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "auth" } }
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: sessionId } = await params;

  // We can't reliably match session IDs from the JWT to auth.sessions rows
  // without the token hash. We just verify ownership and delete.

  const authDb = createAuthClient();

  // Verify session belongs to this user before deleting
  const { data: existing } = await authDb
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", profile.userId)
    .single();

  if (!existing) return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });

  const { error } = await authDb
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", profile.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function createAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "auth" } }
  );
}

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "sessions-read", RATE_LIMITS.read);
  if (rateLimited) return rateLimited;

  // Get current session token to identify "this device"
  const supabase = await createClient();
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  // auth.sessions stores the token hash — we match on user_agent + recency instead
  // The most recently updated session matching the current token is "this device"
  const currentToken = currentSession?.access_token ?? null;

  const authDb = createAuthClient();
  const { data, error } = await authDb
    .from("sessions")
    .select("id, created_at, updated_at, user_agent")
    .eq("user_id", profile.userId)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark the most recent session as current (best approximation without token hash comparison)
  const rows = (data ?? []) as Array<{ id: string; created_at: string; updated_at: string; user_agent: string | null }>;
  const sessions = rows.map((s, i) => ({
    id: s.id,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    userAgent: s.user_agent ?? null,
    isCurrent: currentToken !== null && i === 0, // most recent = current device
  }));

  return NextResponse.json(sessions);
}

export async function DELETE(req: NextRequest) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "sessions-delete", RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });

  // Identify current session to prevent self-revocation
  const supabase = await createClient();
  const { data: { session: currentSession } } = await supabase.auth.getSession();

  const authDb = createAuthClient();

  // Fetch the target session to verify ownership and detect if it's current
  const { data: targetRows } = await authDb
    .from("sessions")
    .select("id, user_agent, updated_at")
    .eq("id", sessionId)
    .eq("user_id", profile.userId)
    .limit(1);

  if (!targetRows || targetRows.length === 0) {
    return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
  }

  // Detect current session: most recent session (same heuristic as GET)
  if (currentSession) {
    const { data: allRows } = await authDb
      .from("sessions")
      .select("id")
      .eq("user_id", profile.userId)
      .order("updated_at", { ascending: false })
      .limit(1);

    const mostRecentId = allRows?.[0]?.id ?? null;
    if (mostRecentId === sessionId) {
      return NextResponse.json(
        { error: "No puedes cerrar tu sesion actual" },
        { status: 400 }
      );
    }
  }

  const { error } = await authDb
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", profile.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

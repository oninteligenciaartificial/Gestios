import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function sanitizeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  try {
    const parsed = new URL(value, "https://gestios.local");
    if (parsed.origin !== "https://gestios.local") return "/dashboard";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, organizationId: true },
  });

  if (profile?.role === "SUPERADMIN") {
    return NextResponse.redirect(`${origin}/superadmin`);
  }

  if (profile?.organizationId) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (next.startsWith("/setup")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/signup?message=complete_profile`);
}

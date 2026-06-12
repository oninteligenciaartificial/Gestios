import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_NEXT_COOKIE, sanitizeOauthNext } from "@/lib/oauth-redirect";
import { prisma } from "@/lib/prisma";

function redirectAndClearOauthCookie(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_NEXT_COOKIE);

  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeOauthNext(searchParams.get("next"));

  if (!code) {
    return redirectAndClearOauthCookie(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return redirectAndClearOauthCookie(`${origin}/login?error=auth_callback_error`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirectAndClearOauthCookie(`${origin}/login?error=auth_callback_error`);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, organizationId: true },
  });

  if (profile?.role === "SUPERADMIN") {
    return redirectAndClearOauthCookie(`${origin}/superadmin`);
  }

  if (profile?.organizationId) {
    return redirectAndClearOauthCookie(`${origin}${next}`);
  }

  if (next.startsWith("/setup")) {
    return redirectAndClearOauthCookie(`${origin}${next}`);
  }

  return redirectAndClearOauthCookie(`${origin}/signup?message=complete_profile`);
}

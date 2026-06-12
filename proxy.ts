import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_NEXT_COOKIE, sanitizeOauthNext } from "@/lib/oauth-redirect";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isRootOAuthCallback =
    pathname === "/" && request.nextUrl.searchParams.has("code");

  if (isRootOAuthCallback) {
    const url = request.nextUrl.clone();
    const rememberedNext = sanitizeOauthNext(
      request.cookies.get(OAUTH_NEXT_COOKIE)?.value
    );

    url.pathname = "/auth/callback";

    if (!url.searchParams.has("next")) {
      url.searchParams.set("next", rememberedNext);
    }

    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

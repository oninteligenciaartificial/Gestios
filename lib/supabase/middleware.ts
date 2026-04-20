import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/setup") || pathname.startsWith("/registro");

  // Helper: clone redirect preserving refreshed session cookies
  function redirectWith(destination: string) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, cookie as Parameters<typeof res.cookies.set>[2]);
    });
    return res;
  }

  // Redirigir a login si no hay sesion (excepto rutas publicas)
  if (!user && !isPublic) {
    return redirectWith("/login");
  }

  // Si esta logueado y va a /login, redirigir al dashboard
  if (user && pathname.startsWith("/login")) {
    return redirectWith("/");
  }

  return supabaseResponse;
}

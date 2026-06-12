"use client";

import { Suspense, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicShell } from "@/components/PublicShell";
import { OAUTH_NEXT_COOKIE, sanitizeOauthNext } from "@/lib/oauth-redirect";
import { createClient } from "@/lib/supabase/client";
import { loginAction } from "./actions";

function rememberOauthNext(next: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.24)] transition-[box-shadow,opacity,transform] duration-200 hover:shadow-[0_0_30px_rgba(255,107,0,0.36)] active:scale-[0.99] disabled:opacity-50"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(loginAction, null);
  const safeNext = sanitizeOauthNext(searchParams.get("next"));
  const oauthError = searchParams.get("error");

  useEffect(() => {
    if (state?.ok) {
      window.location.href = safeNext;
    }
  }, [safeNext, state]);

  async function handleGoogleLogin() {
    const supabase = createClient();
    rememberOauthNext(safeNext);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
      },
    });

    if (error) {
      window.location.href = `/login?error=${encodeURIComponent(error.message)}`;
    }
  }

  return (
    <PublicShell className="flex items-center justify-center px-4 py-10">
      <div className="glass-panel public-card w-full max-w-md rounded-3xl p-8 space-y-6">
        <div className="text-center">
          <BrandLogo href="/" variant="full" size="auth" tone="dark" className="justify-center" priority />
          <p className="text-brand-muted mt-4">Inicia sesion para continuar</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white shadow-sm transition-[background-color,border-color,transform] duration-200 hover:border-white/20 hover:bg-white/10 active:scale-[0.99]"
        >
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-xs font-black text-[#4285F4]">
            G
          </span>
          Continuar con Google
        </button>
        <p className="text-xs leading-relaxed text-brand-muted">
          Google puede mostrar Supabase como proveedor seguro de autenticación. Luego volverás a GestiOS.
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-white/10" />
          <span>o con email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-muted mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              placeholder="admin@minegocio.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-brand-muted">
                Contraseña
              </label>
              <Link href="/forgot-password" className="text-xs text-brand-kinetic-orange hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {oauthError && (
            <p className="error-shake rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {oauthError === "auth_callback_error"
                ? "No pudimos completar el acceso con Google. Intenta nuevamente."
                : oauthError}
            </p>
          )}

          {state && !state.ok && (
            <p className="error-shake rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          {state?.ok && <p className="text-green-700 text-sm">Sesion iniciada. Redirigiendo...</p>}

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-brand-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-brand-kinetic-orange hover:underline">
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

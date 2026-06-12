"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicShell } from "@/components/PublicShell";
import { OAUTH_NEXT_COOKIE } from "@/lib/oauth-redirect";
import { createClient } from "@/lib/supabase/client";

const PLAN_NAMES: Record<string, string> = {
  basico: "Basico",
  crecer: "Crecer",
  pro: "Pro",
  empresarial: "Empresarial",
};

function rememberOauthNext(next: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

function SignupForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const message = searchParams.get("message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oauthUser, setOauthUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const selectedPlan = planParam ? PLAN_NAMES[planParam] : null;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setOauthUser(user);
      if (user?.email) setEmail(user.email);
      setCheckingSession(false);
    });
  }, []);

  async function handleGoogleSignup() {
    setError("");
    const supabase = createClient();
    const planQuery = planParam ? `&plan=${encodeURIComponent(planParam)}` : "";
    rememberOauthNext(`/setup?from=google${planQuery}`);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/setup?from=google${planQuery}`)}`,
      },
    });

    if (oauthError) setError(oauthError.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (oauthUser) {
      window.location.href = "/setup?from=google";
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/setup` },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <PublicShell className="flex items-center justify-center px-4 py-10">
        <div className="glass-panel public-card w-full max-w-md rounded-3xl p-8 text-center space-y-4">
          <BrandLogo href="/" variant="full" size="auth" tone="dark" className="justify-center" priority />
          <h2 className="text-xl font-display font-bold text-white">Revisa tu correo</h2>
          <p className="text-brand-muted text-sm leading-relaxed">
            Te enviamos un enlace de confirmación a <span className="font-medium text-white">{email}</span>.
            Haz clic en el enlace para activar tu cuenta y configurar tu tienda.
          </p>
          {selectedPlan && (
            <p className="text-brand-muted text-xs">
              Plan seleccionado: <span className="text-brand-kinetic-orange font-bold">{selectedPlan}</span>
            </p>
          )}
          <Link href="/login" className="block text-brand-kinetic-orange text-sm hover:underline mt-4">
            Ya confirme mi correo - Entrar
          </Link>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell className="flex items-center justify-center px-4 py-10">
      <div className="glass-panel public-card w-full max-w-md rounded-3xl p-8 space-y-6">
        <div className="text-center">
          <BrandLogo href="/" variant="full" size="auth" tone="dark" className="justify-center" priority />
          <p className="text-brand-muted mt-4 text-sm">Crea tu cuenta - 7 días gratis, sin tarjeta</p>
          {selectedPlan && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-medium">
              Plan {selectedPlan} seleccionado - 7 días gratis
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white shadow-sm transition-[background-color,border-color,transform] duration-200 hover:border-white/20 hover:bg-white/10 active:scale-[0.99]"
        >
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-xs font-black text-[#4285F4]">
            G
          </span>
          Continuar con Google
        </button>
        <p className="text-xs leading-relaxed text-brand-muted">
          Google puede mostrar Supabase como proveedor seguro de autenticación. Luego completarás los datos de tu negocio en GestiOS.
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-white/10" />
          <span>{oauthUser ? "cuenta Google detectada" : "o con email"}</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {message === "complete_profile" && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Completa los datos de tu negocio para entrar al dashboard.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="text-sm text-brand-muted">
              Correo electrónico
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              readOnly={Boolean(oauthUser)}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-kinetic-orange transition-colors read-only:bg-white/10 read-only:text-brand-muted"
              placeholder="tu@negocio.com"
            />
          </div>

          {!oauthUser && (
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="text-sm text-brand-muted">
                Contraseña
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          )}

          {error && (
            <p className="error-shake rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || checkingSession}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.24)] transition-[box-shadow,opacity,transform] duration-200 hover:shadow-[0_0_30px_rgba(255,107,0,0.36)] active:scale-[0.99] disabled:opacity-50"
          >
            {loading
              ? "Continuando..."
              : oauthUser
                ? "Completar datos del negocio"
                : "Crear cuenta gratis"}
          </button>
        </form>

        <p className="text-center text-sm text-brand-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-kinetic-orange hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

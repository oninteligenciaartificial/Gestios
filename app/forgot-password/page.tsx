"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicShell } from "@/components/PublicShell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <PublicShell className="flex items-center justify-center px-4 py-10">
      <div className="glass-panel public-card rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <BrandLogo href="/" variant="full" size="auth" className="justify-center" priority />
          <p className="text-brand-muted mt-4">Recuperar contrasena</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-slate-950 font-medium">Revisa tu correo</p>
            <p className="text-brand-muted text-sm">
              Te enviamos un enlace a <span className="text-slate-950">{email}</span> para restablecer tu contrasena.
            </p>
            <Link href="/login" className="inline-block text-sm text-brand-kinetic-orange hover:underline">
              Volver al inicio de sesion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-brand-muted text-sm text-center">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-muted mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="admin@minegocio.com"
              />
            </div>

            {error && (
              <p className="error-shake rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.24)] transition-[box-shadow,opacity,transform] duration-200 hover:shadow-[0_0_30px_rgba(255,107,0,0.36)] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

            <p className="text-center text-sm text-brand-muted">
              <Link href="/login" className="text-brand-kinetic-orange hover:underline">
                Volver al inicio de sesion
              </Link>
            </p>
          </form>
        )}
      </div>
    </PublicShell>
  );
}

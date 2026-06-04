"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicShell } from "@/components/PublicShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError("Enlace invalido o expirado. Solicita uno nuevo.");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <PublicShell className="flex items-center justify-center px-4 py-10">
      <div className="glass-panel public-card rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <BrandLogo href="/" variant="full" size="auth" className="justify-center" priority />
          <p className="text-brand-muted mt-4">Nueva contrasena</p>
        </div>

        {!ready && !error && <p className="text-center text-brand-muted text-sm">Verificando enlace...</p>}

        {error && !ready && (
          <div className="text-center space-y-3">
            <p className="error-shake rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            <a href="/forgot-password" className="text-brand-kinetic-orange text-sm hover:underline">
              Solicitar nuevo enlace
            </a>
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-muted mb-1">
                Nueva contrasena
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="Minimo 8 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-brand-muted mb-1">
                Confirmar contrasena
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="Repite la contrasena"
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
              {loading ? "Guardando..." : "Guardar contrasena"}
            </button>
          </form>
        )}
      </div>
    </PublicShell>
  );
}

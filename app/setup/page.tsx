"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationName: orgName, userName }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Ocurrio un error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface-lowest p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="text-3xl font-display font-bold tracking-widest text-brand-kinetic-orange mb-2">
            GestiOS.
          </div>
          <h1 className="text-2xl font-bold text-white">Configura tu tienda</h1>
          <p className="text-brand-muted mt-2">Solo necesitas hacer esto una vez.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-muted">Nombre de la tienda</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              placeholder="Ej: Mi Tienda"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-muted">Tu nombre</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              placeholder="Ej: Daniela"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold transition-opacity disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear mi cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

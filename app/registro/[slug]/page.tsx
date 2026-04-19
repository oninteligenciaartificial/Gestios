"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Store } from "lucide-react";

interface OrgInfo { name: string; logoUrl?: string }

const inp = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm";

export default function RegistroPage() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/registro?slug=${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setOrg(data); else setNotFound(true); })
      .catch(() => setNotFound(true));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, email, phone, birthday }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
    } else {
      setError(data.error ?? "Ocurrio un error");
    }
    setLoading(false);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface-lowest p-6">
        <div className="text-center space-y-3">
          <Store size={48} className="mx-auto text-brand-muted opacity-40" />
          <p className="text-white font-bold text-xl">Tienda no encontrada</p>
          <p className="text-brand-muted text-sm">Verifica el enlace e intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface-lowest">
        <div className="w-8 h-8 border-2 border-brand-kinetic-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface-lowest p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle size={56} className="mx-auto text-brand-growth-neon" />
          <h1 className="text-2xl font-bold text-white">Registro exitoso</h1>
          <p className="text-brand-muted">
            Bienvenido a <strong className="text-white">{org.name}</strong>. Ya eres parte de nuestro programa de clientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface-lowest p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="h-16 mx-auto object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-kinetic-orange/15 flex items-center justify-center mx-auto">
              <Store size={28} className="text-brand-kinetic-orange" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{org.name}</h1>
          <p className="text-brand-muted text-sm">Registrate para recibir notificaciones y acumular puntos.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-muted uppercase tracking-wide">Nombre completo *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Tu nombre"
              className={inp}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-muted uppercase tracking-wide">Correo electronico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={inp}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-muted uppercase tracking-wide">Telefono / WhatsApp</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="55 1234 5678"
              className={inp}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-muted uppercase tracking-wide">Fecha de nacimiento</label>
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              className={`${inp} [color-scheme:dark]`}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm transition-opacity disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>

          <p className="text-center text-xs text-brand-muted">
            Tus datos solo seran usados por <strong>{org.name}</strong> para enviarte notificaciones.
          </p>
        </form>

        <p className="text-center text-xs text-brand-muted/40">
          Gestionado con <span className="text-brand-kinetic-orange">GestiOS</span>
        </p>
      </div>
    </div>
  );
}

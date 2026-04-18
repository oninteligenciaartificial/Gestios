"use client";

import { useState, useEffect } from "react";
import { User, Building2, Lock, Save } from "lucide-react";

interface Profile {
  name: string;
  role: string;
  organization?: { name: string; phone?: string; address?: string };
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/me").then(async (r) => {
      if (r.ok) {
        const data: Profile = await r.json();
        setProfile(data);
        setName(data.name);
        setOrgName(data.organization?.name ?? "");
        setOrgPhone(data.organization?.phone ?? "");
        setOrgAddress(data.organization?.address ?? "");
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, orgName, orgPhone, orgAddress }),
    });
    setMsg(res.ok ? "Cambios guardados." : "Error al guardar.");
    setSaving(false);
  }

  if (!profile) return <div className="p-8 text-brand-muted">Cargando...</div>;

  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <header className="animate-pop">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">Configuracion</h1>
        <p className="text-brand-muted mt-1">Administra tu perfil y datos de la tienda.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
              <User size={18} className="text-brand-kinetic-orange" />
            </div>
            <h2 className="font-display font-bold text-white">Mi Perfil</h2>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Tu nombre" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Rol</label>
            <input value={profile.role} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
          </div>
        </section>

        {isAdmin && profile.organization && (
          <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-growth-neon/10">
                <Building2 size={18} className="text-brand-growth-neon" />
              </div>
              <h2 className="font-display font-bold text-white">Mi Tienda</h2>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Nombre de la tienda</label>
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inp} placeholder="Nombre" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Telefono</label>
              <input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} className={inp} placeholder="55 1234 5678" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Direccion</label>
              <input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} className={inp} placeholder="Calle, ciudad" />
            </div>
          </section>
        )}

        <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-white/5">
              <Lock size={18} className="text-brand-muted" />
            </div>
            <h2 className="font-display font-bold text-white">Contrasena</h2>
          </div>
          <p className="text-sm text-brand-muted">Para cambiar tu contrasena, usa el enlace de recuperacion desde la pantalla de login.</p>
        </section>

        {msg && <p className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-brand-growth-neon"}`}>{msg}</p>}

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}

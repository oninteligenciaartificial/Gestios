"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Shield, Activity, Mail, X, Users } from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: "ADMIN" | "STAFF";
  userId: string;
  createdAt: string;
}

const input = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const EMPTY: { name: string; email: string; password: string; role: "ADMIN" | "STAFF" } = { name: "", email: "", password: "", role: "STAFF" };

export default function Staff() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      setForm(EMPTY);
      fetchMembers();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al crear usuario");
    }
    setSaving(false);
  }

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Equipo</h1>
          <p className="text-brand-muted mt-1">Usuarios con acceso a tu tienda.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); }}
          className="bg-gradient-to-br from-brand-growth-green to-brand-growth-neon text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(195,244,0,0.3)] hover:shadow-[0_0_30px_rgba(195,244,0,0.5)] transition-all"
        >
          <UserPlus size={18} /> Invitar Usuario
        </button>
      </header>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Cargando equipo...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className="glass-panel p-6 rounded-3xl animate-pop relative overflow-hidden group">
              {member.role === "ADMIN" && (
                <div className="absolute top-0 right-0 p-4">
                  <Shield size={20} className="text-brand-kinetic-orange opacity-80" />
                </div>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-brand-surface-low border border-white/10 flex items-center justify-center text-xl font-display font-bold text-white group-hover:border-brand-kinetic-orange transition-colors">
                  {initials(member.name)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{member.name}</h3>
                  <p className={`text-sm font-medium ${member.role === "ADMIN" ? "text-brand-kinetic-orange" : "text-brand-muted"}`}>
                    {member.role}
                  </p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Activity size={16} />
                  <span className="text-brand-growth-neon">Activo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <Mail size={16} />
                  <span className="text-xs truncate">{new Date(member.createdAt).toLocaleDateString("es-MX")}</span>
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="col-span-3 py-16 text-center text-brand-muted space-y-3">
              <Users size={40} className="mx-auto opacity-30" />
              <p>No hay usuarios aun. Invita al primero.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Invitar Usuario</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="correo@ejemplo.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Contrasena temporal *</label>
                <input required type="text" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} placeholder="Min 6 caracteres" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })} className={input}>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-growth-green to-brand-growth-neon text-black font-bold disabled:opacity-50">
                {saving ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

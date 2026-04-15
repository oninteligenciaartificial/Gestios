"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Building2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { profiles: number; products: number; orders: number };
}

const EMPTY = { orgName: "", adminName: "", adminEmail: "", adminPassword: "" };
const input = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/organizations");
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/superadmin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(`Tienda "${form.orgName}" creada. Admin: ${form.adminEmail} / ${form.adminPassword}`);
      setForm(EMPTY);
      setShowModal(false);
      fetchOrgs();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al crear");
    }
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Organizaciones</h1>
          <p className="text-brand-muted mt-1">Todas las tiendas en la plataforma</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); setSuccess(""); }}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nueva Tienda
        </button>
      </header>

      {success && (
        <div className="p-4 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/30 text-brand-growth-neon text-sm font-medium">
          {success}
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Tienda</th>
                <th className="p-5 text-brand-muted font-medium">Usuarios</th>
                <th className="p-5 text-brand-muted font-medium">Productos</th>
                <th className="p-5 text-brand-muted font-medium">Pedidos</th>
                <th className="p-5 text-brand-muted font-medium">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-white">{org.name}</div>
                    <div className="text-xs text-brand-muted font-mono">{org.slug}</div>
                  </td>
                  <td className="p-5 text-white">{org._count.profiles}</td>
                  <td className="p-5 text-white">{org._count.products}</td>
                  <td className="p-5 text-white">{org._count.orders}</td>
                  <td className="p-5 text-brand-muted text-sm">{new Date(org.createdAt).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-brand-muted">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay tiendas aun.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Nueva Tienda</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre de la tienda *</label>
                <input required value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} className={input} placeholder="Tienda XYZ" />
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-brand-muted mb-3 uppercase tracking-wider">Cuenta del Admin</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm text-brand-muted">Nombre *</label>
                    <input required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className={input} placeholder="Nombre del admin" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-brand-muted">Email *</label>
                    <input required type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className={input} placeholder="admin@tienda.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-brand-muted">Contrasena temporal *</label>
                    <input required type="text" minLength={8} value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className={input} placeholder="Min 8 caracteres" />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50"
              >
                {saving ? "Creando..." : "Crear Tienda y Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Phone, MapPin } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  address: string;
  phone: string;
}

const EMPTY_FORM: FormState = { name: "", address: "", phone: "" };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function fetchBranches() {
    setLoading(true);
    const res = await fetch("/api/branches");
    if (res.ok) {
      setBranches(await res.json());
      setError(null);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Error al cargar sucursales");
    }
    setLoading(false);
  }

  useEffect(() => { fetchBranches(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(b: Branch) {
    setForm({ name: b.name, address: b.address ?? "", phone: b.phone ?? "" });
    setEditingId(b.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId ? `/api/branches/${editingId}` : "/api/branches";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchBranches();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Desactivar esta sucursal?")) return;
    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
    if (res.ok) await fetchBranches();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap justify-between items-start gap-3 animate-pop">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Sucursales</h1>
          <p className="text-brand-muted mt-1 text-sm">Gestiona las ubicaciones de tu negocio</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 sm:px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all text-sm"
        >
          <Plus size={16} />
          Nueva Sucursal
        </button>
      </header>

      {error && (
        <div className="glass-panel border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="glass-panel rounded-3xl p-6 animate-pop">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? "Editar Sucursal" : "Nueva Sucursal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nombre *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="Ej. Sucursal Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Direccion</label>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="Calle y numero, colonia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Telefono</label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                placeholder="55 1234 5678"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm disabled:opacity-50 transition-opacity"
              >
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 py-2.5 rounded-full glass-panel text-brand-muted text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-brand-muted animate-pulse">
          Cargando sucursales...
        </div>
      ) : branches.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <Building2 size={40} className="text-brand-muted mx-auto mb-4 opacity-40" />
          <p className="text-brand-muted">No tienes sucursales registradas aun.</p>
          <p className="text-brand-muted/60 text-sm mt-1">Crea tu primera sucursal para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div key={b.id} className="glass-panel rounded-2xl p-5 hover:-translate-y-1 transition-transform duration-300 animate-pop">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
                    <Building2 size={18} className="text-brand-kinetic-orange" />
                  </div>
                  <h3 className="font-bold text-white">{b.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {b.address && (
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <MapPin size={13} className="flex-shrink-0" />
                    <span>{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <Phone size={13} className="flex-shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                {!b.address && !b.phone && (
                  <p className="text-sm text-brand-muted/50">Sin datos de contacto</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

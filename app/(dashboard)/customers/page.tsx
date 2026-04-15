"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Plus, X, Pencil, Phone, Mail, MapPin } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const EMPTY = { name: "", phone: "", email: "", address: "", notes: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/customers/${editing.id}` : "/api/customers";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      fetchCustomers();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-brand-muted mt-1">Base de datos de clientes de tu tienda.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, telefono o email..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Cargando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-brand-muted space-y-3">
          <Users size={40} className="mx-auto opacity-30" />
          <p>{search ? "No se encontraron clientes." : "No hay clientes aun. Agrega el primero."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div key={c.id} className="glass-panel p-6 rounded-3xl animate-pop group relative">
              <button
                onClick={() => openEdit(c)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-all"
              >
                <Pencil size={16} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-kinetic-orange/20 border border-brand-kinetic-orange/30 flex items-center justify-center text-lg font-display font-bold text-brand-kinetic-orange">
                  {initials(c.name)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-brand-muted">{new Date(c.createdAt).toLocaleDateString("es-MX")}</p>
                </div>
              </div>
              <div className="space-y-2">
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <Phone size={14} />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <Mail size={14} />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <MapPin size={14} />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="text-xs text-brand-muted/70 mt-2 italic line-clamp-2">{c.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">
                {editing ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Telefono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="55 1234 5678" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} placeholder="correo@ejemplo.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Direccion</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} placeholder="Calle, numero, ciudad" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inp} resize-none`} rows={2} placeholder="Preferencias, alergias, etc." />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Cliente"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

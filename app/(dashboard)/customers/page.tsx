/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Search, Plus, X, Pencil, Phone, Mail, MapPin, ShoppingCart, Upload, Download, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  rfc: string | null;
  birthday: string | null;
  loyaltyPoints: number;
  notes: string | null;
  createdAt: string;
}

interface CustomerOrder {
  id: string;
  customerName: string;
  total: string;
  status: string;
  createdAt: string;
  customer: { id: string } | null;
  items: { quantity: number; unitPrice: number; product: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-500/20 text-yellow-400",
  CONFIRMADO: "bg-blue-500/20 text-blue-400",
  ENVIADO: "bg-purple-500/20 text-purple-400",
  ENTREGADO: "bg-brand-growth-neon/20 text-brand-growth-neon",
  CANCELADO: "bg-red-500/20 text-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente", CONFIRMADO: "Confirmado", ENVIADO: "Enviado",
  ENTREGADO: "Entregado", CANCELADO: "Cancelado",
};
const fmt = (n: number) => n.toLocaleString("es-BO", { minimumFractionDigits: 2 });

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const EMPTY = { name: "", phone: "", email: "", address: "", rfc: "", birthday: "", notes: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [pointsAdjustment, setPointsAdjustment] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [savingPoints, setSavingPoints] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (res.ok) { const d = await res.json(); setCustomers(d.data ?? d); }
    setLoading(false);
  }, [search]);

  async function handlePointsAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!viewCustomer) return;
    const adj = parseInt(pointsAdjustment);
    if (isNaN(adj)) { setPointsError("Ingresa un número válido"); return; }
    setSavingPoints(true);
    setPointsError("");
    const res = await fetch(`/api/customers/${viewCustomer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loyaltyPointsAdjustment: adj, reason: pointsReason }),
    });
    if (res.ok) {
      const updated = await res.json() as Customer;
      setViewCustomer({ ...viewCustomer, loyaltyPoints: updated.loyaltyPoints });
      setCustomers((prev) => prev.map((c) => c.id === updated.id ? { ...c, loyaltyPoints: updated.loyaltyPoints } : c));
      setShowPointsForm(false);
      setPointsAdjustment("");
      setPointsReason("");
    } else {
      const d = await res.json() as { error?: string };
      setPointsError(d.error ?? "Error al ajustar puntos");
    }
    setSavingPoints(false);
  }

  async function openHistory(c: Customer) {
    setViewCustomer(c);
    setShowPointsForm(false);
    setPointsAdjustment("");
    setPointsReason("");
    setPointsError("");
    setLoadingOrders(true);
    const res = await fetch("/api/orders?limit=200");
    if (res.ok) {
      const d = await res.json();
      const all: CustomerOrder[] = d.data ?? d;
      setCustomerOrders(all.filter((o) => o.customer?.id === c.id));
    }
    setLoadingOrders(false);
  }

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", rfc: c.rfc ?? "", birthday: c.birthday ? c.birthday.split("T")[0] : "", notes: c.notes ?? "" });
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
      toast.success(editing ? "Cliente actualizado" : "Cliente creado");
      setShowModal(false);
      fetchCustomers();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Cliente eliminado");
      setDeleteId(null);
      fetchCustomers();
    } else {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error ?? "No se pudo eliminar el cliente");
    }
    setDeleting(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    const text = await file.text();
    const res = await fetch("/api/customers/import", { method: "POST", body: text });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`Importados: ${data.imported}${data.skipped ? `, omitidos: ${data.skipped}` : ""}`);
      fetchCustomers();
    } else {
      setImportMsg(data.error ?? "Error al importar");
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function downloadTemplate() {
    const csv = "name,phone,email,address,notes\nJuan Perez,5512345678,juan@email.com,Calle 1,Cliente frecuente";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clientes_plantilla.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-wrap justify-between items-end gap-3 animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-brand-muted mt-1">Base de datos de clientes de tu tienda.</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-panel text-brand-muted hover:text-white text-sm transition-colors"
            title="Descargar plantilla CSV"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-panel text-brand-muted hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            <Upload size={15} />
            {importing ? "Importando..." : "Importar CSV"}
          </button>
          <a
            href="/api/export/customers"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-brand-muted hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <Download size={14} /> Exportar CSV
          </a>
          <button
            onClick={openCreate}
            className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
          >
            <Plus size={18} /> Nuevo Cliente
          </button>
        </div>
      </header>

      {importMsg && (
        <div className={`glass-panel rounded-2xl p-3 text-sm ${importMsg.includes("Error") || importMsg.includes("error") ? "text-red-400 border border-red-500/20" : "text-brand-growth-neon border border-brand-growth-neon/20"}`}>
          {importMsg}
        </div>
      )}

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Cargando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-brand-muted space-y-3">
          <Users size={40} className="mx-auto opacity-30" />
          <p>{search ? "No se encontraron clientes." : "No hay clientes aún. Agrega el primero."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div key={c.id} className="glass-panel p-6 rounded-3xl animate-pop group relative">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openHistory(c)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors" title="Ver historial">
                  <ShoppingCart size={14} />
                </button>
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors" title="Editar cliente">
                  <Pencil size={16} />
                </button>
                <button onClick={() => { setDeleteId(c.id); setDeleteError(""); }} className="p-2 rounded-lg hover:bg-red-500/20 text-brand-muted hover:text-red-400 transition-colors" title="Eliminar cliente">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-kinetic-orange/20 border border-brand-kinetic-orange/30 flex items-center justify-center text-lg font-display font-bold text-brand-kinetic-orange">
                  {initials(c.name)}
                </div>
                <div>
                  <Link href={`/customers/${c.id}`} className="font-bold text-white hover:text-brand-kinetic-orange transition-colors">{c.name}</Link>
                  <p className="text-xs text-brand-muted">{new Date(c.createdAt).toLocaleDateString("es-BO")}</p>
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

      {/* Customer order history modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewCustomer(null)}>
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-display font-bold text-white">{viewCustomer.name}</h2>
                <p className="text-xs text-brand-muted mt-0.5">Historial de compras</p>
              </div>
              <button onClick={() => setViewCustomer(null)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>

            {/* Loyalty points */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-xs text-brand-muted">Puntos de lealtad</p>
                <p className="text-xl font-display font-bold text-brand-kinetic-orange">{viewCustomer.loyaltyPoints}</p>
              </div>
              <button
                onClick={() => { setShowPointsForm((v) => !v); setPointsError(""); }}
                className="px-3 py-1.5 rounded-lg border border-brand-kinetic-orange/40 text-brand-kinetic-orange text-xs font-medium hover:bg-brand-kinetic-orange/10 transition-colors"
              >
                Ajustar puntos
              </button>
            </div>

            {showPointsForm && (
              <form onSubmit={handlePointsAdjust} className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-brand-muted font-medium">Ajuste manual de puntos</p>
                <div className="flex gap-3">
                  <input
                    required
                    type="number"
                    placeholder="Ej: 50 o -20"
                    value={pointsAdjustment}
                    onChange={(e) => setPointsAdjustment(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
                  />
                  <input
                    required
                    type="text"
                    placeholder="Razón del ajuste"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
                  />
                </div>
                {pointsError && <p className="text-red-400 text-xs">{pointsError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowPointsForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-brand-muted hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingPoints} className="px-4 py-1.5 rounded-lg bg-brand-kinetic-orange text-black text-xs font-bold disabled:opacity-50">
                    {savingPoints ? "Guardando..." : "Confirmar"}
                  </button>
                </div>
              </form>
            )}

            {loadingOrders ? (
              <p className="text-center text-brand-muted py-8">Cargando...</p>
            ) : customerOrders.length === 0 ? (
              <div className="py-10 text-center text-brand-muted">
                <ShoppingCart size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Este cliente no tiene pedidos registrados.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-panel p-3 rounded-xl text-center">
                    <div className="text-lg font-bold text-white">{customerOrders.length}</div>
                    <div className="text-xs text-brand-muted">Pedidos</div>
                  </div>
                  <div className="glass-panel p-3 rounded-xl text-center">
                    <div className="text-lg font-bold text-brand-kinetic-orange">Bs. {fmt(customerOrders.filter(o => o.status !== "CANCELADO").reduce((s, o) => s + Number(o.total), 0))}</div>
                    <div className="text-xs text-brand-muted">Total gastado</div>
                  </div>
                  <div className="glass-panel p-3 rounded-xl text-center">
                    <div className="text-lg font-bold text-brand-growth-neon">{customerOrders.filter(o => o.status === "ENTREGADO").length}</div>
                    <div className="text-xs text-brand-muted">Completados</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {customerOrders.map((o) => (
                    <div key={o.id} className="p-4 rounded-xl bg-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[o.status] ?? "bg-white/10 text-brand-muted"}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
                          <span className="text-xs text-brand-muted">{new Date(o.createdAt).toLocaleDateString("es-BO")}</span>
                        </div>
                        <span className="font-bold text-white text-sm">Bs. {fmt(Number(o.total))}</span>
                      </div>
                      <div className="text-xs text-brand-muted space-y-0.5">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.product.name}</span>
                            <span>{item.quantity} × Bs. {fmt(Number(item.unitPrice))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-display font-bold text-white">Eliminar cliente</h2>
            <p className="text-brand-muted text-sm">Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar este cliente?</p>
            {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-brand-muted hover:text-white transition-colors text-sm">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">
                {editing ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors" aria-label="Cerrar formulario">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="55 1234 5678" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} placeholder="correo@ejemplo.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Dirección</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} placeholder="Calle, número, ciudad" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm text-brand-muted">RFC</label>
                  <input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} className={inp} placeholder="XAXX010101000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-brand-muted">Cumpleaños</label>
                  <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inp} />
                </div>
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

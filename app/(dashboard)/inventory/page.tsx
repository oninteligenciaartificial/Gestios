"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X, Pencil, Trash2, ArrowUpDown, Package } from "lucide-react";

interface Category { id: string; name: string }
interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  cost: string;
  stock: number;
  minStock: number;
  active: boolean;
  category: { id: string; name: string } | null;
}

const EMPTY_FORM = {
  name: "", sku: "", categoryId: "", price: "", cost: "", stock: "0", minStock: "5",
};

function stockStatus(stock: number, minStock: number) {
  if (stock <= minStock) return { label: "Critico", cls: "bg-red-500/20 text-red-400" };
  if (stock <= minStock * 2) return { label: "Bajo", cls: "bg-yellow-500/20 text-yellow-400" };
  return { label: "En Stock", cls: "bg-brand-growth-neon/20 text-brand-growth-neon" };
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
    ]);
    if (prodRes.ok) setProducts(await prodRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      categoryId: product.category?.id ?? "",
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      minStock: String(product.minStock),
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const body = {
      name: form.name,
      sku: form.sku || undefined,
      categoryId: form.categoryId || undefined,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: parseInt(form.stock),
      minStock: parseInt(form.minStock),
    };

    const res = editing
      ? await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      setShowModal(false);
      fetchData();
    } else {
      const data = await res.json();
      setFormError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Inventario</h1>
          <p className="text-brand-muted mt-1">Gestion de productos y alertas de stock</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </header>

      <div className="relative animate-pop">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          className="w-full bg-brand-surface-highest/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando productos...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 font-medium text-brand-muted">
                  <span className="flex items-center gap-2"><ArrowUpDown size={14} /> Producto</span>
                </th>
                <th className="p-5 font-medium text-brand-muted">Categoria</th>
                <th className="p-5 font-medium text-brand-muted">Precio</th>
                <th className="p-5 font-medium text-brand-muted">Stock</th>
                <th className="p-5 font-medium text-brand-muted">Estado</th>
                <th className="p-5 font-medium text-brand-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => {
                const status = stockStatus(item.stock, item.minStock);
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-white">{item.name}</div>
                      {item.sku && <div className="text-xs text-brand-muted mt-0.5">SKU: {item.sku}</div>}
                    </td>
                    <td className="p-5 text-gray-400">{item.category?.name ?? "—"}</td>
                    <td className="p-5 text-gray-300 font-mono">${Number(item.price).toFixed(2)}</td>
                    <td className="p-5 text-white font-display font-medium">{item.stock} uds</td>
                    <td className="p-5">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(item)} className="text-brand-muted hover:text-white transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="text-brand-muted hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-brand-muted space-y-3">
            <Package size={40} className="mx-auto opacity-30" />
            <p>{search ? "No hay productos que coincidan." : "Aun no tienes productos. Crea el primero."}</p>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">
                {editing ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Nombre *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Whey Protein 100%" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU">
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} placeholder="WP-100" />
                </Field>
                <Field label="Categoria">
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={input}>
                    <option value="">Sin categoria</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio venta *">
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} placeholder="55.00" />
                </Field>
                <Field label="Costo">
                  <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={input} placeholder="30.00" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock actual">
                  <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={input} />
                </Field>
                <Field label="Stock minimo">
                  <input required type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={input} />
                </Field>
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold transition-opacity disabled:opacity-50"
              >
                {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Producto"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmacion eliminar */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6 text-center">
            <div className="text-red-400"><Trash2 size={40} className="mx-auto" /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Eliminar producto</h2>
              <p className="text-brand-muted mt-2">El producto se desactivara del inventario.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const input = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-brand-muted">{label}</label>
      {children}
    </div>
  );
}

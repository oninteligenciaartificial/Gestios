"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, X, Search, ChevronDown } from "lucide-react";

type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";

interface Product { id: string; name: string; price: string; stock: number }
interface Customer { id: string; name: string }
interface OrderItem { productId: string; quantity: number; unitPrice: number; product: { name: string } }
interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  customer: Customer | null;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE: "bg-yellow-500/20 text-yellow-400",
  CONFIRMADO: "bg-blue-500/20 text-blue-400",
  ENVIADO: "bg-purple-500/20 text-purple-400",
  ENTREGADO: "bg-brand-growth-neon/20 text-brand-growth-neon",
  CANCELADO: "bg-red-500/20 text-red-400",
};

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerId: "",
    notes: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0 }],
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const url = filterStatus ? `/api/orders?status=${filterStatus}` : "/api/orders";
    const res = await fetch(url);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    Promise.all([fetch("/api/products"), fetch("/api/customers")]).then(async ([p, c]) => {
      if (p.ok) setProducts(await p.json());
      if (c.ok) setCustomers(await c.json());
    });
  }, []);

  function openCreate() {
    setForm({ customerName: "", customerId: "", notes: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] });
    setError("");
    setShowModal(true);
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantity: 1, unitPrice: 0 }] }));
  }

  function removeItem(i: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  function setItem(i: number, field: string, value: string | number) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, idx) => {
        if (idx !== i) return item;
        if (field === "productId") {
          const prod = products.find((p) => p.id === value);
          return { ...item, productId: String(value), unitPrice: prod ? Number(prod.price) : item.unitPrice };
        }
        return { ...item, [field]: value };
      }),
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.items.some((i) => !i.productId)) { setError("Selecciona un producto en cada linea"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        customerId: form.customerId || undefined,
        notes: form.notes || undefined,
        items: form.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      }),
    });
    if (res.ok) { setShowModal(false); fetchOrders(); }
    else { const d = await res.json(); setError(d.error ?? "Error al crear pedido"); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
    setSelected(null);
  }

  const filtered = orders.filter((o) =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const orderTotal = form.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Pedidos</h1>
          <p className="text-brand-muted mt-1">Gestiona las ordenes de tus clientes.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nuevo Pedido
        </button>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente o ID..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors">
          <option value="">Todos</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Cargando pedidos...</div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden animate-pop">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium text-sm">Cliente</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Productos</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Total</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Estado</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Fecha</th>
                <th className="p-5 text-brand-muted font-medium text-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-brand-muted">
                    <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay pedidos aun.</p>
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-white">{o.customerName}</div>
                    <div className="text-xs text-brand-muted font-mono mt-0.5">{o.id.slice(0, 8)}...</div>
                  </td>
                  <td className="p-5 text-brand-muted text-sm">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                  <td className="p-5 font-display font-bold text-white">${Number(o.total).toLocaleString("es-MX")}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="p-5 text-brand-muted text-sm">{new Date(o.createdAt).toLocaleDateString("es-MX")}</td>
                  <td className="p-5">
                    <button onClick={() => setSelected(selected?.id === o.id ? null : o)} className="flex items-center gap-1 text-brand-muted hover:text-white transition-colors text-sm">
                      Acciones <ChevronDown size={14} />
                    </button>
                    {selected?.id === o.id && (
                      <div className="absolute mt-1 right-8 glass-panel rounded-xl p-2 z-10 space-y-1 min-w-[160px]">
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).filter((s) => s !== o.status).map((s) => (
                          <button key={s} onClick={() => updateStatus(o.id, s)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-brand-muted hover:text-white transition-colors">
                            Marcar: {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6 my-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Nuevo Pedido</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre del cliente *</label>
                <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={inp} placeholder="Nombre o razon social" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Cliente registrado (opcional)</label>
                <select value={form.customerId} onChange={(e) => { const c = customers.find((x) => x.id === e.target.value); setForm({ ...form, customerId: e.target.value, customerName: c ? c.name : form.customerName }); }} className={inp}>
                  <option value="">-- Sin vincular --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-brand-muted">Productos *</label>
                  <button type="button" onClick={addItem} className="text-brand-kinetic-orange text-sm font-bold hover:underline">+ Agregar linea</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <select value={item.productId} onChange={(e) => setItem(i, "productId", e.target.value)} className={`${inp} flex-1`}>
                      <option value="">-- Producto --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${Number(p.price).toLocaleString("es-MX")})</option>)}
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setItem(i, "quantity", Number(e.target.value))} className={`${inp} w-20`} placeholder="Cant." />
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => setItem(i, "unitPrice", Number(e.target.value))} className={`${inp} w-28`} placeholder="Precio" />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inp} resize-none`} rows={2} placeholder="Instrucciones especiales..." />
              </div>

              <div className="flex justify-between items-center py-3 border-t border-white/10">
                <span className="text-brand-muted text-sm">Total del pedido</span>
                <span className="text-2xl font-display font-bold text-white">${orderTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Creando..." : "Crear Pedido"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

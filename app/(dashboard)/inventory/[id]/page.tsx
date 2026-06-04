"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Package, Tag, Barcode, AlertTriangle, CheckCircle, XCircle, TrendingUp, Loader2, History } from "lucide-react";
import { formatMoney } from "@/lib/currency";

interface Variant {
  id: string;
  attributes: Record<string, string>;
  priceOverride: string | null;
  stock: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: string;
  cost: string | null;
  stock: number;
  minStock: number;
  active: boolean;
  imageUrl: string | null;
  category: { name: string } | null;
  variants: Variant[];
}

interface StockEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  userName: string | null;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch(`/api/products/stock-entry?productId=${id}`).then((r) => r.json()),
    ]).then(([p, e]: [Product, StockEntry[]]) => {
      setProduct(p);
      setEntries(Array.isArray(e) ? e : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-brand-kinetic-orange" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-brand-muted">
        <p>Producto no encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-kinetic-orange hover:underline text-sm">Volver</button>
      </div>
    );
  }

  const price = Number(product.price);
  const cost = Number(product.cost ?? 0);
  const margin = cost > 0 ? ((price - cost) / price) * 100 : null;
  const isLowStock = product.stock <= product.minStock;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 animate-pop">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-white/10 hover:border-white/30 text-brand-muted hover:text-white transition-colors mt-1"
          aria-label="Volver"
          title="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{product.name}</h1>
            {product.active ? (
              <span className="flex items-center gap-1 text-xs font-medium text-brand-growth-neon bg-brand-growth-neon/10 px-2.5 py-1 rounded-full">
                <CheckCircle size={11} /> Activo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
                <XCircle size={11} /> Inactivo
              </span>
            )}
          </div>
          {product.category && (
            <p className="text-brand-muted text-sm mt-1 flex items-center gap-1.5">
              <Tag size={13} /> {product.category.name}
            </p>
          )}
        </div>
        <Link
          href={`/inventory?edit=${encodeURIComponent(product.id)}`}
          className="px-4 py-2 rounded-xl border border-white/10 hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange text-brand-muted text-sm transition-colors"
        >
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — image + info */}
        <div className="space-y-4">
          {/* Image */}
          {product.imageUrl ? (
            <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
            </div>
          ) : (
            <div className="glass-panel rounded-2xl aspect-square flex items-center justify-center animate-pop">
              <Package size={48} className="text-white/10" />
            </div>
          )}

          {/* Identifiers */}
          {(product.sku || product.barcode) && (
            <div className="glass-panel p-4 rounded-2xl space-y-2 animate-pop">
              {product.sku && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-muted flex items-center gap-1.5"><Package size={13} /> SKU</span>
                  <span className="font-mono text-white text-xs bg-white/5 px-2 py-1 rounded">{product.sku}</span>
                </div>
              )}
              {product.barcode && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-muted flex items-center gap-1.5"><Barcode size={13} /> Código</span>
                  <span className="font-mono text-white text-xs bg-white/5 px-2 py-1 rounded">{product.barcode}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="glass-panel p-4 rounded-2xl animate-pop">
              <p className="text-brand-muted text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        {/* Right — stats + variants + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Price / Stock cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pop">
            <div className="glass-panel p-4 rounded-2xl">
              <div className="text-xs text-brand-muted mb-1">Precio venta</div>
              <div className="text-xl font-bold text-brand-kinetic-orange">{formatMoney(price)}</div>
            </div>
            {cost > 0 && (
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-xs text-brand-muted mb-1">Costo</div>
                <div className="text-xl font-bold text-white">{formatMoney(cost)}</div>
              </div>
            )}
            {margin !== null && (
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-xs text-brand-muted mb-1 flex items-center gap-1"><TrendingUp size={11} /> Margen</div>
                <div className="text-xl font-bold text-brand-growth-neon">{margin.toFixed(1)}%</div>
              </div>
            )}
            <div className={`glass-panel p-4 rounded-2xl ${isLowStock ? "border border-red-400/30" : ""}`}>
              <div className={`text-xs mb-1 flex items-center gap-1 ${isLowStock ? "text-red-400" : "text-brand-muted"}`}>
                {isLowStock && <AlertTriangle size={11} />} Stock
              </div>
              <div className={`text-xl font-bold ${isLowStock ? "text-red-400" : "text-white"}`}>{product.stock}</div>
              <div className="text-xs text-brand-muted mt-0.5">mín {product.minStock}</div>
            </div>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="font-bold text-white text-sm">Variantes ({product.variants.length})</h3>
              </div>
              <div className="divide-y divide-white/5">
                {product.variants.map((v) => (
                  <div key={v.id} className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-white font-medium">
                        {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ")}
                      </div>
                      {!v.active && <span className="text-xs text-red-400">Inactiva</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-kinetic-orange">
                        {v.priceOverride ? formatMoney(Number(v.priceOverride)) : "—"}
                      </div>
                      <div className={`text-xs ${v.stock <= 0 ? "text-red-400" : "text-brand-muted"}`}>
                        stock: {v.stock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock history */}
          <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <History size={15} className="text-brand-kinetic-orange" />
              <h3 className="font-bold text-white text-sm">Historial de stock</h3>
            </div>
            {entries.length === 0 ? (
              <div className="py-8 text-center text-brand-muted text-sm">Sin movimientos registrados</div>
            ) : (
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                {entries.map((e) => {
                  let qty = "";
                  let details = "";
                  try {
                    const d = e.details ? JSON.parse(e.details) as Record<string, unknown> : {};
                    qty = d.quantity != null ? `+${String(d.quantity)}` : "";
                    details = typeof d.notes === "string" ? d.notes : "";
                  } catch { /* ignore */ }
                  return (
                    <div key={e.id} className="px-5 py-3 flex justify-between items-start">
                      <div>
                        <div className="text-sm text-white">
                          {qty && <span className="text-brand-growth-neon font-bold mr-2">{qty}</span>}
                          {details || "Entrada de stock"}
                        </div>
                        {e.userName && <div className="text-xs text-brand-muted mt-0.5">{e.userName}</div>}
                      </div>
                      <div className="text-xs text-brand-muted flex-shrink-0 ml-4">
                        {new Date(e.createdAt).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

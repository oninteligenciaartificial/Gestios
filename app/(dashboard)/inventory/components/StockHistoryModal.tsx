"use client";

import { useEffect, useState } from "react";
import { X, Package } from "lucide-react";

interface StockEntry {
  id: string;
  userName: string;
  details: string | null;
  createdAt: string;
}

interface Props {
  productId: string;
  productName: string;
  open: boolean;
  onClose: () => void;
}

export function StockHistoryModal({ productId, productName, open, onClose }: Props) {
  const [history, setHistory] = useState<{
    productId: string | null;
    entries: StockEntry[];
  }>({ productId: null, entries: [] });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/products/stock-entry?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data: StockEntry[]) => {
        if (!cancelled) {
          setHistory({ productId, entries: Array.isArray(data) ? data : [] });
        }
      })
      .catch(() => {
        if (!cancelled) setHistory({ productId, entries: [] });
      });
    return () => { cancelled = true; };
  }, [open, productId]);

  if (!open) return null;

  const loading = history.productId !== productId;
  const entries = loading ? [] : history.entries;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg rounded-3xl p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Movimientos de Stock</h2>
            <p className="text-xs text-brand-muted mt-0.5 truncate">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white transition-colors"
            aria-label="Cerrar historial de stock"
            title="Cerrar historial de stock"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p className="text-center text-brand-muted py-8">Cargando...</p>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-brand-muted space-y-2">
            <Package size={36} className="mx-auto opacity-20" />
            <p className="text-sm">No hay movimientos registrados para este producto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-muted text-xs border-b border-white/10">
                  <th className="pb-2 text-left">Fecha</th>
                  <th className="pb-2 text-left">Tipo</th>
                  <th className="pb-2 text-right">Cantidad</th>
                  <th className="pb-2 text-left">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((e) => {
                  let qty: number | null = null;
                  try {
                    const parsed = JSON.parse(e.details ?? "{}") as { quantity?: number };
                    qty = parsed.quantity ?? null;
                  } catch {
                    // ignore parse errors
                  }
                  return (
                    <tr key={e.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-brand-muted">
                        {new Date(e.createdAt).toLocaleDateString("es-BO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-growth-neon/10 text-brand-growth-neon">
                          Entrada
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-brand-growth-neon">
                        {qty !== null ? `+${qty}` : "—"}
                      </td>
                      <td className="py-3 text-brand-muted truncate max-w-[120px]">{e.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

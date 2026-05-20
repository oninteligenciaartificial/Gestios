"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, RefreshCw } from "lucide-react";

interface TiendaData {
  slug: string;
  name: string;
  currency: string;
  activeProducts: number;
  lastOrder: {
    id: string;
    customerName: string;
    total: string | number;
    createdAt: string;
  } | null;
}

const BASE_URL = "https://gestios.app";

export function TiendaSettings() {
  const [data, setData] = useState<TiendaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/tienda/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function copyUrl() {
    if (!data) return;
    const url = `${BASE_URL}/${data.slug}/tienda`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-brand-muted">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-400">
        No se pudo cargar la información de tu tienda.
      </div>
    );
  }

  const storeUrl = `${BASE_URL}/${data.slug}/tienda`;

  return (
    <div className="space-y-6">
      {/* Store URL */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
        <p className="text-sm font-medium text-brand-muted uppercase tracking-wide">URL de tu tienda</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-brand-base border border-brand-border px-4 py-2.5 font-mono text-sm text-brand-text break-all">
            {storeUrl}
          </div>
          <button
            onClick={copyUrl}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-brand-muted hover:text-brand-text hover:border-brand-text/30 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2.5 text-sm text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver tienda
          </a>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-sm text-brand-muted mb-1">Productos activos en tienda</p>
          <p className="text-3xl font-semibold text-brand-text">{data.activeProducts}</p>
          <p className="text-xs text-brand-muted mt-1">Todos los productos activos son visibles en la tienda</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-sm text-brand-muted mb-1">Ultimo pedido por tienda</p>
          {data.lastOrder ? (
            <>
              <p className="text-base font-medium text-brand-text">{data.lastOrder.customerName}</p>
              <p className="text-sm text-brand-muted">
                {data.currency} {Number(data.lastOrder.total).toFixed(2)} &middot;{" "}
                {new Date(data.lastOrder.createdAt).toLocaleDateString("es-BO")}
              </p>
            </>
          ) : (
            <p className="text-sm text-brand-muted mt-1">Aun no hay pedidos via tienda online</p>
          )}
        </div>
      </div>

      {/* Manage products link */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-text mb-1">Gestionar productos visibles</p>
          <p className="text-xs text-brand-muted">
            Todos los productos marcados como activos aparecen en tu tienda. Desactiva los que no quieras mostrar desde el inventario.
          </p>
        </div>
        <a
          href="/inventory"
          className="shrink-0 rounded-lg border border-brand-border bg-brand-base hover:bg-brand-surface px-4 py-2 text-sm text-brand-text transition-colors"
        >
          Ir a Inventario
        </a>
      </div>
    </div>
  );
}

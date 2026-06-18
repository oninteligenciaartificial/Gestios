"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Users, ShoppingCart, X, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import type { BusinessType } from "@/lib/business-types";

interface SearchProduct { id: string; name: string; sku: string | null; stock: number; price: string }
interface SearchCustomer { id: string; name: string; phone: string | null; email: string | null; loyaltyPoints: number }
interface SearchOrder { id: string; customerName: string; status: string; total: string; createdAt: string }
interface SearchResults { products: SearchProduct[]; customers: SearchCustomer[]; orders: SearchOrder[] }

export function CommandPalette({ businessType = "GENERAL" }: { businessType?: BusinessType }) {
  const router = useRouter();
  const isDentalMode = isDentalGestOperationalMode(businessType);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounce search
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as SearchResults;
        setResults(data);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  // Build flat list of navigable items
  const items: { href: string; label: string }[] = [];
  if (results) {
    results.products.forEach((p) => items.push({ href: `/inventory/${p.id}`, label: p.name }));
    if (!isDentalMode) {
      results.customers.forEach((c) => items.push({ href: `/customers/${c.id}`, label: c.name }));
      results.orders.forEach((o) => items.push({ href: `/ventas/${o.id}`, label: o.customerName }));
    }
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && items[activeIndex]) { navigate(items[activeIndex].href); }
  }

  if (!open) return null;

  const hasResults = results && (results.products.length > 0 || results.customers.length > 0 || results.orders.length > 0);
  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          {loading ? <Loader2 size={18} className="text-brand-muted animate-spin flex-shrink-0" /> : <Search size={18} className="text-brand-muted flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isDentalMode ? "Buscar insumos, codigo o lote..." : "Buscar productos, clientes, pedidos..."}
            className="flex-1 bg-transparent text-white placeholder-brand-muted outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-brand-muted hover:text-white transition-colors">
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-xs text-brand-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.products.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-xs font-medium text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={11} /> {isDentalMode ? "Insumos" : "Productos"}
                </div>
                {results.products.map((p) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/inventory/${p.id}`)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors ${activeIndex === idx ? "bg-white/5" : ""}`}
                    >
                      <div>
                        <span className="text-sm text-white">{p.name}</span>
                        {p.sku && <span className="text-xs text-brand-muted ml-2 font-mono">{p.sku}</span>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-sm font-bold text-brand-kinetic-orange">{formatMoney(Number(p.price))}</span>
                        <span className="text-xs text-brand-muted ml-2">stock: {p.stock}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!isDentalMode && results.customers.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-xs font-medium text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={11} /> Clientes
                </div>
                {results.customers.map((c) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors ${activeIndex === idx ? "bg-white/5" : ""}`}
                    >
                      <div>
                        <span className="text-sm text-white">{c.name}</span>
                        {c.phone && <span className="text-xs text-brand-muted ml-2">{c.phone}</span>}
                      </div>
                      <span className="text-xs text-yellow-400 flex-shrink-0">★ {c.loyaltyPoints}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!isDentalMode && results.orders.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-xs font-medium text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart size={11} /> Pedidos
                </div>
                {results.orders.map((o) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={o.id}
                      onClick={() => navigate(`/ventas/${o.id}`)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors ${activeIndex === idx ? "bg-white/5" : ""}`}
                    >
                      <div>
                        <span className="text-sm text-white">{o.customerName}</span>
                        <span className="text-xs font-mono text-brand-muted ml-2">#{o.id.slice(-8).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-bold text-brand-kinetic-orange flex-shrink-0">{formatMoney(Number(o.total))}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {query.length >= 2 && !loading && !hasResults && (
          <div className="py-8 text-center text-brand-muted text-sm">
            Sin resultados para &ldquo;{query}&rdquo;
          </div>
        )}

        {!query && (
          <div className="px-4 py-4 text-xs text-brand-muted flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">↑↓</kbd> navegar</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Enter</kbd> abrir</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Esc</kbd> cerrar</span>
          </div>
        )}
      </div>
    </div>
  );
}

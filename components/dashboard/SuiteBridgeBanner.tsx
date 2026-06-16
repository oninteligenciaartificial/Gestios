"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Boxes, X } from "lucide-react";

const STORAGE_KEY = "gestios_suite_bridge";

type BridgeState = {
  source: string;
  returnTo: string;
};

function safeHref(value: string | null): string {
  if (!value) return "";
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

export function SuiteBridgeBanner() {
  const searchParams = useSearchParams();
  const [bridge, setBridge] = useState<BridgeState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const source = searchParams.get("source") ?? searchParams.get("from");
    const returnTo = safeHref(searchParams.get("returnTo"));

    if (source === "dentalgest" || source === "dental") {
      const next = { source: "dentalgest", returnTo };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const id = window.setTimeout(() => setBridge(next), 0);
      return () => window.clearTimeout(id);
    }

    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as BridgeState;
      if (parsed.source === "dentalgest") {
        const id = window.setTimeout(() => setBridge(parsed), 0);
        return () => window.clearTimeout(id);
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [searchParams]);

  const returnHref = useMemo(() => safeHref(bridge?.returnTo ?? ""), [bridge]);

  if (!bridge || dismissed) return null;

  return (
    <div className="border-b border-cyan-400/15 bg-cyan-400/10 px-4 py-2.5 text-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-cyan-100">
          <Boxes size={16} className="text-cyan-300" />
          <span className="font-semibold">Modulo operativo de DentalGest</span>
          <span className="hidden text-cyan-100/70 sm:inline">
            Inventario, compras, proveedores, vencimientos y stock de insumos dentales.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {returnHref && (
            <a
              href={returnHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10"
            >
              <ArrowLeft size={13} /> Volver a DentalGest
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cyan-100/70 hover:bg-cyan-300/10 hover:text-cyan-50"
            aria-label="Ocultar aviso"
            title="Ocultar aviso"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

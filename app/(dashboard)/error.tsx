"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full flex flex-col items-center gap-5 text-center">
        <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-white">Algo salió mal</h2>
          <p className="text-brand-muted text-sm">
            {isDev && error?.message
              ? error.message
              : "Ha ocurrido un error inesperado. Por favor intenta de nuevo."}
          </p>
          {error?.digest && (
            <p className="text-brand-muted text-xs font-mono">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-kinetic-orange text-black font-bold text-sm hover:bg-brand-kinetic-orange-light transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/dashboard"
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 transition-colors text-sm font-medium text-center"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

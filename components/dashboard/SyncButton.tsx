"use client";

import { useState } from "react";
import { RefreshCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    if (syncing) return;
    setSyncing(true);
    router.refresh();
    setTimeout(() => setSyncing(false), 1000);
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="glass-panel px-3 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 hover:bg-brand-surface-highest/80 transition-colors text-sm disabled:opacity-60"
    >
      {syncing ? (
        <Loader2 size={16} className="text-brand-kinetic-orange animate-spin" />
      ) : (
        <RefreshCcw size={16} className="text-brand-kinetic-orange" />
      )}
      <span className="hidden sm:inline">Sincronizar</span>
    </button>
  );
}

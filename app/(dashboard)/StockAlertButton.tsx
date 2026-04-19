"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";

export function StockAlertButton({ count }: { count: number }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setLoading(true);
    await fetch("/api/email/stock-alert", { method: "POST" });
    setLoading(false);
    setSent(true);
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading || sent}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-kinetic-orange/40 text-brand-kinetic-orange text-sm font-medium hover:bg-brand-kinetic-orange/10 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
      {sent ? "Alerta enviada" : `Enviar alerta (${count} productos)`}
    </button>
  );
}

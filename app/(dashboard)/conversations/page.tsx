"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, X, Phone, CheckCircle } from "lucide-react";

interface Conversation {
  id: string;
  phone: string;
  waId: string | null;
  type: string;
  messageCount: number;
  openedAt: string;
  closedAt: string | null;
}

interface ConversationData {
  conversations: Conversation[];
  monthlyCount: number;
  monthlyLimit: number;
  extraCost: string;
}

export default function ConversationsPage() {
  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/conversations");
    if (res.ok) {
      setData(await res.json());
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Error al cargar conversaciones");
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendSuccess(false);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: sendPhone, message: sendMessage }),
    });
    if (res.ok) {
      setSendSuccess(true);
      setSendPhone("");
      setSendMessage("");
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Error al enviar");
    }
    setSending(false);
  }

  async function closeConversation(id: string) {
    setClosingId(id);
    await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setClosingId(null);
    fetchData();
  }

  if (loading) return <div className="p-8 text-center text-brand-muted">Cargando...</div>;

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
          <MessageCircle size={40} className="mx-auto text-brand-muted" />
          <h2 className="text-xl font-display font-bold text-white">WhatsApp no activo</h2>
          <p className="text-brand-muted text-sm">{error}</p>
          <a href="/addons" className="inline-block mt-2 px-5 py-2.5 rounded-full bg-brand-kinetic-orange text-black font-bold text-sm">
            Activar Add-on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const usagePercent = Math.min((data.monthlyCount / data.monthlyLimit) * 100, 100);
  const usageColor = usagePercent >= 90 ? "bg-red-400" : usagePercent >= 70 ? "bg-yellow-400" : "bg-brand-growth-neon";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="animate-pop">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">WhatsApp</h1>
        <p className="text-brand-muted mt-1">Conversaciones y mensajes del mes.</p>
      </header>

      {/* Monthly counter */}
      <section className="glass-panel rounded-2xl p-6 space-y-4 animate-pop">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Conversaciones este mes</h2>
            <p className="text-brand-muted text-sm mt-0.5">Incluidas: {data.monthlyLimit}. Excedente: $0.08 c/u.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-display font-bold text-white">{data.monthlyCount}</div>
            <div className="text-xs text-brand-muted">de {data.monthlyLimit} incluidas</div>
          </div>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full transition-all ${usageColor}`} style={{ width: `${usagePercent}%` }} />
        </div>
        {data.monthlyCount > data.monthlyLimit && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <span>Excedente: {data.monthlyCount - data.monthlyLimit} conversaciones · ~${data.extraCost} adicionales</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send new message */}
        <section className="lg:col-span-1 space-y-4 animate-pop">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Send size={20} className="text-brand-kinetic-orange" />
            Nuevo mensaje
          </h2>
          <div className="glass-panel rounded-2xl p-5">
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Telefono (con codigo de pais)</label>
                <input
                  type="tel"
                  required
                  value={sendPhone}
                  onChange={(e) => setSendPhone(e.target.value)}
                  placeholder="591912345678"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Mensaje</label>
                <textarea
                  required
                  rows={4}
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="Hola! Te escribimos desde..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm resize-none"
                />
              </div>
              {sendSuccess && (
                <div className="flex items-center gap-2 text-brand-growth-neon text-sm">
                  <CheckCircle size={15} /> Mensaje enviado correctamente
                </div>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm disabled:opacity-50 transition-all"
              >
                {sending ? "Enviando..." : "Enviar mensaje"}
              </button>
            </form>
          </div>
        </section>

        {/* Active conversations */}
        <section className="lg:col-span-2 space-y-4 animate-pop">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-brand-kinetic-orange" />
            Conversaciones abiertas
            <span className="ml-auto text-sm text-brand-muted font-normal">{data.conversations.length} activas</span>
          </h2>
          <div className="glass-panel rounded-2xl overflow-hidden">
            {data.conversations.length === 0 ? (
              <div className="py-16 text-center text-brand-muted text-sm">
                <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                No hay conversaciones abiertas.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {data.conversations.map((conv) => {
                  const openedDate = new Date(conv.openedAt);
                  const diffH = Math.floor((Date.now() - openedDate.getTime()) / 3600000);
                  const timeLabel = diffH < 1 ? "Hace menos de 1h" : diffH < 24 ? `Hace ${diffH}h` : `Hace ${Math.floor(diffH / 24)}d`;
                  return (
                    <div key={conv.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="w-10 h-10 rounded-full bg-brand-kinetic-orange/15 flex items-center justify-center flex-shrink-0">
                        <Phone size={18} className="text-brand-kinetic-orange" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">{conv.phone}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-brand-muted">{timeLabel}</span>
                          <span className="text-xs text-brand-muted">{conv.messageCount} mensaje{conv.messageCount !== 1 ? "s" : ""}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${conv.type === "business_initiated" ? "bg-blue-400/10 text-blue-400" : "bg-brand-growth-neon/10 text-brand-growth-neon"}`}>
                            {conv.type === "business_initiated" ? "Saliente" : "Entrante"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => closeConversation(conv.id)}
                        disabled={closingId === conv.id}
                        className="p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        title="Cerrar conversacion"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

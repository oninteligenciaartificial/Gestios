"use client";

import { useState, useEffect } from "react";
import { PLAN_META, type PlanType } from "@/lib/plans";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type PaymentRequest = {
  id: string;
  plan: PlanType;
  months: number;
  amountBOB: number;
  reference: string | null;
  notes: string | null;
  status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";
  createdAt: string;
  confirmedAt: string | null;
  organization: { id: string; name: string; slug: string; plan: PlanType; planExpiresAt: string | null };
};

export default function SuperadminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/superadmin/payments");
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "CONFIRMADO" | "RECHAZADO") {
    if (!confirm(`¿${action === "CONFIRMADO" ? "Confirmar" : "Rechazar"} este pago?`)) return;
    setProcessing(id);
    await fetch(`/api/superadmin/payments?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setProcessing(null);
    load();
  }

  const pending = requests.filter(r => r.status === "PENDIENTE");
  const rest = requests.filter(r => r.status !== "PENDIENTE");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Pagos y Suscripciones</h1>
        <p className="text-brand-muted mt-1 text-sm">Confirma los pagos QR para activar planes</p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-brand-muted">Cargando...</div>
      ) : (
        <>
          {/* Pendientes */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-yellow-400" />
              <h2 className="text-sm font-bold text-white">Pendientes ({pending.length})</h2>
            </div>

            {pending.length === 0 ? (
              <div className="glass-panel rounded-2xl py-10 text-center text-brand-muted text-sm">
                No hay solicitudes pendientes
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(r => (
                  <div key={r.id} className="glass-panel rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="text-white font-bold">{r.organization.name}</div>
                        <div className="text-brand-muted text-xs font-mono">{r.organization.slug}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-brand-kinetic-orange font-display font-bold text-xl">
                          Bs. {Number(r.amountBOB).toLocaleString("es-BO")}
                        </div>
                        <div className="text-brand-muted text-xs">{PLAN_META[r.plan].label} · {r.months} mes{r.months > 1 ? "es" : ""}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-brand-muted text-xs">Plan actual</span>
                        <div className="text-white">{PLAN_META[r.organization.plan].label}</div>
                      </div>
                      <div>
                        <span className="text-brand-muted text-xs">Vence</span>
                        <div className="text-white">
                          {r.organization.planExpiresAt
                            ? new Date(r.organization.planExpiresAt).toLocaleDateString("es-BO")
                            : "—"}
                        </div>
                      </div>
                      {r.reference && (
                        <div className="col-span-2">
                          <span className="text-brand-muted text-xs">Referencia</span>
                          <div className="text-white font-mono text-sm">{r.reference}</div>
                        </div>
                      )}
                      {r.notes && (
                        <div className="col-span-2">
                          <span className="text-brand-muted text-xs">Notas</span>
                          <div className="text-white/80 text-sm">{r.notes}</div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-brand-muted">
                      Solicitado: {new Date(r.createdAt).toLocaleString("es-BO")}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => handleAction(r.id, "CONFIRMADO")}
                        disabled={processing === r.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-bold text-sm hover:bg-green-500/25 transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Confirmar pago
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "RECHAZADO")}
                        disabled={processing === r.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Historial */}
          {rest.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Historial</h2>
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-4 text-left text-brand-muted font-medium">Tienda</th>
                      <th className="p-4 text-left text-brand-muted font-medium">Plan</th>
                      <th className="p-4 text-left text-brand-muted font-medium">Monto</th>
                      <th className="p-4 text-left text-brand-muted font-medium">Estado</th>
                      <th className="p-4 text-left text-brand-muted font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rest.map(r => (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 text-white">{r.organization.name}</td>
                        <td className="p-4 text-white">{PLAN_META[r.plan].label} · {r.months}m</td>
                        <td className="p-4 text-white font-mono">Bs. {Number(r.amountBOB).toLocaleString("es-BO")}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            r.status === "CONFIRMADO" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                          }`}>
                            {r.status === "CONFIRMADO" ? "Confirmado" : "Rechazado"}
                          </span>
                        </td>
                        <td className="p-4 text-brand-muted text-xs">{new Date(r.createdAt).toLocaleDateString("es-BO")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

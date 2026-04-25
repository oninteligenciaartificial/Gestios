"use client";

import { useState, useEffect } from "react";
import { PLAN_META, PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";
import { Check, Clock, QrCode, Copy } from "lucide-react";

const PLANS: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];
const QR_PHONE = process.env.NEXT_PUBLIC_QR_PHONE ?? "WhatsApp de soporte";
const TIGO_MONEY_NUMBER = process.env.NEXT_PUBLIC_TIGO_NUMBER ?? "";
const QR_IMAGE_URL = process.env.NEXT_PUBLIC_QR_IMAGE_URL ?? "";

type PaymentRequest = {
  id: string;
  plan: PlanType;
  months: number;
  amountBOB: number;
  reference: string | null;
  status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";
  createdAt: string;
};

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("BASICO");
  const [months, setMonths] = useState(1);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [copied, setCopied] = useState(false);

  const pricePerMonth = PLAN_PRICES_BOB[selectedPlan];
  const total = pricePerMonth * months;

  useEffect(() => {
    fetch("/api/payments")
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data : []));
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan, months, reference: reference || undefined, notes: notes || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al enviar solicitud.");
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  }

  function copyNumber() {
    navigator.clipboard.writeText(TIGO_MONEY_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pending = requests.find(r => r.status === "PENDIENTE");
  const hasPending = !!pending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Facturación y Plan</h1>
        <p className="text-brand-muted mt-1 text-sm">Elige tu plan y paga con QR bancario o Tigo Money</p>
      </header>

      {/* Historial de solicitudes */}
      {requests.length > 0 && (
        <section className="glass-panel rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Solicitudes recientes</h2>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white font-medium text-sm">{PLAN_META[r.plan].label} · {r.months} mes{r.months > 1 ? "es" : ""}</span>
                  <span className="text-brand-muted text-xs ml-2">Bs. {Number(r.amountBOB).toLocaleString("es-BO")}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  r.status === "CONFIRMADO" ? "bg-green-500/15 text-green-400" :
                  r.status === "RECHAZADO"  ? "bg-red-500/15 text-red-400" :
                  "bg-yellow-500/15 text-yellow-400"
                }`}>
                  {r.status === "CONFIRMADO" ? "Confirmado" : r.status === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {submitted || hasPending ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Solicitud enviada</h2>
          <p className="text-brand-muted text-sm max-w-md mx-auto">
            Revisaremos tu pago y activaremos tu plan en menos de 24 horas. Te llegará un email de confirmación.
          </p>
          <p className="text-brand-muted text-xs">¿Dudas? Escríbenos al {QR_PHONE}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selector de plan */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Elige tu plan</h2>
              <div className="space-y-2">
                {PLANS.map(plan => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                      selectedPlan === plan
                        ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <span className="text-white font-medium text-sm">{PLAN_META[plan].label}</span>
                      <span className="text-brand-muted text-xs ml-2">Bs. {PLAN_PRICES_BOB[plan].toLocaleString("es-BO")}/mes</span>
                    </div>
                    {selectedPlan === plan && <Check size={16} className="text-brand-kinetic-orange flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Meses a pagar</h2>
              <div className="flex gap-2">
                {[1, 3, 6, 12].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonths(m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                      months === m
                        ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10 text-brand-kinetic-orange"
                        : "border-white/10 text-brand-muted hover:border-white/20"
                    }`}
                  >
                    {m === 1 ? "1 mes" : `${m} meses`}
                  </button>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                <span className="text-brand-muted text-sm">Total a pagar</span>
                <span className="text-2xl font-display font-bold text-brand-kinetic-orange">
                  Bs. {total.toLocaleString("es-BO")}
                </span>
              </div>

              <div>
                <label className="block text-xs text-brand-muted mb-1">Referencia de pago (opcional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Ej: TXN-123456 o número de comprobante"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-brand-muted mb-1">Notas adicionales (opcional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Cualquier detalle adicional..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-kinetic-orange transition-colors resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar solicitud de pago"}
              </button>
            </div>
          </form>

          {/* Instrucciones de pago */}
          <div className="space-y-5">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-brand-kinetic-orange" />
                <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Cómo pagar</h2>
              </div>

              <ol className="space-y-3 text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Abre tu app bancaria o Tigo Money y escanea el QR de abajo, o transfiere al número indicado.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Transfiere exactamente <strong className="text-brand-kinetic-orange">Bs. {total.toLocaleString("es-BO")}</strong> con el concepto <strong>GestiOS Plan {PLAN_META[selectedPlan].label}</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Llena el formulario y haz clic en "Enviar solicitud". Confirmaremos en menos de 24 horas.</span>
                </li>
              </ol>

              {TIGO_MONEY_NUMBER && (
                <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-brand-muted mb-0.5">Tigo Money / número de cuenta</div>
                    <div className="text-white font-mono font-bold">{TIGO_MONEY_NUMBER}</div>
                  </div>
                  <button onClick={copyNumber} className="text-brand-kinetic-orange text-xs flex items-center gap-1 hover:underline">
                    <Copy size={12} /> {copied ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              )}
            </div>

            {/* Card de pago OnIA */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
              {/* Header OnIA */}
              <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <img src="/LOGO ONIA.jpeg" alt="OnIA" className="h-8 object-contain" />
                <span className="text-xs text-gray-400 font-medium">Banco Ganadero S.A.</span>
              </div>

              {/* QR — crop solo el código, ocultar header/footer del banco */}
              <div className="bg-white flex items-center justify-center px-6 py-2 overflow-hidden">
                <div className="relative w-56 overflow-hidden" style={{ height: "224px" }}>
                  <img
                    src="/QR GANADERO GESTIOS.jpeg"
                    alt="QR de pago"
                    className="absolute w-full"
                    style={{ top: "-18%", transform: "scale(1.05)" }}
                  />
                </div>
              </div>

              {/* Datos de cuenta */}
              <div className="bg-white px-5 py-4 border-t border-gray-100 space-y-1 text-center">
                <p className="text-gray-800 font-bold text-sm">Urcullo Montenegro Ruddy</p>
                <p className="text-gray-500 text-xs">Cuenta <span className="font-mono font-bold text-gray-700">1311455296</span></p>
                <p className="text-gray-400 text-xs">GestiOS Suscripción · QR Interbancario Bolivia</p>
              </div>
            </div>

            <p className="text-xs text-brand-muted text-center">
              ¿Preguntas? Escríbenos al {QR_PHONE}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

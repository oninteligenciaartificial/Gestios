"use client";

import { useState, useEffect } from "react";
import { PLAN_META, PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";
import { Check, Clock, QrCode, Copy, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

const PLANS: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];
const WA_NUMBER = "59175470140";

const PLAN_WA_MSG: Record<PlanType, (org: string, months: number, total: number) => string> = {
  BASICO:      (org, m, t) => `Hola! Quiero contratar el *Plan Básico* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Básico ($39/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
  CRECER:      (org, m, t) => `Hola! Quiero contratar el *Plan Crecer* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Crecer ($59/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
  PRO:         (org, m, t) => `Hola! Quiero contratar el *Plan Pro* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Pro ($89/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
  EMPRESARIAL: (org, m, t) => `Hola! Quiero contratar el *Plan Empresarial* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Empresarial ($139/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
};

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
  const [orgName, setOrgName] = useState("mi tienda");
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const pricePerMonth = PLAN_PRICES_BOB[selectedPlan];
  const total = pricePerMonth * months;

  useEffect(() => {
    fetch("/api/payments")
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data : []));
    fetch("/api/me")
      .then(r => r.json())
      .then(data => { if (data.organization?.name) setOrgName(data.organization.name); });
  }, []);

  function openWhatsApp() {
    const msg = PLAN_WA_MSG[selectedPlan](orgName, months, total);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function copyNumber() {
    navigator.clipboard.writeText("1311455296");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pending = requests.find(r => r.status === "PENDIENTE");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Facturación y Plan</h1>
        <p className="text-brand-muted mt-1 text-sm">Elige tu plan y coordina el pago por WhatsApp</p>
      </header>

      {/* Solicitudes — colapsable */}
      {requests.length > 0 && (
        <section className="glass-panel rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Solicitudes recientes</span>
              {pending && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                  1 pendiente
                </span>
              )}
            </div>
            {showHistory ? <ChevronUp size={16} className="text-brand-muted" /> : <ChevronDown size={16} className="text-brand-muted" />}
          </button>

          {showHistory && (
            <div className="px-5 pb-5 space-y-2 border-t border-white/5">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-white font-medium text-sm">{PLAN_META[r.plan].label} · {r.months} mes{r.months > 1 ? "es" : ""}</span>
                    <span className="text-brand-muted text-xs ml-2">Bs. {Number(r.amountBOB).toLocaleString("es-BO")}</span>
                    <div className="text-brand-muted text-xs">{new Date(r.createdAt).toLocaleDateString("es-BO")}</div>
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
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selector de plan */}
        <div className="space-y-5">
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
                  {m === 1 ? "1 mes" : `${m}m`}
                </button>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
              <span className="text-brand-muted text-sm">Total a pagar</span>
              <span className="text-2xl font-display font-bold text-brand-kinetic-orange">
                Bs. {total.toLocaleString("es-BO")}
              </span>
            </div>

            <button
              onClick={openWhatsApp}
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)] hover:shadow-[0_0_30px_rgba(37,211,102,0.4)]"
            >
              <MessageCircle size={18} /> Solicitar Plan {PLAN_META[selectedPlan].label} por WhatsApp
            </button>
            <p className="text-xs text-brand-muted text-center">
              Se abrirá WhatsApp con un mensaje listo para enviar
            </p>
          </div>
        </div>

        {/* Instrucciones + QR */}
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-brand-kinetic-orange" />
              <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Cómo pagar</h2>
            </div>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Haz clic en "Solicitar por WhatsApp" — el mensaje ya viene listo con tu plan y monto.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Escanea el QR o transfiere a la cuenta de abajo exactamente <strong className="text-brand-kinetic-orange">Bs. {total.toLocaleString("es-BO")}</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Mándanos el comprobante por WhatsApp. Activamos tu plan en menos de 24 horas.</span>
              </li>
            </ol>

            <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-brand-muted mb-0.5">N° de cuenta · Banco Ganadero</div>
                <div className="text-white font-mono font-bold">1311455296</div>
                <div className="text-xs text-brand-muted">Urcullo Montenegro Ruddy</div>
              </div>
              <button onClick={copyNumber} className="text-brand-kinetic-orange text-xs flex items-center gap-1 hover:underline">
                <Copy size={12} /> {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Card QR OnIA */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
            <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <img src="/LOGO ONIA.jpeg" alt="OnIA" className="h-8 object-contain" />
              <span className="text-xs text-gray-400 font-medium">Banco Ganadero S.A.</span>
            </div>
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
            <div className="bg-white px-5 py-4 border-t border-gray-100 space-y-1 text-center">
              <p className="text-gray-800 font-bold text-sm">Urcullo Montenegro Ruddy</p>
              <p className="text-gray-500 text-xs">Cuenta <span className="font-mono font-bold text-gray-700">1311455296</span></p>
              <p className="text-gray-400 text-xs">GestiOS Suscripción · QR Interbancario Bolivia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

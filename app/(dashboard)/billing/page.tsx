"use client";

import { useState, useEffect } from "react";
import { PLAN_META, PLAN_PRICES_BOB, ADDON_META, type PlanType } from "@/lib/plans";
import { isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { Check, QrCode, Copy, MessageCircle, ChevronDown, ChevronUp, Trash2, Zap, X, Building2 } from "lucide-react";

const PLANS: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];
const ALL_ADDONS = ["WHATSAPP", "QR_BOLIVIA", "ECOMMERCE", "CONTABILIDAD", "INVENTARIO_AVANZADO"] as const;
type AddonType = typeof ALL_ADDONS[number];
const WA_NUMBER = "59175470140";
const BANK_DATA = {
  account: "701-51726678-3-55",
  bank: "BCP Bolivia",
  owner: "Urcullo Mercado Sergio",
} as const;

type Feat = { label: string; plans: PlanType[] };
const A: PlanType[] = ["BASICO","CRECER","PRO","EMPRESARIAL"];
const B: PlanType[] = ["CRECER","PRO","EMPRESARIAL"];
const C: PlanType[] = ["PRO","EMPRESARIAL"];
const D: PlanType[] = ["EMPRESARIAL"];
const ALL_FEATURES: Feat[] = [
  { label: "Dashboard", plans: A }, { label: "Punto de Venta", plans: A },
  { label: "Inventario", plans: A }, { label: "Pedidos", plans: A },
  { label: "Clientes", plans: A }, { label: "Corte de Caja", plans: A }, { label: "Categorías", plans: A },
  { label: "Variantes de productos", plans: B }, { label: "Descuentos ilimitados", plans: B },
  { label: "Reportes avanzados", plans: B }, { label: "Proveedores", plans: B },
  { label: "Import/Export CSV", plans: B }, { label: "Vencimientos", plans: B },
  { label: "Tienda Online", plans: C }, { label: "Registro Público", plans: C },
  { label: "Pagos QR Bolivia", plans: C }, { label: "Email marketing", plans: C }, { label: "Garantías", plans: C },
  { label: "Sucursales múltiples", plans: D }, { label: "Auditoría (Audit Log)", plans: D },
  { label: "Roles avanzados", plans: D },
];

const DENTAL_FEATURES: Feat[] = [
  { label: "Dashboard operativo dental", plans: A },
  { label: "Notificaciones", plans: A },
  { label: "Inventario Dental", plans: A },
  { label: "Areas de Insumos", plans: A },
  { label: "Configuracion", plans: A },
  { label: "Ayuda y Soporte", plans: A },
  { label: "Proveedores Dentales", plans: B },
  { label: "Ordenes de Compra", plans: B },
  { label: "Vencimientos de insumos", plans: B },
  { label: "Import/Export CSV de insumos", plans: B },
  { label: "Insumos ilimitados", plans: C },
  { label: "Plan y Pagos", plans: A },
  { label: "Soporte prioritario", plans: D },
];

const ADDON_WA_MSG: Record<AddonType, string> = {
  WHATSAPP:    `Hola! Me interesa activar el add-on *WhatsApp Business* (${ADDON_META.WHATSAPP.price}) en GestiOS. ¿Cómo procedo?`,
  QR_BOLIVIA:  `Hola! Quiero activar el add-on de *Pagos QR Bolivia* (${ADDON_META.QR_BOLIVIA.price}) en GestiOS. ¿Cómo procedo?`,
  ECOMMERCE:   `Hola! Me interesa el add-on de *E-commerce* (${ADDON_META.ECOMMERCE.price}) en GestiOS. ¿Cómo procedo?`,
  CONTABILIDAD:`Hola! Quiero activar la *Exportación Contable* (${ADDON_META.CONTABILIDAD.price}) en GestiOS. ¿Cómo procedo?`,
  INVENTARIO_AVANZADO:`Hola! Quiero activar *Inventario Avanzado* (${ADDON_META.INVENTARIO_AVANZADO.price}) en GestiOS. Como procedo?`,
};

const MONTH_DISCOUNT: Record<number, number> = { 1: 0, 3: 5, 6: 10, 12: 15 };

function calcTotal(pricePerMonth: number, months: number): number {
  const discount = MONTH_DISCOUNT[months] ?? 0;
  return Math.round(pricePerMonth * months * (1 - discount / 100));
}

function planWaMsg(plan: PlanType, org: string, m: number, t: number, dentalMode: boolean) {
  const scope = dentalMode ? `modulo operativo DentalGest de *${org}*` : `tienda *${org}*`;
  return `Hola! Quiero contratar el *Plan ${PLAN_META[plan].label}* de GestiOS para mi ${scope}.\n\nPlan: ${PLAN_META[plan].label} (Bs. ${PLAN_PRICES_BOB[plan]}/mes)\nMeses: ${m}\nTotal: Bs. ${t}\n\nPor favor confirmen mi pago.`;
}

type PaymentRequest = { id: string; plan: PlanType; months: number; amountBOB: number; reference: string | null; status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO"; createdAt: string };
type QrData = { qrPayload: string; qrImageUrl?: string; expiresAt: string; qrPaymentId: string; amountBOB: number };
type TransferData = { reference: string; amount: number; instructions: { bank: string; account: string; owner: string } };

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("BASICO");
  const [months, setMonths] = useState(1);
  const [orgName, setOrgName] = useState("mi tienda");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [addons, setAddons] = useState<{ addon: AddonType; active: boolean }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [qrStatus, setQrStatus] = useState<"pending" | "paid" | "expired" | "error">("pending");
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrAddonMode, setQrAddonMode] = useState<"nit" | "no-nit" | null>(null);
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const [qrImageUploading, setQrImageUploading] = useState(false);
  const [qrImageUploaded, setQrImageUploaded] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [paymentNoticeLoading, setPaymentNoticeLoading] = useState(false);
  const [transferSent, setTransferSent] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pricePerMonth = PLAN_PRICES_BOB[selectedPlan];
  const discount = MONTH_DISCOUNT[months] ?? 0;
  const total = calcTotal(pricePerMonth, months);
  const isDentalMode = isDentalGestOperationalMode(businessType);
  const comparisonFeatures = isDentalMode ? DENTAL_FEATURES : ALL_FEATURES;

  useEffect(() => {
    fetch("/api/payments")
      .then(r => r.json())
      .then((data: unknown) => setRequests(Array.isArray(data) ? (data as PaymentRequest[]) : []));
    fetch("/api/me")
      .then(r => r.json())
      .then((data: unknown) => {
        if (data && typeof data === "object" && "organization" in data) {
          const org = (data as { organization?: { name?: string; businessType?: string } }).organization;
          if (org?.name) setOrgName(org.name);
          setBusinessType(org?.businessType ?? "GENERAL");
        } else {
          setBusinessType("GENERAL");
        }
      })
      .catch(() => setBusinessType("GENERAL"));
  }, []);

  useEffect(() => {
    if (businessType === null) return;
    if (isDentalGestOperationalMode(businessType)) {
      setAddons([]);
      return;
    }

    fetch("/api/addons")
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => setAddons(Array.isArray(data) ? (data as { addon: AddonType; active: boolean }[]) : []))
      .catch(() => {});
  }, [businessType]);

  function openWhatsApp() {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(planWaMsg(selectedPlan, orgName, months, total, isDentalMode))}`, "_blank");
  }

  async function cancelRequest(id: string) {
    setCancelling(id);
    await fetch(`/api/payments?id=${id}`, { method: "DELETE" });
    const data = await fetch("/api/payments").then(r => r.json()) as unknown;
    setRequests(Array.isArray(data) ? (data as PaymentRequest[]) : []);
    setCancelling(null);
  }

  async function pollQrStatus(qrPaymentId: string) {
    const maxAttempts = 30;
    let attempts = 0;
    const poll = async () => {
      if (attempts >= maxAttempts) { setQrStatus("expired"); return; }
      attempts++;
      try {
        const res = await fetch(`/api/billing/qr?qrPaymentId=${qrPaymentId}`);
        const data = await res.json() as { status?: string };
        if (data.status === "PAGADO") {
          setQrStatus("paid");
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        if (data.status === "EXPIRADO" || data.status === "CANCELADO") {
          setQrStatus("expired");
          return;
        }
      } catch { /* continue polling */ }
      setTimeout(poll, 5000);
    };
    poll();
  }

  async function generateQrPayment() {
    setGeneratingQr(true);
    setQrStatus("pending");
    try {
      const res = await fetch("/api/billing/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, months }),
      });
      const data = await res.json() as {
        qrAvailable?: boolean;
        qrPayload?: string;
        qrImageUrl?: string;
        expiresAt?: string;
        qrPaymentId?: string;
        amountBOB?: number;
      };
      if (res.ok && data.qrAvailable) {
        setQrData({
          qrPayload: data.qrPayload!,
          qrImageUrl: data.qrImageUrl,
          expiresAt: data.expiresAt!,
          qrPaymentId: data.qrPaymentId!,
          amountBOB: data.amountBOB!,
        });
        pollQrStatus(data.qrPaymentId!);
      } else {
        setQrStatus("error");
      }
    } catch {
      setQrStatus("error");
    } finally {
      setGeneratingQr(false);
    }
  }

  function handleQrImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setQrImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setQrImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadQrImage() {
    if (!qrImageFile) return;
    setQrImageUploading(true);
    const formData = new FormData();
    formData.append("file", qrImageFile);
    formData.append("type", "qr-bolivia");
    try {
      const res = await fetch("/api/addons/qr-bolivia/upload", { method: "POST", body: formData });
      if (res.ok) { setQrImageUploaded(true); setQrAddonMode(null); }
    } catch { /* silent */ } finally {
      setQrImageUploading(false);
    }
  }

  const pending = requests.find(r => r.status === "PENDIENTE");

  async function startBankTransfer() {
    if (pending) {
      setTransferData({
        reference: pending.reference ?? "",
        amount: Number(pending.amountBOB),
        instructions: BANK_DATA,
      });
      setTransferSent(false);
      setTransferModal(true);
      return;
    }
    setTransferLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, months }),
      });
      const data = await res.json() as {
        success?: boolean;
        reference?: string;
        amount?: number;
        instructions?: { bank: string; account: string; owner: string };
        error?: string;
      };
      if (!res.ok || !data.success) {
        alert(data.error ?? "Error al generar referencia");
        return;
      }
      setTransferData({ reference: data.reference!, amount: data.amount!, instructions: data.instructions! });
      setTransferSent(false);
      setTransferModal(true);
      const updated = await fetch("/api/payments").then(r => r.json()) as unknown;
      setRequests(Array.isArray(updated) ? (updated as PaymentRequest[]) : []);
    } catch {
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setTransferLoading(false);
    }
  }

  async function generatePendingReference() {
    if (!pending) return;
    setReferenceLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pending.id }),
      });
      const data = await res.json() as PaymentRequest | { error?: string };
      if (!res.ok || !("reference" in data)) {
        alert("No se pudo generar la referencia. Intenta nuevamente.");
        return;
      }

      setTransferData({
        reference: data.reference ?? "",
        amount: Number(data.amountBOB),
        instructions: BANK_DATA,
      });
      const updated = await fetch("/api/payments").then(r => r.json()) as unknown;
      setRequests(Array.isArray(updated) ? (updated as PaymentRequest[]) : []);
    } catch {
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setReferenceLoading(false);
    }
  }

  async function confirmTransferPayment() {
    if (!pending || !transferReference) return;
    setPaymentNoticeLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pending.id, action: "notify_paid" }),
      });
      if (!res.ok) {
        alert("No se pudo enviar el aviso de pago. Intenta nuevamente.");
        return;
      }
      setTransferSent(true);
    } catch {
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setPaymentNoticeLoading(false);
    }
  }

  function copyField(value: string, key: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const transferInstructions = transferData?.instructions ?? BANK_DATA;
  const transferReference = transferData?.reference?.trim() ?? "";
  const canConfirmTransfer = Boolean(transferReference);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Facturación y Plan</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {isDentalMode
              ? "Gestiona el plan comercial y pagos del modulo operativo DentalGest."
              : "Elige tu plan y paga por transferencia BCP con referencia"}
          </p>
        </div>
      </header>

      {isDentalMode && (
        <div className="glass-panel rounded-2xl p-4 border border-cyan-400/20 bg-cyan-400/5">
          <p className="text-sm font-bold text-white">plan operativo: dentalgest</p>
          <p className="text-sm text-brand-muted mt-1">
            DentalGest no cambia tu plan comercial. GestiOS solo gestiona inventario dental, proveedores,
            compras, vencimientos y operacion administrativa.
          </p>
        </div>
      )}

      {/* Pending payment alert */}
      {pending && (
        <div className="glass-panel rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
            <span className="text-sm text-yellow-300">
              Tienes una solicitud de pago pendiente de verificación.
            </span>
          </div>
          <button
            onClick={startBankTransfer}
            className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold hover:bg-yellow-500/20 transition-colors"
          >
            Ver datos para pagar
          </button>
        </div>
      )}

      {/* Row 1: Plan selector + comparison table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: plan selector + months + total + payment buttons */}
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
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all relative ${
                    months === m
                      ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10 text-brand-kinetic-orange"
                      : "border-white/10 text-brand-muted hover:border-white/20"
                  }`}
                >
                  {m === 1 ? "1 mes" : `${m}m`}
                  {MONTH_DISCOUNT[m] > 0 && (
                    <span className="absolute -top-2 -right-1 text-[9px] font-bold bg-brand-growth-neon text-black px-1 rounded-full">
                      -{MONTH_DISCOUNT[m]}%
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-brand-muted text-sm">Total a pagar</span>
                {discount > 0 && (
                  <div className="text-xs text-brand-growth-neon mt-0.5">
                    Ahorras Bs. {(pricePerMonth * months - total).toLocaleString("es-BO")} ({discount}% off)
                  </div>
                )}
              </div>
              <span className="text-2xl font-display font-bold text-brand-kinetic-orange">
                Bs. {total.toLocaleString("es-BO")}
              </span>
            </div>

            <button
              onClick={openWhatsApp}
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)] hover:shadow-[0_0_30px_rgba(37,211,102,0.4)]"
            >
              <MessageCircle size={18} /> Consultar Plan {PLAN_META[selectedPlan].label} por WhatsApp
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-brand-muted">QR automatico con PSP</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={generateQrPayment}
              disabled={true || generatingQr}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-brand-muted font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-not-allowed"
            >
              <QrCode size={18} /> QR automatico requiere proveedor configurado
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-brand-muted">o transferencia bancaria</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={startBankTransfer}
              disabled={transferLoading}
              className="w-full py-3 rounded-xl border border-white/15 hover:border-white/30 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Building2 size={18} />
              {transferLoading ? "Generando referencia..." : `Pagar Bs. ${total.toLocaleString("es-BO")} por transferencia`}
            </button>
            <p className="text-xs text-brand-muted text-center">
              Transferencia BCP con referencia · activacion automatica si llega la confirmacion bancaria
            </p>
          </div>

          {/* QR Payment Status */}
          {qrData && qrStatus === "pending" && (
            <div className="glass-panel rounded-2xl p-5 space-y-4 text-center">
              <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Escanea el QR para pagar</h3>
              {qrData.qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrData.qrImageUrl} alt="QR de pago" className="w-48 h-48 mx-auto rounded-xl" />
              ) : (
                <div className="w-48 h-48 mx-auto rounded-xl bg-white/5 flex items-center justify-center">
                  <QrCode size={48} className="text-brand-muted" />
                </div>
              )}
              <p className="text-xs text-brand-muted">Escanea con tu app bancaria. El plan se activará automáticamente.</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs text-yellow-400">Esperando pago...</span>
              </div>
            </div>
          )}

          {qrStatus === "paid" && (
            <div className="glass-panel rounded-2xl p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto"><Check size={24} className="text-green-400" /></div>
              <h3 className="text-lg font-bold text-white">Pago confirmado!</h3>
              <p className="text-sm text-brand-muted">Tu plan {PLAN_META[selectedPlan].label} fue activado. Recargando...</p>
            </div>
          )}
          {qrStatus === "expired" && (
            <div className="glass-panel rounded-2xl p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto"><X size={24} className="text-red-400" /></div>
              <h3 className="text-lg font-bold text-white">QR expirado</h3>
              <p className="text-sm text-brand-muted">El tiempo de pago venció. Intenta nuevamente.</p>
              <button onClick={() => { setQrData(null); setQrStatus("pending"); }} className="text-brand-kinetic-orange text-sm font-bold">Generar nuevo QR</button>
            </div>
          )}
          {qrStatus === "error" && (
            <div className="glass-panel rounded-2xl p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto"><X size={24} className="text-red-400" /></div>
              <h3 className="text-lg font-bold text-white">Error al generar QR</h3>
              <p className="text-sm text-brand-muted">No se pudo generar el QR. Usa transferencia BCP con referencia.</p>
              <button onClick={() => setQrStatus("pending")} className="text-brand-kinetic-orange text-sm font-bold">Intentar nuevamente</button>
            </div>
          )}
        </div>

        {/* Right: Feature comparison table (always visible) */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Comparar planes</span>
          </div>
          <div className="px-5 pb-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-2 text-brand-muted font-medium">Funcion</th>
                    {PLANS.map(p => (
                      <th key={p} className={`text-center py-3 px-2 font-bold text-xs ${PLAN_META[p].color}`}>
                        {PLAN_META[p].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feat, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 px-2 text-white">{feat.label}</td>
                      {PLANS.map(p => (
                        <td key={p} className="text-center py-2.5 px-2">
                          {feat.plans.includes(p) ? (
                            <Check size={14} className="text-brand-growth-neon mx-auto" />
                          ) : (
                            <X size={14} className="text-white/20 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Payment history */}
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
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      r.status === "CONFIRMADO" ? "bg-green-500/15 text-green-400" :
                      r.status === "RECHAZADO"  ? "bg-red-500/15 text-red-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {r.status === "CONFIRMADO" ? "Confirmado" : r.status === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                    </span>
                    {r.status === "PENDIENTE" && (
                      <button
                        onClick={() => cancelRequest(r.id)}
                        disabled={cancelling === r.id}
                        className="text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Cancelar solicitud"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Row 4: Add-ons */}
      {!isDentalMode && (
        <section className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-brand-kinetic-orange" />
          <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Add-ons disponibles</h2>
        </div>
        <div className="divide-y divide-white/5">
          {ALL_ADDONS.map(addon => {
            const meta = ADDON_META[addon];
            const active = addons.some(a => a.addon === addon && a.active);
            const isQrBolivia = addon === "QR_BOLIVIA";

            return (
              <div key={addon} className="py-3 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${active ? "bg-brand-kinetic-orange/15" : "bg-white/5"}`}>
                      <Zap size={14} className={active ? "text-brand-kinetic-orange" : "text-brand-muted"} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{meta.label}</span>
                        {meta.comingSoon && addon !== "QR_BOLIVIA" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 text-[10px] font-bold">Próximamente</span>
                        )}
                      </div>
                      <span className="text-brand-kinetic-orange text-xs">{meta.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      meta.comingSoon && addon !== "QR_BOLIVIA" ? "bg-white/5 text-white/25"
                        : active ? "bg-green-500/15 text-green-400"
                        : "bg-white/5 text-brand-muted"
                    }`}>
                      {meta.comingSoon && addon !== "QR_BOLIVIA" ? <><X size={11} /> Pronto</> : active ? <><Check size={11} /> Activo</> : <><X size={11} /> Inactivo</>}
                    </span>
                    {!meta.comingSoon && !active && addon !== "QR_BOLIVIA" && (
                      <button
                        onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ADDON_WA_MSG[addon])}`, "_blank")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                      >
                        <MessageCircle size={11} /> Solicitar
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Bolivia special flow */}
                {isQrBolivia && !active && (
                  <div className="mt-3 ml-10 space-y-3">
                    {qrAddonMode === null && (
                      <div className="space-y-2">
                        <p className="text-xs text-brand-muted">¿Cómo querés recibir pagos QR de tus clientes?</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setQrAddonMode("nit")}
                            className="px-4 py-2 rounded-xl border border-brand-kinetic-orange/30 bg-brand-kinetic-orange/10 text-brand-kinetic-orange text-xs font-bold hover:bg-brand-kinetic-orange/20 transition-all"
                          >
                            Tengo NIT
                          </button>
                          <button
                            onClick={() => setQrAddonMode("no-nit")}
                            className="px-4 py-2 rounded-xl border border-white/10 text-brand-muted text-xs font-bold hover:border-white/30 hover:text-white transition-all"
                          >
                            No tengo NIT
                          </button>
                        </div>
                      </div>
                    )}

                    {qrAddonMode === "nit" && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <MessageCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-white font-medium">QR Bolivia con NIT</p>
                            <p className="text-xs text-brand-muted mt-1">
                              Si tu negocio tiene NIT, podemos ayudarte a evaluar proveedores QR disponibles en Bolivia.
                              La activacion depende del contrato, API y credenciales del proveedor elegido.
                            </p>
                            <button
                              onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hola! Tengo NIT y quiero activar el addon de Pagos QR Bolivia en GestiOS. ¿Me pueden guiar con las opciones disponibles?")}`, "_blank")}
                              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20b858] transition-all"
                            >
                              <MessageCircle size={12} /> Contactar Soporte
                            </button>
                          </div>
                        </div>
                        <button onClick={() => setQrAddonMode(null)} className="text-xs text-brand-muted hover:text-white transition-colors">
                          ← Volver
                        </button>
                      </div>
                    )}

                    {qrAddonMode === "no-nit" && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <QrCode size={16} className="text-brand-kinetic-orange flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-white font-medium">QR Personal (sin NIT)</p>
                            <p className="text-xs text-brand-muted mt-1">
                              Subí la imagen del QR de tu cuenta bancaria. Tus clientes lo verán en el POS para escanear y pagar.
                            </p>
                          </div>
                        </div>

                        {!qrImageUploaded && (
                          <>
                            <label className="block w-full border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-brand-kinetic-orange/30 transition-colors">
                              <input type="file" accept="image/*" onChange={handleQrImageSelect} className="hidden" />
                              {qrImagePreview ? (
                                <div className="space-y-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={qrImagePreview} alt="QR preview" className="w-32 h-32 mx-auto rounded-lg object-contain bg-white p-2" />
                                  <p className="text-xs text-brand-muted">Cambiar imagen</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <QrCode size={32} className="mx-auto text-brand-muted" />
                                  <p className="text-xs text-brand-muted">Click para subir tu QR</p>
                                  <p className="text-[10px] text-white/30">PNG, JPG — máx 5MB</p>
                                </div>
                              )}
                            </label>

                            {qrImageFile && (
                              <button
                                onClick={uploadQrImage}
                                disabled={qrImageUploading}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm disabled:opacity-50"
                              >
                                {qrImageUploading ? "Subiendo..." : "Guardar QR"}
                              </button>
                            )}
                          </>
                        )}

                        {qrImageUploaded && (
                          <div className="flex items-center gap-2 text-brand-growth-neon text-sm">
                            <Check size={14} /> QR guardado correctamente
                          </div>
                        )}

                        <button
                          onClick={() => { setQrAddonMode(null); setQrImageFile(null); setQrImagePreview(null); }}
                          className="text-xs text-brand-muted hover:text-white transition-colors"
                        >
                          ← Volver
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </section>
      )}

      {/* Bank Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Datos de transferencia</h2>
              <button onClick={() => setTransferModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {!transferSent ? (
              <>
                <div className="text-center py-2">
                  <span className="text-4xl font-display font-bold text-brand-kinetic-orange">
                    Bs. {(transferData?.amount ?? total).toLocaleString("es-BO")}
                  </span>
                </div>

                <ol className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                    <span>Copia el monto exacto y transfiere a la cuenta BCP.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <span>Copia la referencia y pegala completa en la glosa o detalle de la transferencia.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <span>Si la referencia llega exacta, el plan se activa automaticamente. Si falta o esta distinta, lo revisamos manualmente y puede tardar mas.</span>
                  </li>
                </ol>

                <div className="space-y-3">
                  {([["Banco","bank",transferInstructions.bank],["Nro. de cuenta","account",transferInstructions.account],["Titular","owner",transferInstructions.owner]] as [string,string,string][]).map(([label,key,value]) => (
                    <div key={key} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div><p className="text-xs text-brand-muted">{label}</p><p className="text-white font-medium text-sm">{value}</p></div>
                      <button onClick={() => copyField(value, key)} className="ml-3 text-brand-muted hover:text-white transition-colors flex-shrink-0" title="Copiar">
                        {copiedField === key ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  ))}

                  <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-400/70 font-medium uppercase tracking-wider">Referencia (obligatoria)</p>
                        {transferReference ? (
                          <p className="text-yellow-300 font-mono font-bold text-sm mt-0.5">{transferReference}</p>
                        ) : (
                          <p className="text-yellow-300/70 text-sm mt-0.5">Genera tu referencia antes de pagar.</p>
                        )}
                      </div>
                      {transferReference ? (
                        <button
                          onClick={() => copyField(transferReference, "reference")}
                          className="ml-3 text-yellow-400/70 hover:text-yellow-300 transition-colors flex-shrink-0"
                          title="Copiar referencia"
                        >
                          {copiedField === "reference" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                      ) : (
                        <button
                          onClick={generatePendingReference}
                          disabled={referenceLoading || !pending}
                          className="ml-3 px-3 py-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-bold hover:bg-yellow-400/25 disabled:opacity-50 transition-colors"
                        >
                          {referenceLoading ? "Generando..." : "Generar"}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-yellow-400/60 mt-2">
                      Esta referencia es obligatoria para la activacion automatica.
                    </p>
                  </div>
                </div>

                <button
                  onClick={confirmTransferPayment}
                  disabled={!canConfirmTransfer || paymentNoticeLoading}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!canConfirmTransfer
                    ? "Genera la referencia primero"
                    : paymentNoticeLoading
                    ? "Enviando aviso..."
                    : "Ya realicé el pago"}
                </button>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                  <Check size={28} className="text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">¡Gracias!</h3>
                <p className="text-sm text-brand-muted">
                  Tu pago está siendo verificado. Te notificaremos en 24-48h cuando tu plan sea activado.
                </p>
                <button onClick={() => setTransferModal(false)} className="text-brand-kinetic-orange text-sm font-bold">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

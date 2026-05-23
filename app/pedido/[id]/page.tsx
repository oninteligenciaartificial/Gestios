import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle, Clock, Package, Truck, XCircle, ShoppingBag } from "lucide-react";

interface OrderItem {
  quantity: number;
  unitPrice: string;
  product: { name: string };
  variantSnapshot: Record<string, string> | null;
}

interface Order {
  id: string;
  customerName: string;
  status: string;
  paymentMethod: string;
  total: string;
  shippingAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  organization: { name: string; slug: string };
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  PENDIENTE:   { label: "Pendiente",   color: "text-yellow-400", icon: <Clock size={20} />,       step: 1 },
  CONFIRMADO:  { label: "Confirmado",  color: "text-blue-400",   icon: <CheckCircle size={20} />,  step: 2 },
  ENVIADO:     { label: "Enviado",     color: "text-purple-400", icon: <Truck size={20} />,        step: 3 },
  ENTREGADO:   { label: "Entregado",   color: "text-green-400",  icon: <Package size={20} />,      step: 4 },
  CANCELADO:   { label: "Cancelado",   color: "text-red-400",    icon: <XCircle size={20} />,      step: 0 },
};

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO:      "Efectivo",
  TARJETA:       "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  QR:            "QR",
};

const STEPS = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO"];

const fmt = (n: number) =>
  n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function getOrder(id: string): Promise<Order | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/pedido/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json() as Promise<Order>;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return { title: "Pedido no encontrado" };
  return {
    title: `Pedido #${id.slice(-8).toUpperCase()} — ${order.organization.name}`,
    description: `Seguimiento de pedido de ${order.customerName}`,
  };
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDIENTE;
  const currentStep = config.step;
  const isCancelled = order.status === "CANCELADO";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <ShoppingBag size={22} className="text-[#ff6b00]" />
          <span className="font-bold text-white text-lg">{order.organization.name}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Order header */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500">Pedido</p>
              <p className="text-2xl font-bold text-white font-mono tracking-wider">
                #{id.slice(-8).toUpperCase()}
              </p>
              <p className="text-sm text-gray-400 mt-1">{order.customerName}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 ${config.color}`}>
              {config.icon}
              <span className="font-semibold text-sm">{config.label}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-sm text-gray-400">
            <span>
              <span className="text-gray-600">Pago:</span>{" "}
              <span className="text-white">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
            </span>
            <span>
              <span className="text-gray-600">Fecha:</span>{" "}
              <span className="text-white">
                {new Date(order.createdAt).toLocaleDateString("es-BO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>
        </div>

        {/* Status timeline */}
        {!isCancelled ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-sm font-medium text-gray-400 mb-6">Estado del pedido</h2>
            <div className="relative">
              {/* Progress bar */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-[#ff6b00] transition-all duration-700"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * (100 - 8)}%` }}
              />

              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const done = stepNum <= currentStep;
                  const active = stepNum === currentStep;
                  const sc = STATUS_CONFIG[step];
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 w-16">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          done
                            ? "bg-[#ff6b00] border-[#ff6b00] text-black"
                            : "bg-[#0a0a0a] border-white/20 text-gray-600"
                        } ${active ? "ring-2 ring-[#ff6b00]/30 ring-offset-1 ring-offset-[#0a0a0a]" : ""}`}
                      >
                        {done ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{stepNum}</span>}
                      </div>
                      <span className={`text-xs text-center leading-tight ${done ? "text-white" : "text-gray-600"}`}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 flex items-center gap-3 text-red-400">
            <XCircle size={24} />
            <div>
              <p className="font-semibold">Pedido cancelado</p>
              <p className="text-sm text-red-400/70 mt-0.5">Este pedido fue cancelado.</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Productos</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                  {item.variantSnapshot && Object.keys(item.variantSnapshot).length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Object.entries(item.variantSnapshot)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-sm">
                    Bs. {fmt(item.quantity * Number(item.unitPrice))}
                  </p>
                  <p className="text-xs text-gray-500">{item.quantity} × Bs. {fmt(Number(item.unitPrice))}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-white font-bold text-lg">Bs. {fmt(Number(order.total))}</span>
          </div>
        </div>

        {/* Shipping / notes */}
        {(order.shippingAddress ?? order.notes) && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
            {order.shippingAddress && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Dirección de entrega</p>
                <p className="text-white text-sm">{order.shippingAddress}</p>
              </div>
            )}
            {order.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Notas</p>
                <p className="text-white text-sm">{order.notes}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-600 pb-4">
          Última actualización:{" "}
          {new Date(order.updatedAt).toLocaleString("es-BO", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </main>
    </div>
  );
}

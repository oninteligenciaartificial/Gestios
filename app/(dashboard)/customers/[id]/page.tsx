/* eslint-disable react-hooks/purity, react-hooks/immutability, react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Star, Calendar, ShoppingBag, CreditCard, Banknote, Landmark, ChevronRight, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/currency";

type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";
type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "QR";

interface OrderItem { quantity: number; product: { name: string } }
interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items: OrderItem[];
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  rfc: string | null;
  birthday: string | null;
  notes: string | null;
  loyaltyPoints: number;
  createdAt: string;
  orders: Order[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente", CONFIRMADO: "Confirmado", ENVIADO: "Enviado",
  ENTREGADO: "Entregado", CANCELADO: "Cancelado",
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE: "text-brand-kinetic-orange", CONFIRMADO: "text-blue-400",
  ENVIADO: "text-purple-400", ENTREGADO: "text-brand-growth-neon",
  CANCELADO: "text-red-400",
};
const PM_ICONS: Record<PaymentMethod, React.ReactNode> = {
  EFECTIVO: <Banknote size={14} />, TARJETA: <CreditCard size={14} />,
  TRANSFERENCIA: <Landmark size={14} />, QR: <span className="text-xs font-bold">QR</span>,
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data: Customer) => { setCustomer(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-brand-kinetic-orange" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-brand-muted">
        <p>Cliente no encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-kinetic-orange hover:underline text-sm">Volver</button>
      </div>
    );
  }

  const totalSpent = customer.orders
    .filter((o) => o.status !== "CANCELADO")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-pop">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-white/10 hover:border-white/30 text-brand-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{customer.name}</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            Cliente desde {new Date(customer.createdAt).toLocaleDateString("es-BO", { year: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — info + stats */}
        <div className="space-y-4">
          {/* Contact info */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 animate-pop">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Contacto</h2>
            {customer.phone && (
              <div className="flex items-center gap-3 text-sm text-brand-muted">
                <Phone size={15} className="text-brand-kinetic-orange flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3 text-sm text-brand-muted">
                <Mail size={15} className="text-brand-kinetic-orange flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3 text-sm text-brand-muted">
                <MapPin size={15} className="text-brand-kinetic-orange flex-shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.birthday && (
              <div className="flex items-center gap-3 text-sm text-brand-muted">
                <Calendar size={15} className="text-brand-kinetic-orange flex-shrink-0" />
                <span>{new Date(customer.birthday).toLocaleDateString("es-BO", { day: "2-digit", month: "long" })}</span>
              </div>
            )}
            {customer.rfc && (
              <div className="flex items-center gap-3 text-sm text-brand-muted">
                <span className="text-xs font-bold text-brand-kinetic-orange uppercase">NIT</span>
                <span>{customer.rfc}</span>
              </div>
            )}
            {!customer.phone && !customer.email && !customer.address && (
              <p className="text-brand-muted text-sm">Sin datos de contacto</p>
            )}
          </div>

          {/* Stats */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 animate-pop">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Estadisticas</h2>
            <div className="flex justify-between items-center">
              <span className="text-brand-muted text-sm flex items-center gap-2">
                <ShoppingBag size={14} className="text-brand-kinetic-orange" /> Pedidos
              </span>
              <span className="font-bold text-white">{customer.orders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-muted text-sm">Total gastado</span>
              <span className="font-bold text-brand-growth-neon">{formatMoney(totalSpent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-muted text-sm flex items-center gap-2">
                <Star size={14} className="text-yellow-400" /> Puntos
              </span>
              <span className="font-bold text-yellow-400">{customer.loyaltyPoints.toLocaleString()}</span>
            </div>
            {customer.orders.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-brand-muted text-sm">Ticket promedio</span>
                <span className="font-bold text-white">
                  {formatMoney(totalSpent / customer.orders.filter(o => o.status !== "CANCELADO").length || 0)}
                </span>
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="glass-panel p-5 rounded-2xl animate-pop">
              <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-2">Notas</h2>
              <p className="text-brand-muted text-sm">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — order history */}
        <div className="lg:col-span-2 space-y-4 animate-pop">
          <h2 className="text-xl font-bold text-white">Historial de pedidos</h2>
          {customer.orders.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-brand-muted">
              Sin pedidos registrados
            </div>
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {customer.orders.map((order) => (
                  <a
                    key={order.id}
                    href={`/ventas`}
                    className="py-4 px-5 flex justify-between items-start hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-brand-muted text-xs">
                          {new Date(order.createdAt).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm text-brand-muted truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-white text-sm">{formatMoney(Number(order.total))}</div>
                        <div className="flex items-center justify-end gap-1 text-brand-muted mt-0.5">
                          {PM_ICONS[order.paymentMethod]}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-brand-muted group-hover:text-white transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

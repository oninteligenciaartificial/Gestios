/* eslint-disable react-hooks/purity */
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantProfile } from "@/lib/auth";
import { isDentalGestOperationalMode } from "@/lib/dentalgest-mode";
import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingCart, AlertTriangle, DollarSign, Mail, Plus, PackageSearch, Clock, Truck, Users, BarChart2 } from "lucide-react";
import { StockAlertButton } from "../StockAlertButton";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { SyncButton } from "@/components/dashboard/SyncButton";
import Link from "next/link";

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? "text-brand-growth-neon" : "text-red-400"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default async function Dashboard() {
  const profile = await getTenantProfile();
  if (!profile) {
    // If a SUPERADMIN lands here without impersonating an org, send them
    // to the superadmin panel instead of bouncing them to /login (loop).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const raw = await prisma.profile.findUnique({ where: { userId: user.id } });
      if (raw?.role === "SUPERADMIN") redirect("/superadmin");
      if (!raw) redirect("/setup");
    }
    redirect("/login");
  }

  const orgId = profile.organizationId as string;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  const orgName = org?.name ?? "tu empresa";
  const isDentalMode = isDentalGestOperationalMode(profile.businessType);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  type StockItem = { id: string; name: string; stock: number; minStock: number };
  type ExpiringProduct = { id: string; name: string; batchExpiry: Date | null; stock: number };
  type OrderTotal = { total: { toString(): string } };

  const totalProducts = await prisma.product.count({ where: { organizationId: orgId, active: true } });
  const totalCustomers = isDentalMode ? 0 : await prisma.customer.count({ where: { organizationId: orgId } });
  const allProducts: StockItem[] = await prisma.product.findMany({
    where: { organizationId: orgId, active: true },
    select: { id: true, name: true, stock: true, minStock: true },
    orderBy: { stock: "asc" },
  });
  const expiryLimit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [supplierCount, expiringProducts] = isDentalMode
    ? await Promise.all([
        prisma.supplier.count({ where: { organizationId: orgId } }),
        prisma.product.findMany({
          where: { organizationId: orgId, active: true, batchExpiry: { gte: new Date(), lte: expiryLimit } },
          select: { id: true, name: true, batchExpiry: true, stock: true },
          orderBy: { batchExpiry: "asc" },
          take: 5,
        }) as Promise<ExpiringProduct[]>,
      ])
    : ([0, []] as [number, ExpiringProduct[]]);
  const weeklyOrders = isDentalMode ? 0 : await prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: weekAgo } } });
  const monthlyOrders: OrderTotal[] = isDentalMode ? [] : await prisma.order.findMany({
    where: { organizationId: orgId, createdAt: { gte: monthStart }, status: { not: "CANCELADO" } },
    select: { total: true },
  });

  const monthlyRevenue = monthlyOrders.reduce((sum: number, o: OrderTotal) => sum + Number(o.total), 0);

  type RecentOrder = { id: string; customerName: string; status: string; total: { toString(): string }; createdAt: Date };
  const recentOrders: RecentOrder[] = isDentalMode ? [] : await prisma.order.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, customerName: true, status: true, total: true, createdAt: true },
  });
  const pendingOrders = isDentalMode ? 0 : await prisma.order.count({
    where: { organizationId: orgId, status: "PENDIENTE" },
  });
  const lowStockAlerts = allProducts.filter((p: StockItem) => p.stock <= p.minStock).slice(0, 5);

  // Previous period (days 31-60) for delta comparison
  type RevAgg = { _sum: { total: unknown }; _count: { id: number } };
  const [prevRevAgg, prevWeeklyOrders] = isDentalMode
    ? [{ _sum: { total: 0 }, _count: { id: 0 } }, 0] as [RevAgg, number]
    : await Promise.all([
        prisma.order.aggregate({
          where: { organizationId: orgId, status: { not: "CANCELADO" }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
          _sum: { total: true },
          _count: { id: true },
        }) as Promise<RevAgg>,
        prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), lt: weekAgo } } }),
      ]);

  const prevRevenue = Number(prevRevAgg._sum.total ?? 0);
  const currentRevenue30 = monthlyOrders.reduce((sum: number, o: OrderTotal) => sum + Number(o.total), 0);

  function calcDelta(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  const deltaRevenue = calcDelta(currentRevenue30, prevRevenue);
  const deltaOrders = calcDelta(weeklyOrders, prevWeeklyOrders);

  const isEmpty = isDentalMode ? totalProducts === 0 && supplierCount === 0 : totalProducts === 0 && totalCustomers === 0;

  const kpis = isDentalMode
    ? [
        { title: "Inventario Dental", value: String(totalProducts), label: "Insumos activos", icon: Package, color: "text-brand-kinetic-orange", delta: null as number | null },
        { title: "Stock Critico", value: String(lowStockAlerts.length), label: "Reponer antes de operar", icon: AlertTriangle, color: "text-red-400", delta: null as number | null },
        { title: "Vencen Pronto", value: String(expiringProducts.length), label: "Proximos 30 dias", icon: Clock, color: "text-yellow-300", delta: null as number | null },
        { title: "Proveedores", value: String(supplierCount), label: "Proveedores activos", icon: Truck, color: "text-cyan-300", delta: null as number | null },
      ]
    : [
    { title: "Inventario Total",  value: String(totalProducts),                  label: "SKUs Activos",    icon: Package,       color: "text-brand-kinetic-orange", delta: null as number | null },
    { title: "Pedidos Semana",    value: String(weeklyOrders),                    label: "Últimos 7 días",  icon: ShoppingCart,  color: "text-white",                delta: deltaOrders },
    { title: "Alertas Stock",     value: String(lowStockAlerts.length),           label: "Reabastecer Ya",  icon: AlertTriangle, color: "text-red-400",              delta: null as number | null },
    { title: "Ingresos",          value: `Bs. ${monthlyRevenue.toLocaleString("es-BO", { minimumFractionDigits: 2 })}`, label: "Mensual", icon: DollarSign, color: "text-brand-growth-neon", delta: deltaRevenue },
  ];

  const operationTasks = isDentalMode
    ? [
        {
          title: "Control de insumos",
          metric: lowStockAlerts.length > 0 ? `${lowStockAlerts.length} criticos` : "Sin criticos",
          desc: "Valida insumos criticos antes de iniciar jornada o habilitar consultorios.",
          href: "/inventory",
          cta: "Abrir inventario",
          urgent: lowStockAlerts.length > 0,
          icon: Package,
        },
        {
          title: "Reposicion",
          metric: supplierCount > 0 ? `${supplierCount} proveedores` : "Sin proveedores",
          desc: "Mantiene proveedores dentales listos para compras recurrentes y emergencias de abastecimiento.",
          href: supplierCount > 0 ? "/purchase-orders" : "/suppliers",
          cta: supplierCount > 0 ? "Crear compra" : "Registrar proveedor",
          urgent: supplierCount === 0,
          icon: Truck,
        },
        {
          title: "Vencimientos",
          metric: expiringProducts.length > 0 ? `${expiringProducts.length} por vencer` : "Al dia",
          desc: "Controla lotes por vencer antes de usarlos o mantenerlos disponibles en area clinica.",
          href: "/inventory?vencimientos=1",
          cta: "Ver vencimientos",
          urgent: expiringProducts.length > 0,
          icon: Clock,
        },
      ]
    : [
        {
          title: "Ventas y caja",
          metric: monthlyRevenue > 0 ? `Bs. ${monthlyRevenue.toLocaleString("es-BO", { maximumFractionDigits: 0 })}` : "Sin ventas",
          desc: "Vende desde POS y cierra caja al final del dia.",
          href: "/pos",
          cta: "Abrir POS",
          urgent: monthlyRevenue === 0,
          icon: ShoppingCart,
        },
        {
          title: "Pedidos pendientes",
          metric: pendingOrders > 0 ? `${pendingOrders} pendientes` : "Sin pendientes",
          desc: "Procesa pedidos antes de que se acumulen o pierdan seguimiento.",
          href: "/ventas",
          cta: "Revisar pedidos",
          urgent: pendingOrders > 0,
          icon: Clock,
        },
        {
          title: "Inventario y compras",
          metric: lowStockAlerts.length > 0 ? `${lowStockAlerts.length} bajos` : "Stock estable",
          desc: "Repone productos antes de quedarte sin stock vendible.",
          href: lowStockAlerts.length > 0 ? "/inventory" : "/suppliers",
          cta: lowStockAlerts.length > 0 ? "Reabastecer" : "Ver proveedores",
          urgent: lowStockAlerts.length > 0,
          icon: Package,
        },
        {
          title: "Clientes y reportes",
          metric: totalCustomers > 0 ? `${totalCustomers} clientes` : "Sin clientes",
          desc: "Usa clientes y reportes para vender mejor, no solo registrar ventas.",
          href: totalCustomers > 0 ? "/reports" : "/customers",
          cta: totalCustomers > 0 ? "Ver reportes" : "Crear cliente",
          urgent: totalCustomers === 0,
          icon: totalCustomers > 0 ? BarChart2 : Users,
        },
      ];

  const nextAction = operationTasks.find((task) => task.urgent) ?? operationTasks[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-wrap justify-between items-start gap-3 animate-pop">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {isDentalMode ? "Control administrativo de insumos, compras y vencimientos" : "Visión general de tu tienda"}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-4 flex-shrink-0">
          <SyncButton />
          <Link href={isDentalMode ? "/inventory" : "/orders"} className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all text-sm sm:text-base">
            <Plus size={16} />
            <span>{isDentalMode ? "Insumo" : "Pedido"}</span>
          </Link>
        </div>
      </header>

      {/* First-run welcome banner */}
      {isEmpty && <WelcomeBanner orgName={orgName} orgId={orgId} />}

      <section className="kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="glass-panel p-4 sm:p-6 rounded-2xl animate-pop hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-brand-muted font-medium text-xs sm:text-sm">{kpi.title}</h3>
              <div className={`p-1.5 sm:p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                <kpi.icon size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-display font-bold text-white mb-1">{kpi.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs sm:text-sm text-brand-muted/70">{kpi.label}</span>
              {kpi.delta !== null && (
                <div className="flex items-center gap-1">
                  <Delta pct={kpi.delta} />
                  <span className="text-xs text-brand-muted/50">vs mes ant.</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.8fr] gap-4 sm:gap-6 animate-pop">
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/5">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Rutina operativa de hoy</h2>
            <p className="text-sm text-brand-muted mt-1">
              {isDentalMode
                ? "Control diario para administracion, almacen y responsables de insumos dentales."
                : "Flujo diario para vender, cobrar, reponer y revisar el negocio."}
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {operationTasks.map((task) => (
              <div key={task.title} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${task.urgent ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange" : "bg-white/5 text-brand-growth-neon"}`}>
                  <task.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${task.urgent ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange" : "bg-brand-growth-neon/10 text-brand-growth-neon"}`}>
                      {task.metric}
                    </span>
                  </div>
                  <p className="text-sm text-brand-muted mt-1">{task.desc}</p>
                </div>
                <Link href={task.href} className="px-4 py-2 rounded-xl border border-white/10 text-sm font-bold text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors text-center">
                  {task.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Siguiente mejor accion</p>
            <h2 className="text-2xl font-display font-bold text-white mt-2">{nextAction.title}</h2>
            <p className="text-sm text-brand-muted mt-2">{nextAction.desc}</p>
          </div>
          <Link href={nextAction.href} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.25)] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] transition-all">
            <nextAction.icon size={16} /> {nextAction.cta}
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold text-white animate-pop">
            Alertas de Stock <span className="text-brand-kinetic-orange ml-2">•</span>
          </h2>
          <div className="glass-panel rounded-3xl overflow-hidden animate-pop">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-medium text-brand-muted">Productos con stock bajo</h3>
              <Link href="/inventory" className="text-brand-kinetic-orange text-sm font-bold flex items-center gap-1 hover:underline">
                <PackageSearch size={16} /> Ver Todo
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {lowStockAlerts.length === 0 && (
                <div className="py-8 px-6 text-center text-brand-muted">
                  {isEmpty ? "Carga datos de ejemplo para ver alertas de stock" : "Todo el inventario está en buen nivel"}
                </div>
              )}
              {lowStockAlerts.map((item) => (
                <div key={item.id} className="py-4 px-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-sm text-brand-muted mt-1">
                      Quedan {item.stock} unidades
                      {item.stock <= item.minStock && (
                        <span className="ml-2 text-red-400 font-medium">Crítico</span>
                      )}
                    </div>
                  </div>
                  <Link href="/inventory" className="px-4 py-2 rounded-lg border border-white/10 hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors">
                    Reabastecer
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 animate-pop">
          <h2 className="text-2xl font-display font-bold text-white">Notificaciones</h2>
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-growth-neon/10">
                <Mail size={20} className="text-brand-growth-neon" />
              </div>
              <div>
                <div className="font-bold text-white">Alertas por Email</div>
                <div className="text-sm text-brand-muted">Recibe avisos en tu correo</div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-brand-muted">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-growth-neon flex-shrink-0" />
                {isDentalMode ? "Alerta de stock bajo al admin" : "Confirmación automática al crear pedido"}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-growth-neon flex-shrink-0" />
                {isDentalMode ? "Avisos de insumos por vencer" : "Actualización de estado al cliente"}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-kinetic-orange flex-shrink-0" />
                {isDentalMode ? "Seguimiento operativo de inventario dental" : "Alerta de stock bajo al admin"}
              </div>
            </div>
            {lowStockAlerts.length > 0 && (
              <StockAlertButton count={lowStockAlerts.length} />
            )}
          </div>
        </section>
      </div>

      {isDentalMode && expiringProducts.length > 0 && (
        <section className="space-y-4 animate-pop">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-yellow-300" /> Insumos por vencer
            </h2>
            <Link href="/inventory?vencimientos=1" className="text-brand-kinetic-orange text-sm font-bold hover:underline">Ver todos</Link>
          </div>
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {expiringProducts.map((item) => (
                <div key={item.id} className="py-4 px-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-xs text-brand-muted mt-0.5">
                      Stock: {item.stock}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium text-yellow-300">
                    {item.batchExpiry?.toLocaleDateString("es-BO") ?? "Sin fecha"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent orders */}
      {!isDentalMode && recentOrders.length > 0 && (
        <section className="space-y-4 animate-pop">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-brand-kinetic-orange" /> Pedidos Recientes
            </h2>
            <Link href="/ventas" className="text-brand-kinetic-orange text-sm font-bold hover:underline">Ver todos →</Link>
          </div>
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {recentOrders.map((o) => {
                const statusColor = o.status === "ENTREGADO" ? "text-brand-growth-neon" : o.status === "CANCELADO" ? "text-red-400" : o.status === "ENVIADO" ? "text-blue-400" : "text-brand-kinetic-orange";
                const statusLabel = o.status === "PENDIENTE" ? "Pendiente" : o.status === "CONFIRMADO" ? "Confirmado" : o.status === "ENVIADO" ? "Enviado" : o.status === "ENTREGADO" ? "Entregado" : "Cancelado";
                return (
                  <div key={o.id} className="py-4 px-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="font-bold text-white">{o.customerName}</div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">Bs. {Number(o.total.toString()).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</div>
                      <div className={`text-xs font-medium ${statusColor}`}>{statusLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

import {
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  UserCheck,
  CreditCard,
  MessageCircle,
  Mail,
  ChevronRight,
  Sparkles,
  Settings,
  Store,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    num: 1,
    title: "Crear tu cuenta",
    desc: "Regístrate con tu email y crea tu organización. Elige el tipo de negocio que mejor describe tu tienda (ropa, farmacia, electrónica, etc.).",
    icon: Sparkles,
    color: "text-brand-kinetic-orange",
    bg: "bg-brand-kinetic-orange/10",
  },
  {
    num: 2,
    title: "Configurar tu negocio",
    desc: "Ve a Configuración y completa los datos de tu tienda: nombre, NIT, teléfono, dirección y logo. Esto aparecerá en tus comprobantes.",
    icon: Settings,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    num: 3,
    title: "Cargar tus productos",
    desc: "Agrega tu catálogo en Inventario. Puedes importar desde CSV (plan CRECER+) o cargar uno por uno. Define precio, stock mínimo y categorías.",
    icon: Package,
    color: "text-brand-growth-neon",
    bg: "bg-brand-growth-neon/10",
  },
  {
    num: 4,
    title: "Empezar a vender",
    desc: "Abre el Punto de Venta (POS), busca productos, agrega al carrito y cobra. El inventario se descuenta automáticamente en cada venta.",
    icon: Store,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
];

const modules = [
  {
    title: "Punto de Venta",
    href: "/pos",
    icon: ShoppingCart,
    color: "text-brand-kinetic-orange",
    bg: "bg-brand-kinetic-orange/10",
    desc: "Cobra rápido con búsqueda de productos, descuentos y múltiples métodos de pago. Genera comprobantes de venta en el momento.",
  },
  {
    title: "Inventario",
    href: "/inventory",
    icon: Package,
    color: "text-brand-growth-neon",
    bg: "bg-brand-growth-neon/10",
    desc: "Gestiona tu catálogo de productos, precios, stock y alertas de reabastecimiento. Soporta variantes (talla, color, sabor) según tu tipo de negocio.",
  },
  {
    title: "Clientes",
    href: "/customers",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    desc: "Registra clientes, ve su historial de compras y envía notificaciones de cumpleaños. Comparte el link de registro público para que se registren solos.",
  },
  {
    title: "Ventas",
    href: "/ventas",
    icon: Store,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    desc: "Consulta el historial completo de pedidos, filtra por fecha o estado, y actualiza el estado de cada venta (pendiente, completado, cancelado).",
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: BarChart2,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    desc: "Analiza ventas por período, productos más vendidos, ingresos por día y exporta datos contables. Disponible en plan CRECER o superior.",
  },
  {
    title: "Personal",
    href: "/staff",
    icon: UserCheck,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    desc: "Agrega empleados con diferentes roles (Admin, Manager, Staff). Cada rol tiene permisos distintos para proteger información sensible.",
  },
];

const plans = [
  { name: "Básico", color: "text-brand-muted", features: ["150 productos", "50 clientes", "1 staff", "POS + inventario"] },
  { name: "Crecer", color: "text-blue-400", features: ["Productos ilimitados", "Reportes", "Importación CSV", "Descuentos"] },
  { name: "Pro", color: "text-brand-growth-neon", features: ["Tienda online", "QR personal", "Registro publico", "10 usuarios"] },
  { name: "Empresarial", color: "text-brand-kinetic-orange", features: ["Sucursales", "Audit log", "Roles avanzados", "Soporte prioritario"] },
];

const addons = [
  { name: "WhatsApp Business", desc: "Atención al cliente y notificaciones por WhatsApp. Requiere Meta Business Account.", icon: MessageCircle, color: "text-green-400" },
  { name: "QR Bolivia", desc: "QR personal disponible para cobros. PSP bancario, Tigo Money o BiPago requieren proveedor y credenciales reales.", icon: Store, color: "text-blue-400" },
];

const faqs = [
  {
    q: "¿Cómo cambio de plan?",
    a: "Ve a Configuración > Facturación y haz clic en 'Gestionar'. Ahí podrás ver los planes disponibles y solicitar el cambio. El cambio se aplica de forma inmediata y el costo se prorratea.",
  },
  {
    q: "¿Cómo agrego personal a mi tienda?",
    a: "Ve al módulo 'Equipo' en el menú lateral. Haz clic en 'Agregar miembro', ingresa su email y asigna un rol. La persona recibirá un email con sus credenciales de acceso.",
  },
  {
    q: "¿Puedo exportar mis datos?",
    a: "Sí, en plan CRECER o superior puedes exportar ventas, inventario y clientes en formato CSV desde el módulo de Reportes. Para exportaciones contables usa el botón 'Exportar contable'.",
  },
  {
    q: "¿Cómo conecto WhatsApp a mi cuenta?",
    a: "Necesitas activar el add-on de WhatsApp Business. Ve a Configuración > Facturación > Add-ons. Requieres una cuenta Meta Business y un número de teléfono dedicado para WhatsApp.",
  },
  {
    q: "¿Dónde puedo obtener soporte técnico?",
    a: "Puedes contactarnos por email a soporte@gestios.bo. Los clientes con plan EMPRESARIAL tienen soporte prioritario con tiempo de respuesta de 4 horas hábiles.",
  },
  {
    q: "¿Es segura mi información?",
    a: "Sí. Todos los datos se almacenan en Supabase con cifrado en reposo y en tránsito. Cada organización está completamente aislada de las demás. El acceso requiere autenticación con Supabase Auth.",
  },
];

export default function HelpPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-12">

      {/* Header */}
      <header className="animate-pop">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-kinetic-orange/10">
            <HelpCircle size={22} className="text-brand-kinetic-orange" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Centro de Ayuda</h1>
        </div>
        <p className="text-brand-muted mt-1 ml-14">Todo lo que necesitas para sacarle el máximo partido a GestiOS.</p>
      </header>

      {/* Primeros Pasos */}
      <section className="animate-pop space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-brand-kinetic-orange" />
          <h2 className="text-2xl font-display font-bold text-white">Primeros Pasos</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="glass-panel p-5 rounded-2xl flex gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex-shrink-0">
                <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center`}>
                  <step.icon size={18} className={step.color} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-muted">PASO {step.num}</span>
                </div>
                <h3 className="font-bold text-white">{step.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modulos principales */}
      <section className="animate-pop space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-brand-growth-neon" />
          <h2 className="text-2xl font-display font-bold text-white">Módulos Principales</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <a
              key={mod.href}
              href={mod.href}
              className="glass-panel p-5 rounded-2xl space-y-3 hover:border-white/20 border border-transparent transition-all hover:-translate-y-1 duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${mod.bg}`}>
                  <mod.icon size={18} className={mod.color} />
                </div>
                <ChevronRight size={16} className="text-brand-muted group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{mod.title}</h3>
                <p className="text-xs text-brand-muted leading-relaxed">{mod.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Facturacion y planes */}
      <section className="animate-pop space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-blue-400" />
          <h2 className="text-2xl font-display font-bold text-white">Facturacion y Planes</h2>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="font-bold text-white mb-1">Planes disponibles</h3>
            <p className="text-sm text-brand-muted">Todos los planes incluyen POS, inventario y clientes. Escala segun tu negocio crece.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <div key={plan.name} className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className={`font-display font-bold text-lg ${plan.color}`}>{plan.name}</div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-brand-muted">
                      <CheckCircle2 size={12} className="text-brand-growth-neon mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5">
            <h3 className="font-bold text-white mb-3">Add-ons disponibles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addons.map((addon) => (
                <div key={addon.name} className="bg-white/5 rounded-xl p-4 flex gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <addon.icon size={16} className={addon.color} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{addon.name}</div>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">{addon.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/billing"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
            >
              <CreditCard size={14} /> Ver mis planes y facturacion
            </a>
            <a
              href="/addons"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:border-white/30 transition-colors"
            >
              <Package size={14} /> Ver add-ons
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="animate-pop space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-purple-400" />
          <h2 className="text-2xl font-display font-bold text-white">Preguntas Frecuentes</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.q} className="glass-panel p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-white flex items-start gap-2">
                <HelpCircle size={16} className="text-brand-kinetic-orange mt-0.5 flex-shrink-0" />
                {faq.q}
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Soporte */}
      <section className="animate-pop">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-brand-kinetic-orange/10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="p-4 rounded-2xl bg-brand-kinetic-orange/10 flex-shrink-0">
            <Mail size={28} className="text-brand-kinetic-orange" />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-display font-bold text-white">Necesitas mas ayuda?</h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Nuestro equipo de soporte esta disponible para ayudarte. Escribe a{" "}
              <a href="mailto:soporte@gestios.bo" className="text-brand-kinetic-orange font-medium hover:underline">
                soporte@gestios.bo
              </a>{" "}
              y te responderemos en menos de 24 horas habiles. Clientes con plan Empresarial tienen respuesta en 4 horas.
            </p>
          </div>
          <a
            href="mailto:soporte@gestios.bo"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
          >
            <Mail size={14} /> Contactar soporte
          </a>
        </div>
      </section>

    </div>
  );
}

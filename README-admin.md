# GestiOS — Guía para Administradores

Sistema de gestión de negocios multi-tenant para Bolivia. Stack: Next.js 16, Prisma, Supabase Auth, Tailwind 4.

---

## Inicio Rápido

1. **Crear cuenta** — Regístrate en la plataforma con tu email. Se crea una organización aislada para tu negocio.
2. **Configurar tienda** — Ve a `Configuración > Mi Tienda` y completa: nombre, NIT, teléfono, dirección, logo y tipo de negocio.
3. **Cargar productos** — Ve a `Inventario` y agrega tu catálogo. Puedes importar desde CSV si tienes plan CRECER+.
4. **Agregar personal** — Ve a `Equipo` y agrega empleados con email. Cada uno recibe credenciales propias.
5. **Primera venta** — Abre `Punto de Venta`, busca un producto y procesa el cobro.

---

## Módulos

| Módulo | Ruta | Descripción | Plan mínimo |
|--------|------|-------------|-------------|
| Dashboard | `/dashboard` | KPIs, alertas de stock, notificaciones | Todos |
| Punto de Venta | `/pos` | Cobro rápido, descuentos, comprobantes | Todos |
| Inventario | `/inventory` | Catálogo, stock, variantes, alertas | Todos |
| Clientes | `/customers` | Registro, historial, link público | Todos |
| Ventas | `/ventas` | Historial de pedidos, estados | Todos |
| Pedidos | `/orders` | Gestión detallada de órdenes | Todos |
| Categorías | `/categories` | Clasificación de productos | Todos |
| Descuentos | `/discounts` | Códigos y porcentajes de descuento | Todos |
| Corte de Caja | `/caja` | Cierre diario con desglose por método de pago | Todos |
| Reportes | `/reports` | Ventas, ingresos, exportación contable | CRECER+ |
| Proveedores | `/suppliers` | Gestión de proveedores y órdenes de compra | CRECER+ |
| Personal | `/staff` | Usuarios y roles | BÁSICO (1 staff) |
| Sucursales | `/branches` | Gestión multi-sucursal | EMPRESARIAL |
| WhatsApp | `/conversations` | Chat con clientes vía WhatsApp Business | Add-on |
| Configuración | `/settings` | Perfil, tienda, facturación, seguridad | Todos |
| Sesiones activas | `/settings/sessions` | Dispositivos con sesión iniciada | Todos |

---

## Planes

| Plan | Productos | Clientes | Staff | Precio |
|------|-----------|----------|-------|--------|
| Básico | 150 | 50 | 1 | Bs. 350/mes |
| Crecer | 500 | 300 | 3 | Bs. 530/mes |
| Pro | Ilimitado | Ilimitado | 10 | Bs. 800/mes |
| Empresarial | Ilimitado | Ilimitado | Ilimitado | Bs. 1.250/mes |

Para cambiar de plan: `Configuración > Facturación > Gestionar` o contactar soporte.

---

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| ADMIN | Acceso total, incluye configuración y facturación |
| MANAGER | Ventas, inventario, clientes, reportes. Sin configuración de plan |
| STAFF | Solo punto de venta e inventario básico |
| VIEWER | Solo lectura (reportes, clientes) |

---

## Add-ons Disponibles

- **WhatsApp Business** — Atención y notificaciones por WhatsApp. Requiere Meta Business Account.
- **Facturación SIAT** — Facturas electrónicas para el SIN Bolivia. Requiere NIT y credenciales SIAT.
- **QR Bolivia** — Pagos vía QR bancario, Tigo Money y BiPago.

Activar add-ons: `Configuración > Facturación > Add-ons`.

---

## Preguntas Frecuentes

**¿Cómo cambio mi contraseña?**
Usa el enlace de recuperación desde la pantalla de login (`/login`). También puedes ir a `Configuración > Seguridad`.

**¿Cómo agrego un miembro del equipo?**
Ve a `Equipo > Agregar miembro`. Ingresa su email y selecciona el rol. Recibirá credenciales por email.

**¿Cómo exporto mis datos?**
En `Reportes` encontrarás opciones de exportación CSV para ventas, inventario y clientes (plan CRECER+). La exportación contable genera un archivo compatible con herramientas de contabilidad bolivianas.

**¿Puedo tener varias sucursales?**
Sí, con plan EMPRESARIAL. Ve a `Sucursales` para crear y gestionar cada punto de venta.

**¿Qué pasa si mi plan vence?**
Serás redirigido a una pantalla de renovación. Tus datos se conservan. Contacta soporte para reactivar.

**¿Es segura mi información?**
Sí. Los datos se almacenan en Supabase (cifrado en reposo y en tránsito). Cada organización está completamente aislada. El acceso requiere autenticación vía Supabase Auth.

**¿Cómo configuro la facturación electrónica SIAT?**
Activa el add-on SIAT desde Configuración. Necesitas tu NIT, CUIS y CUFD obtenidos del Sistema de Impuestos Nacionales (SIN). El soporte de GestiOS puede guiarte en el proceso.

**¿Cómo veo los dispositivos con sesión activa?**
Ve a `Configuración > Sesiones activas` (`/settings/sessions`). Desde allí puedes cerrar sesiones de dispositivos que no reconozcas.

**¿Cómo pago mi suscripción?**
Ve a `Configuración > Facturación`. Puedes pagar por transferencia bancaria al BCP (datos en pantalla) o subir el comprobante de pago para que el equipo confirme manualmente.

---

## Tipos de Negocio

GestiOS adapta la UI según el tipo de negocio configurado en `Configuración > Tipo de negocio`:

| Tipo | Variantes disponibles |
|------|-----------------------|
| General | Sin variantes |
| Tienda de Ropa | Talla (XS–XXXL) + Color |
| Suplementos Deportivos | Sabor + Peso (1lb–15lb) |
| Electrónica | Capacidad + Color |
| Farmacia / Salud | Presentación + Dosis |
| Ferretería / Construcción | Medida + Material |

---

## Pagos en Bolivia

GestiOS acepta pagos de suscripción vía transferencia bancaria:

- **Banco:** BCP Bolivia
- **Cuenta:** 701-51726678-3-55
- **Titular:** (datos de la empresa)

Proceso: realizar transferencia → subir comprobante en Facturación → el equipo activa el plan en 24 horas hábiles.

---

## Contacto y Soporte

- **Email:** soporte@gestios.bo
- **Tiempo de respuesta:** 24 horas hábiles (plan Empresarial: 4 horas)
- **Ayuda en la app:** `Menú lateral > Centro de Ayuda` o ir a `/help`

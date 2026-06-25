# GestiOS product sections and add-ons

## Goal

Keep GestiOS sellable without promising integrations that are not connected yet.

## Active product sections

The dashboard navigation is grouped by operational intent, not by implementation detail:

- Inicio: Dashboard and Notificaciones.
- Operacion diaria: Punto de Venta, Ventas, Pedidos and Corte de Caja.
- Inventario y compras: Inventario, Proveedores, Ordenes de Compra, Categorias and Sucursales.
- Ventas y crecimiento: Clientes, Tienda Online, Descuentos and WhatsApp/Conversaciones when enabled.
- Cuenta y soporte: Billing, Configuracion, Ayuda and Soporte.
- Superadmin: organizations, users, payments, impersonation and plan control.

Each module should answer one clear question:

| Module | Real business use |
|---|---|
| Dashboard | See today's operational health: stock, orders, sales and pending actions. |
| Notificaciones | Review unread operational alerts and open the affected product, order or account action. |
| Punto de Venta | Sell quickly, decrement stock and register payment method. |
| Ventas/Pedidos | Track order status, customer follow-up and fulfillment. |
| Inventario | Control products, SKU/barcode, stock, minimum stock and expiry where applicable. |
| Proveedores/Ordenes de Compra | Replenish stock with supplier traceability. |
| Reportes/Corte de Caja | Review cash, sales, margins and exports for administration. |
| Configuracion/Billing | Maintain store data, plan, account and payment status. |
| Dental operational mode | Inventory, suppliers, purchase orders and expiry control for clinics that use DentalGest as the clinical system. |

Low-stock alerts are created when a product reaches `stock <= minStock` through product creation, product update, batch stock update or order stock decrement. Duplicate unread alerts for the same product are not created.

## Add-ons exposed in product

| Add-on | Status | Notes |
|---|---|---|
| WhatsApp Business + Bot IA | Commercially available, external credentials required | Requires Meta Business account, phone number, webhook configuration and bot scope if automation is included. |
| Pagos QR Bolivia | Partially available | QR personal works. Automatic PSP QR requires provider, API and credentials. |
| E-commerce | Requestable | Storefront exists; commercial activation depends on plan and operational setup. |
| Exportacion Contable | Requestable | CSV/Excel workflow is safer than SIAT. |
| Inventario Avanzado | Commercially available | Uses existing `INVENTARIO_AVANZADO` enum; no migration required. |

## Add-ons a medida

- Bot IA de ventas y soporte.
- Backups y continuidad.
- Migracion asistida.
- Reportes gerenciales.
- Servidor propio administrado para clinicas o empresas con requisitos de infraestructura dedicada.

These are sold as implementation services or managed add-ons. They should not be represented as automatically active until there is a data model, provider or documented operational process.

### Bot IA de ventas y soporte

This add-on is a paid implementation package, not a simple toggle. Before selling it, define:

- objective: sales qualification, support FAQ, order status, appointment handoff or internal support;
- approved knowledge base and escalation rules;
- WhatsApp provider credentials and webhook;
- human owner for unresolved conversations;
- expected response limits, maintenance and monthly review.

Do not sell the bot as autonomous business operation. Sell it as assisted automation connected to a clear process.

Operational runbook: `docs/BOT_IA_ADDON_RUNBOOK.md`.

### Servidor propio administrado

This add-on is consultative, not self-serve. It requires a technical assessment before sale:

- target infrastructure: clinic server, VPS or private cloud;
- domain/subdomain and TLS responsibility;
- backup and restore policy;
- secure admin access;
- monitoring scope;
- support window and SLA;
- update and incident procedure.

Do not promise on-prem installation as an instant feature. Sell it as annual setup plus managed support.

## DentalGest complementarity

DentalGest remains the clinical source of truth: patients, appointments, treatments, doctors and clinical history.

GestiOS can be used as the operational module for dental clinics:

- dental supply inventory;
- stock by area or branch;
- suppliers and purchase orders;
- expiry control for supplies;
- operational cost reporting.
- daily administrative routine for warehouse, purchasing and clinic management.

Recommended bridge URL from DentalGest:

```txt
https://gestioshq.app/inventory?source=dentalgest&returnTo=https%3A%2F%2F<dentalgest-domain>%2Fdashboard
```

When `source=dentalgest` is present, GestiOS shows a contextual banner and a return action. Do not add clinical features to GestiOS.

## Explicitly not sold

- SIAT/facturacion electronica. It remains disabled from the commercial scope until there is a real provider, legal review, credentials and maintenance plan.

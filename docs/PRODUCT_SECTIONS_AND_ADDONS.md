# GestiOS product sections and add-ons

## Goal

Keep GestiOS sellable without promising integrations that are not connected yet.

## Active product sections

- Dashboard: KPIs, stock alerts, recent orders and operational notifications.
- Punto de Venta: cart, discounts, payment method, stock decrement and receipt.
- Ventas: order history, detail, status updates and customer follow-up.
- Inventario: products, variants, SKU/barcode, stock, expiry where applicable.
- Pedidos: internal and storefront order workflow.
- Clientes: customer registry, purchase history and loyalty data.
- Reportes: sales, margin, top products, exports and accounting support by plan.
- Corte de Caja: daily cash control by payment method.
- Tienda Online: public catalog and checkout for PRO+.
- Proveedores and Ordenes de Compra: purchase workflow for CRECER+.
- Descuentos, Categorias and Sucursales.
- Equipo, Configuracion, Ayuda, Soporte and Notificaciones.
- Superadmin: organizations, users, payments, impersonation and plan control.
- Dental operational mode: inventory, suppliers, purchase orders and expiry control for clinics that use DentalGest as the clinical system.

## Add-ons exposed in product

| Add-on | Status | Notes |
|---|---|---|
| WhatsApp Business | Commercially available, external credentials required | Requires Meta Business account, phone number and webhook configuration. |
| Pagos QR Bolivia | Partially available | QR personal works. Automatic PSP QR requires provider, API and credentials. |
| E-commerce | Requestable | Storefront exists; commercial activation depends on plan and operational setup. |
| Exportacion Contable | Requestable | CSV/Excel workflow is safer than SIAT. |
| Inventario Avanzado | Commercially available | Uses existing `INVENTARIO_AVANZADO` enum; no migration required. |

## Add-ons a medida

- Asistente IA operativo.
- Backups y continuidad.
- Migracion asistida.
- Reportes gerenciales.
- Servidor propio administrado para clinicas o empresas con requisitos de infraestructura dedicada.

These are sold as implementation services or managed add-ons. They should not be represented as automatically active until there is a data model, provider or documented operational process.

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

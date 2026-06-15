# SIAT Bolivia - Archivo historico

Estado: retirado del alcance comercial actual de GestiOS.

GestiOS no vende, no activa y no configura SIAT/facturacion electronica para clientes en esta etapa. El producto vendible se enfoca en:

- POS, inventario, clientes y reportes.
- Tienda online y registro publico.
- Pagos de suscripcion por BCP con referencia y automatizacion n8n.
- QR personal para cobros del comercio.
- WhatsApp Business solo cuando existan credenciales Meta reales.

## Decisiones vigentes

- `facturacion_siat` permanece deshabilitado en `lib/plans.ts`.
- `FACTURACION` queda solo como valor historico del enum/add-on para no requerir migracion destructiva.
- `/api/invoices/[orderId]` responde `410 Gone`.
- `/api/cron/siat-cufd` responde `410 Gone` y no esta programado en `vercel.json`.
- `lib/siat.ts` queda aislado como scaffold historico sin imports activos.

## Para futuras revisiones

No reactivar SIAT sin una decision explicita de producto, contrato con proveedor real, documentacion oficial revisada, credenciales reales, migracion revisada y gates completos.

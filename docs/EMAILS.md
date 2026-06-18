# Emails automaticos

## Estado actual

Proveedor transaccional: Resend API via `RESEND_API_KEY`.
Remitente por defecto: `noreply@onia.com.bo`.
Dominio publico por defecto: `https://www.gestioshq.app`.

El sistema mantiene compatibilidad con variables antiguas de Brevo para no romper entornos existentes, pero el envio de negocio se ejecuta con Resend desde `lib/email.ts`.

## Reglas operativas

- Los envios deben seguir siendo fire-and-forget desde las rutas que los disparan.
- No registrar secretos ni payloads sensibles en logs.
- Cada envio se registra en `EmailLog`.
- El limite diario del codigo es 90 correos para dejar margen en el plan gratuito de Resend.
- Todo correo HTML debe llevar version `text` para entregabilidad y fallback.
- Los campos controlados por usuarios se escapan antes de entrar al HTML.

## Plantilla

La plantilla base usa:

- marca tipografica de GestiOS, no imagen legacy;
- fondo oscuro y acento naranja;
- preheader oculto;
- footer operativo con aviso de seguridad;
- copia clara para acciones administrativas.

## Tipos de correo

| Email | Funcion | Destinatario | Disparo |
|---|---|---|---|
| Confirmacion de pedido | `sendOrderConfirmation` | Cliente | Creacion de pedido con email |
| Alerta de nuevo pedido | `sendNewOrderAlert` | Admins | Creacion de pedido |
| Estado de pedido | `sendOrderStatusUpdate` | Cliente | Cambio de estado |
| Puntos de lealtad | `sendLoyaltyPointsEmail` | Cliente | Pedido entregado |
| Bienvenida | `sendWelcomeEmail` | Cliente | Registro publico |
| Cumpleanos | `sendBirthdayEmail` | Cliente | Cron diario |
| Stock bajo | `sendLowStockAlert` | Admins | UI o rutina operativa |
| Vencimientos | `sendExpiryAlert` | Admins | Cron diario |
| Cliente inactivo | `sendInactiveCustomerEmail` | Cliente | Cron semanal |
| Plan por vencer | `sendPlanExpiryWarning` | Admin | Cron de plan |
| Plan activado | `sendPlanActivatedEmail` | Admin | Confirmacion de pago por superadmin |
| Plan vencido | `sendPlanExpired` | Admin | Cron de plan |
| Notificacion plana | `sendPlainNotification` | Variable | Flujos administrativos |

## Entregabilidad pendiente

Para mejorar reputacion del dominio, configurar cuando ONIA lo autorice:

- remitente verificado como `noreply@gestioshq.app` o subdominio equivalente;
- SPF, DKIM y DMARC del dominio usado en Resend;
- webhook de eventos si se quiere medir entrega/rebote en tiempo real.

No cambiar variables de entorno productivas sin confirmacion explicita.

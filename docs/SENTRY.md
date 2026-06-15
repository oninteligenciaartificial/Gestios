# Sentry - Error Monitoring

## Estado

Activo en produccion desde 2026-04-30. Mejorado 2026-05-06.

## Credenciales (en Vercel)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN publica del proyecto |
| `SENTRY_ORG` | `onia-agency` |
| `SENTRY_PROJECT` | `javascript-nextjs` |

DSN completo, auth tokens y secretos no se documentan aqui. Ver Vercel -> Environment Variables.

## Dashboard

`onia-agency.sentry.io` - errores en tiempo real, stack traces, usuarios afectados, releases y replays cuando aplican.

## Archivos de configuracion

| Archivo | Que hace |
|---|---|
| `sentry.client.config.ts` | Init en browser; captura errores React y replays en error |
| `sentry.server.config.ts` | Init en Node.js: API routes y server components |
| `sentry.edge.config.ts` | Init en Edge Runtime: middleware |
| `next.config.ts` | `withSentryConfig`; source maps y Vercel monitors |

## Configuracion actual

```ts
environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
release: process.env.VERCEL_GIT_COMMIT_SHA,
tracesSampleRate: 0.1,
replaysOnErrorSampleRate: 1.0,
replaysSessionSampleRate: 0.01,
```

## Integracion con `lib/monitoring.ts`

`reportAsyncError()` captura errores en Sentry cuando esta configurado y mantiene el patron fire-and-forget.

```ts
export function reportAsyncError(scope: string, error: unknown, context?: MonitoringContext): void {
  console.error(`[${scope}] operacion async fallo`, { error, ...context });
  void captureWithSentry(error, scope, context);
}
```

Funciones disponibles:

| Funcion | Uso |
|---|---|
| `reportAsyncError(scope, error, context?)` | Captura errores con contexto |
| `setSentryUser(user)` | Asocia errores con usuario autenticado |
| `clearSentryUser()` | Limpia contexto de usuario en logout |
| `addSentryBreadcrumb(category, message, data?)` | Agrega traza para debugging |
| `captureSentryMessage(message, level, context?)` | Captura mensajes custom |

## Integracion con auth

`getTenantProfile()` establece contexto de usuario en Sentry:

- `id`: userId del usuario.
- `email`: email del usuario.
- `organizationId`: ID de la organizacion.
- `role`: rol del usuario.

Esto permite rastrear errores por usuario y organizacion sin poner secretos en los eventos.

## Integrado en

- `lib/auth.ts`: user context en cada request autenticado.
- `app/api/orders/route.ts`: errores de stock decrement.
- `app/api/qr-payments/webhook/route.ts`: errores de webhook QR.
- `lib/qr-bolivia.ts`: errores de webhook event handling.
- `lib/email.ts`: errores de envio de email (fire-and-forget).
- `app/api/webhooks/brevo/route.ts`: errores de webhook Brevo.
- `app/api/addons/qr-bolivia/upload/route.ts`: errores de upload QR.

## Alertas

Configurar en `onia-agency.sentry.io` -> Alerts:

- Error nuevo: alerta inmediata por email.
- Error frecuente: si un error supera 10 veces en 1 hora.
- Regression: si un error resuelto vuelve en produccion.

## Runbook de alerta a fix

Ver:

- `docs/MONITORING_REPAIR_FLOW.md` - flujo operativo Sentry -> n8n -> GitHub Issue -> Codex.
- `docs/SENTRY_AUTOFIX_RUNBOOK.md` - guia de reparacion asistida cuando ya existe un issue.

Flujo resumido:

1. Sentry captura errores de produccion y los agrupa por issue.
2. Alertas de Sentry envian email y webhook a n8n, o crean GitHub issue si la integracion GitHub esta conectada y aceptada.
3. n8n filtra produccion, deduplica por `sentry_issue_id` y crea/comenta un GitHub Issue sin secretos.
4. El issue incluye release, stack trace, tags, usuarios afectados, replay si existe y scope.
5. Codex toma el issue, reproduce, arregla, agrega test de regresion y corre gates.
6. Commit, push, PR o deploy requieren aprobacion humana.
7. El issue se marca resuelto en Sentry solo despues de deploy y monitoreo.

## Plan

Free tier: 5,000 errores/mes. Suficiente para etapa actual; si el piloto crece, revisar cuota y retencion.

# Sentry autofix runbook para GestiOS

Flujo operativo actualizado: ver `docs/MONITORING_REPAIR_FLOW.md` para configurar Sentry -> n8n -> GitHub Issue -> Codex. Este archivo queda como guia de trabajo una vez que el issue ya existe.

Objetivo: que los errores reales de produccion entren a una cola accionable y terminen en fixes verificados, sin inventar resultados ni exponer secretos.

## Que tan util nos sirve Sentry

Sentry es muy util para GestiOS porque el producto ya esta en piloto pago y tiene flujos criticos que pueden fallar solo con datos reales:

- checkout publico, pedidos, POS y stock;
- auth, impersonation y multi-tenant;
- QR Bolivia, SIAT, WhatsApp, cron jobs y emails;
- errores de navegador que el cliente no sabe describir;
- errores server-side en API routes y server components;
- regresiones por release, porque el SDK usa `VERCEL_GIT_COMMIT_SHA` como release.

Sentry no reemplaza tests ni E2E. Su trabajo es detectar fallos reales en produccion, agruparlos por issue, mostrar stack trace/source maps, usuario afectado, organizacion, replay de la sesion cuando aplica y frecuencia.

## Estado actual del repo

Ya existe:

- `@sentry/nextjs`.
- `sentry.client.config.ts`.
- `sentry.server.config.ts`.
- `sentry.edge.config.ts`.
- `withSentryConfig()` en `next.config.ts`.
- `reportAsyncError()` en `lib/monitoring.ts`.
- contexto de usuario desde `getTenantProfile()`.
- replays en errores de frontend con `replaysOnErrorSampleRate: 1.0`.
- source maps via `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y `SENTRY_PROJECT`.

Pendiente fuera del repo:

- confirmar alertas reales en Sentry;
- conectar GitHub Integration o webhook;
- definir ownership de alertas;
- probar un error controlado en preview/produccion;
- verificar que los source maps aparecen correctamente en Sentry.

## Limite honesto

No existe garantia real de "siempre 100%" en errores de cliente: un navegador puede bloquear Sentry, fallar la red o cerrar la pagina antes de enviar el evento.

Para errores server-side la cobertura es mucho mas fuerte, siempre que:

- `NEXT_PUBLIC_SENTRY_DSN` exista;
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y `SENTRY_PROJECT` esten configurados para source maps;
- el error no sea atrapado y silenciado sin `reportAsyncError()`;
- la ruta no este fuera de Next/Sentry instrumentation.

La meta operativa es: todo error P0/P1 debe generar alerta o issue accionable.

## Configuracion recomendada en Sentry

Proyecto: `onia-agency/javascript-nextjs`.

Crear alertas:

| Alerta | Condicion | Accion |
|---|---|---|
| Nuevo error production | First seen event, environment `production` | Email + GitHub issue |
| Regresion | Issue resolved vuelve a aparecer | Email + GitHub issue |
| Frecuencia alta | mismo issue `>= 5` veces en 10 min | Email + GitHub issue |
| Usuarios afectados | `>= 2` usuarios en 30 min | Email + GitHub issue |
| Checkout/POS | tag/scope contiene `checkout`, `orders`, `pos`, `billing`, `qr` | Email inmediato |
| Cron/webhook | scope contiene `cron`, `webhook`, `siat`, `whatsapp` | Email inmediato |

Configurar acciones:

1. Email a owner tecnico.
2. GitHub issue en `oninteligenciaartificial/Gestios` con labels:
   - `sentry`
   - `bug`
   - `production`
   - `p0` o `p1` segun impacto.
3. Si el plan de Sentry lo permite, habilitar Seer issue scan/fix con GitHub conectado.

## Formato minimo para pedir fix a Codex

Cuando llegue un error, enviar a Codex uno de estos inputs:

- URL del issue de Sentry;
- o GitHub issue creado por Sentry;
- o JSON/markdown con:
  - titulo del issue;
  - exception type/value;
  - stack trace principal;
  - release;
  - environment;
  - tags: `scope`, `organizationId`, `role`, `http.url`, `http.status_code`;
  - pasos si Sentry los muestra;
  - replay URL si existe;
  - frecuencia y usuarios afectados.

No pegar secretos, cookies, tokens, headers auth ni payloads con datos sensibles de clientes.

## Flujo de reparacion

1. Triage:
   - clasificar P0/P1/P2;
   - confirmar si es produccion, preview o local;
   - revisar release y ruta afectada;
   - buscar issue duplicado.
2. Reproduccion:
   - usar stack trace, breadcrumbs, replay y tags;
   - intentar reproducir con test unitario o E2E;
   - si no se reproduce, crear guard defensivo y logging adicional.
3. Fix:
   - tocar solo el area afectada;
   - mantener `organizationId` en queries tenant-scoped;
   - no imprimir secretos;
   - agregar test de regresion.
4. Gates:
   - `npm run lint`;
   - `npx tsc --noEmit`;
   - `npm test`;
   - `npm run build`;
   - E2E si toca flujo critico.
5. Cierre:
   - documentar root cause;
   - resolver issue en Sentry solo despues del deploy;
   - monitorear si reaparece como regression.

## Severidad para venta piloto

| Severidad | Ejemplo | SLA interno recomendado |
|---|---|---|
| P0 | checkout caido, login caido, fuga multi-tenant, perdida de stock/dinero | atender el mismo dia |
| P1 | error repetido en pedidos, POS, billing, QR, emails criticos | atender en 24 h |
| P2 | error aislado con workaround, UI menor, warning no critico | backlog semanal |

## Mejoras de codigo recomendadas

1. Agregar mas `reportAsyncError()` en catchs que hoy solo devuelven 500 generico.
2. Usar tags consistentes:
   - `scope`
   - `organizationId`
   - `route`
   - `feature`
   - `plan`
3. Evitar enviar PII en `extra`; preferir IDs internos y metadata minima.
4. Crear un endpoint de test controlado solo para preview o superadmin si se necesita validar Sentry. No dejarlo publico en produccion.
5. Revisar source maps tras cada deploy: los stack traces deben apuntar a archivos reales del repo.

## Checklist de setup externo

- [ ] `NEXT_PUBLIC_SENTRY_DSN` configurado en Vercel production y preview.
- [ ] `SENTRY_AUTH_TOKEN` configurado y con permisos de upload de source maps.
- [ ] `SENTRY_ORG=onia-agency`.
- [ ] `SENTRY_PROJECT=javascript-nextjs`.
- [ ] GitHub Integration conectada en Sentry.
- [ ] Alertas creadas para production.
- [ ] Issue alerts crean GitHub issues o mandan email.
- [ ] Seer habilitado si el plan lo permite.
- [ ] Error controlado probado y recibido.
- [ ] Source maps verificados.

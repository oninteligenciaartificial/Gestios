# Environment variables reference

Referencia operativa para configurar GestiOS sin exponer secretos. La fuente practica es `.env.example`; este documento explica donde obtener cada variable y como tratarla.

## Reglas

- No pegar valores reales en docs, issues, prompts, capturas ni commits.
- Mantener `.env*` ignorados salvo `.env.example`.
- Las variables `NEXT_PUBLIC_*` son visibles para el navegador; no poner secretos ahi.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, tokens de proveedores y claves de webhook son server-only.
- Rotar cualquier secreto que haya sido pegado en chat, screenshot o archivo versionable.

## App

| Variable | Uso | Donde configurarla |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL canonica para callbacks, emails y metadata | Vercel env; produccion: `https://gestioshq.app` |

## Supabase y Prisma

| Variable | Uso | Donde obtenerla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL publico de Supabase | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key para cliente browser/server SSR | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | operaciones server-side privilegiadas | Supabase > Project Settings > API |
| `DATABASE_URL` | runtime app con Prisma/Postgres | Supabase > Database > Connect > pooler/transaction |
| `DIRECT_URL` | migraciones y mantenimiento controlado | Supabase > Database > Connect > direct/session |

Notas:

- No usar `prisma db push` contra produccion.
- No imprimir estas variables en logs.
- Para E2E local con DB real se necesita `DATABASE_URL`, pero no debe compartirse.

## Email

| Variable | Uso | Donde obtenerla |
|---|---|---|
| `RESEND_API_KEY` | envio transaccional con Resend | Resend dashboard > API Keys |
| `EMAIL_FROM_ADDRESS` | remitente verificado | Resend dominio/remitente verificado |
| `EMAIL_FROM_NAME` | nombre visible del remitente | Valor comercial, normalmente `GestiOS` |
| `BREVO_WEBHOOK_KEY` | firma de webhook legacy Brevo | Solo si el webhook legacy sigue activo |

## Rate limiting

| Variable | Uso | Donde obtenerla |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | rate limiting distribuido | Upstash Redis REST API |
| `UPSTASH_REDIS_REST_TOKEN` | token Redis REST | Upstash Redis REST API |
| `KV_REST_API_URL` | alternativa Vercel KV | Vercel Storage KV |
| `KV_REST_API_TOKEN` | alternativa Vercel KV | Vercel Storage KV |

Sin Redis/KV, el repo puede caer a fallback en memoria; eso sirve para desarrollo/piloto controlado, no para release publico masivo.

## Cron

| Variable | Uso | Donde obtenerla |
|---|---|---|
| `CRON_SECRET` | autoriza endpoints cron | Generar secreto aleatorio y cargarlo en Vercel |

## Superadmin bootstrap

| Variable | Uso |
|---|---|
| `SUPERADMIN_EMAIL` | email para script one-off de superadmin |
| `SUPERADMIN_PASSWORD` | password temporal del superadmin |
| `SUPERADMIN_NAME` | nombre visible |

Usar solo para bootstrap controlado. Rotar password despues de crear la cuenta.

## WhatsApp Business

| Variable | Uso | Donde obtenerla |
|---|---|---|
| `WA_PHONE_NUMBER_ID` | numero Meta/WhatsApp | Meta Developers > WhatsApp |
| `WA_ACCESS_TOKEN` | token server-side | Meta Business Manager > System User token |
| `WA_APP_SECRET` | firma de webhook | Meta Developers > App Settings |
| `WA_VERIFY_TOKEN` | verificacion webhook | Valor aleatorio definido por el equipo |

WhatsApp es add-on. No prometerlo como ilimitado ni activo si Meta, templates y webhooks no estan configurados.

## Analytics

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | habilita PostHog en cliente |

## Sentry

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | captura errores browser/server |
| `SENTRY_ORG` | org para sourcemaps |
| `SENTRY_PROJECT` | proyecto para sourcemaps |
| `SENTRY_AUTH_TOKEN` | upload de sourcemaps en build |
| `SENTRY_WEBHOOK_CLIENT_SECRET` | valida webhook entrante si se usa flujo Sentry -> n8n |

Ver `docs/SENTRY_AUTOFIX_RUNBOOK.md` y `docs/MONITORING_REPAIR_FLOW.md`.

## E2E

| Variable | Uso |
|---|---|
| `PLAYWRIGHT_BASE_URL` | URL objetivo de Playwright |
| `STORE_SLUG` | tienda publica sandbox para E2E |
| `E2E_CREATE_ORDERS` | permite crear ordenes si esta en `true` |
| `E2E_ALLOW_PRODUCTION_ORDER` | guard extra para evitar pedidos reales accidentales |

No ejecutar E2E con creacion real en produccion salvo tienda sandbox, aprobacion explicita y rollback definido.

## Checklist de produccion

- [ ] `NEXT_PUBLIC_APP_URL=https://gestioshq.app`.
- [ ] Supabase URL Configuration incluye `https://gestioshq.app/auth/callback`.
- [ ] Google Provider esta activo en Supabase si se vende login con Google.
- [ ] Resend esta configurado para email app y, si aplica, SMTP de Supabase Auth.
- [ ] `CRON_SECRET` es aleatorio y esta cargado.
- [ ] Redis/KV esta configurado para rate limiting distribuido antes de release masivo.
- [ ] Sentry DSN y sourcemaps estan configurados.
- [ ] Variables de WhatsApp/SIAT/QR solo se cargan si el proveedor esta listo.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` pasan antes de deploy.

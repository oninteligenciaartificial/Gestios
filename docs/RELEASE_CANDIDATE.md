# Release candidate - Pilot pago

Estado: listo para piloto pago controlado.

Fecha de contexto: 2026-06-06.

Ultima preparacion de deploy: 2026-06-12.

## Alcance aprobado para piloto

- Backend P0 multi-tenant resuelto en pedidos, ordenes de compra y relaciones de productos.
- Tests actualizados: `npm test` pasa con 411 tests.
- Build local documentado como verde.
- Import/export de plan piloto queda CSV-only.
- Soporte XLSX removido del objetivo de esta release pilot; no se promete XLSX a clientes piloto.
- SIAT, QR Bolivia/PSP externo y WhatsApp quedan condicionados a credenciales/proveedor reales.
- Hardening P1 aplicado en import legacy, import/export CSV, QR upload, batch inventory y checkout publico.

## Estado de gates

| Gate | Estado para piloto | Nota |
|---|---|---|
| `npm run lint` | Verde requerido | Script endurecido con `--max-warnings=0`; cualquier warning bloquea cierre |
| `npx tsc --noEmit` | Verde | Exit 0 |
| `npm test` | Verde | 411 tests |
| `npm run build` | Verde | Next 16.2.6 |
| `npm audit --audit-level=high` | Verde | Exit 0; quedan vulnerabilidades moderadas |
| P0 backend/data | Resuelto | Ownership validado en pedidos, purchase orders y productos |
| CSV import/export | Aprobado | Alcance CSV-only |
| E2E Playwright | Verde solo lectura remoto | Ultima corrida documentada dio 6 passed, 1 skipped; repetir contra `PLAYWRIGHT_BASE_URL=https://gestioshq.app`; local requiere `DATABASE_URL` |
| Cron endpoints | Endurecido en repo | Todos los cron routes validan `RATE_LIMITS.cron` antes de `CRON_SECRET` |
| Variables externas | Check agregado | `npm run check:release-env` valida presencia/formato sin imprimir secretos |
| Superadmin bootstrap | Endurecido en repo | Sin credencial hardcodeada; usa `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` |

## Evidencia de preparacion 2026-06-12

- Skills e instrucciones de agente consolidadas en `docs/AGENT_RELEASE_PLAYBOOK.md`.
- Fuentes aprobadas de repos y skills externas documentadas en `docs/GITHUB_REPO_RESEARCH.md`.
- Accesibilidad/touch targets reforzados en tienda publica y clientes.
- QR upload P1 verificado como resuelto en backlog: rate limit, magic bytes, rechazo SVG, nombres aleatorios y tests existentes.
- Gates frescos ejecutados: `git diff --check`, `npm run lint`, `npx tsc --noEmit`, `npm test` con 411 tests, `npm run build`, `npm audit --audit-level=high` y E2E remoto readonly con 6 passed / 1 skipped.
- Deploy productivo pendiente de confirmacion explicita de branch/commit, gates, URL objetivo y rollback.

## Evidencia de preparacion OAuth/SEO 2026-06-12

- Callback OAuth mal dirigido a `/` rescatado desde `proxy.ts` hacia `/auth/callback`.
- Destino post-OAuth recordado con cookie temporal `gestios_oauth_next`, saneado por helper compartido y limpiado al cerrar callback.
- Tests unitarios agregados para `sanitizeOauthNext()`, incluyendo rutas relativas seguras y destinos externos codificados.
- Sitemap Next.js 16 agregado en `app/sitemap.ts`; `robots.txt` y enlace externo del dashboard apuntan a `gestioshq.app`.
- Referencia de variables de entorno y auditoria de reutilizacion DentalGest documentadas sin secretos.
- Fuente de video onboarding Remotion versionada; `node_modules` y renders MP4 quedan ignorados.
- Gates frescos ejecutados: `git diff --check`, `npm run lint`, `npx tsc --noEmit`, `npm test` con 411 tests, `npm run build`, `npm audit --audit-level=high` y `npm --prefix remotion-video run build`.

## Evidencia de hardening dependencias 2026-06-12

- `npm audit fix` sin `--force` aplicado solo al lockfile.
- Vulnerabilidades moderadas reducidas de 11 a 5.
- Resuelto sin cambios de API directa: `brace-expansion`, `hono`, `resend`/`standardwebhooks` y `ws`.
- Pendientes 5 moderadas porque `npm audit` solo ofrece `--force` con cambios incompatibles o downgrades: `prisma`/`@prisma/dev`/`@hono/node-server` y `next`/`postcss`.
- Gates frescos ejecutados: `git diff --check`, `npm run lint`, `npx tsc --noEmit`, `npm test` con 411 tests, `npm run build` y `npm audit --audit-level=high`.

## Listo para piloto pago

El release candidate puede avanzar a piloto pago con clientes controlados si el alcance comercial explicita estas condiciones:

- Importaciones y exportaciones solo CSV.
- Sin promesa de XLSX durante el piloto.
- Integraciones externas dependen de configuracion real: SIAT, proveedor QR/PSP y WhatsApp Business API.
- Monitoreo activo de errores y feedback durante onboarding.

## Bloqueos para release publico masivo

- Ejecutar y registrar E2E Playwright con creacion real de pedido en sandbox.
- Ejecutar E2E con `E2E_CREATE_ORDERS=true` solo en tienda sandbox, con rollback/cleanup manual definido.
- Configurar `DATABASE_URL` local solo si se quiere correr E2E contra `localhost`; no es necesario para readonly remoto.
- Validar configuracion productiva de Supabase, Sentry, Upstash y crons.
- Ejecutar `npm run check:release-env -- --strict` en el entorno objetivo antes de release publico.
- Validar policies reales de Supabase/RLS fuera del repo.
- Validar Upstash/Redis para rate limiting distribuido; sin eso el fallback en memoria no es suficiente para release masivo.
- Definir cifrado/rotacion para secretos tenant-scoped guardados en DB antes de escalar integraciones reales.
- Rotar credencial superadmin anterior si alguna vez fue usada en Supabase real.
- Confirmar copy comercial sin promesas de SIAT/QR/WhatsApp/XLSX no habilitadas.
- Ejecutar prueba real de Google OAuth en `gestioshq.app` con usuario existente y usuario nuevo; el repo ya rescata callbacks OAuth mal dirigidos a `/`.

## Decision

Aprobado como release candidate para piloto pago controlado.

No aprobado aun para release publico masivo.

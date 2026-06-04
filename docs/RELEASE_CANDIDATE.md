# Release candidate - Pilot pago

Estado: listo para piloto pago controlado.

Fecha de contexto: 2026-06-01.

## Alcance aprobado para piloto

- Backend P0 multi-tenant resuelto en pedidos, ordenes de compra y relaciones de productos.
- Tests actualizados: `npm test` pasa con 404 tests.
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
| `npm test` | Verde | 404 tests |
| `npm run build` | Verde | Next 16.2.6 |
| `npm audit --audit-level=high` | Verde | Exit 0; quedan vulnerabilidades moderadas |
| P0 backend/data | Resuelto | Ownership validado en pedidos, purchase orders y productos |
| CSV import/export | Aprobado | Alcance CSV-only |
| E2E Playwright | Verde solo lectura remoto | `PLAYWRIGHT_BASE_URL=https://gesti-os.vercel.app` dio 6 passed, 1 skipped; local requiere `DATABASE_URL` |
| Cron endpoints | Endurecido en repo | Todos los cron routes validan `RATE_LIMITS.cron` antes de `CRON_SECRET` |
| Variables externas | Check agregado | `npm run check:release-env` valida presencia/formato sin imprimir secretos |
| Superadmin bootstrap | Endurecido en repo | Sin credencial hardcodeada; usa `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` |

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

## Decision

Aprobado como release candidate para piloto pago controlado.

No aprobado aun para release publico masivo.

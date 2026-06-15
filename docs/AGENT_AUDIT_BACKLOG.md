# Backlog consolidado por agentes

Generado por auditoria paralela de agentes Backend/Data, Frontend/UX, Security/RLS y QA/Release.

## Estado verificado

| Check | Estado |
|---|---|
| `npx tsc --noEmit` | Pasa |
| `npm test` | Pasa: 31 archivos, 411 tests |
| `npm run build` | Pasa: Next 16.2.6, 106 rutas |
| `npm run lint` | Pasa requerido: exit 0 con `--max-warnings=0` |
| `npm audit --audit-level=high` | Pasa: exit 0, quedan moderadas |
| E2E Playwright | Pasa en modo solo lectura contra produccion: 6 passed, 1 skipped; local requiere `DATABASE_URL` |

## P0 - Bloqueante release

### Backend/Data + Security/RLS - resuelto para piloto pago

- Ownership completo en creacion interna de pedidos: resuelto.
  - Se valida que `customerId`, `productId` y `variantId` pertenezcan a `profile.organizationId`.
  - Se valida que `variantId` pertenezca al `productId` enviado.
  - Los decrementos de stock quedan protegidos por tenant/product ownership.
  - Tests cubren `variantId` ajeno y producto/cliente ajenos.

- Ownership de productos en ordenes de compra: resuelto.
  - Se valida cada `productId` contra la organizacion.
  - La recepcion de orden incrementa stock solo para productos de la organizacion.

- Relaciones en productos: resuelto.
  - `categoryId` y `supplierId` se validan contra la misma organizacion antes de crear/actualizar.

### Security/Dependencies - resuelto para piloto pago

- `xlsx` removido del objetivo de release pilot.
  - Import/export queda CSV-only para el piloto pago.
  - No se promete soporte XLSX en esta release.

### QA/Release - bloquea release publico masivo

- Resolver audit high. **Resuelto para piloto.**
  - Subir `next` y `eslint-config-next` a version parcheada `16.2.6`.
  - Confirmar que `xlsx` ya no este instalado ni importado; el alcance del piloto es CSV-only.
  - Ejecutar `npm audit --audit-level=high`.

- Corregir `npm run lint` hasta exit 0. **Resuelto para piloto.**
  - Ignorar artefactos locales: `.obsidian/**`, `.claire/**`, `.claude/worktrees/**`, `test-results/**`, outputs generados.
  - Corregir errores reales: anchors internos sin `next/link`, `setState` sincronico en effects.
  - Endurecer el script con `--max-warnings=0` para que warnings nuevos bloqueen CI/local.

- Reducir abuso de cron endpoints. **Resuelto para piloto.**
  - Todos los cron routes usan `RATE_LIMITS.cron` antes de validar `CRON_SECRET`.
  - Para produccion amplia falta configurar Upstash/Redis y validar que el limiter sea distribuido, no solo fallback en memoria.

- Reducir riesgo de secretos en monitoreo. **Resuelto para piloto.**
  - `reportAsyncError()`, breadcrumbs y mensajes Sentry redaccionan keys sensibles antes de loguear o capturar.
  - Tests cubren `token`, `authorization`, `apiKey`, `databaseUrl` y `cookie`.

- Validar variables externas sin exponerlas. **Resuelto para piloto.**
  - `npm run check:release-env` valida variables minimas sin imprimir valores.
  - `npm run check:release-env -- --strict` queda como gate para release publico.

- Eliminar credencial SUPERADMIN hardcodeada. **Resuelto para piloto.**
  - `scripts/create-superadmin.mjs` exige `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`.
  - El script ya no imprime contrasenas.
  - Si la credencial anterior fue usada, rotarla en Supabase real.

- Rate limits adicionales. **Resuelto para piloto.**
  - Login server action limitado por IP+email.
  - Tracking publico de pedidos limitado por IP.
  - Billing manual/QR/confirm, sesiones y alerta manual de stock limitados.
  - Checkout publico limita antes de parsear body o consultar DB.

- Hardening de upload QR Bolivia. **Resuelto para piloto.**
  - `app/api/addons/qr-bolivia/upload/route.ts` valida plan PRO+, rol ADMIN y rate limit por organizacion.
  - `formData()` esta protegido con `try/catch`.
  - La ruta valida magic bytes, rechaza SVG/MIME falso y usa `randomUUID()` para el nombre.
  - `tests/qr-bolivia-upload.test.ts` cubre PNG valido, SVG, MIME falso y gate de plan.

## P1 - Alto valor antes de produccion amplia

### Security/RLS

- Revisar tracking publico de pedidos.
  - `app/api/pedido/[id]/route.ts`
  - Evaluar token publico no adivinable para evitar exposicion si se filtra un ID.

- Facturacion electronica retirada.
  - `lib/siat.ts` queda como scaffold historico.
  - Mantener rutas SIAT deshabilitadas y fuera de cron productivo.

- Verificar RLS real en Supabase.
  - Confirmar `profiles` con RLS y policies.
  - Confirmar que el resto del aislamiento depende de codigo y service role.
  - Seguir `docs/SUPABASE_RLS_VALIDATION.md` antes de release publico masivo.

- E2E de pedido real.
  - El test ya exige `order-success`; no acepta "checkout-error" como verde.
  - En host productivo bloquea creacion real salvo `E2E_ALLOW_PRODUCTION_ORDER=true`.
  - Pendiente: correrlo en sandbox con `E2E_CREATE_ORDERS=true` y limpieza de orden creada.

### Frontend/UX

- Agregar nombres accesibles a botones icon-only.
  - En progreso: `app/[slug]/tienda/page.tsx` y `app/(dashboard)/customers/page.tsx` ya tienen labels/touch targets mejorados.
  - `app/[slug]/tienda/page.tsx`
  - `app/(dashboard)/inventory/components/ProductTable.tsx`
  - `app/(dashboard)/customers/page.tsx`
  - `components/dashboard/NotificationBell.tsx`
  - Modales y acciones con iconos.

- Mejorar touch targets en flujos criticos.
  - Botones de cantidad en tienda.
  - Filtros y acciones en POS.
  - Acciones moviles de inventario/clientes.

- Normalizar moneda a BOB.
  - Reemplazar `$` por `Bs.` o helper de moneda en inventario y superficies comerciales.

- Revisar copy de pagos.
  - No prometer Tigo Money, BiPago, QR Switch o WhatsApp real si faltan credenciales/proveedor. SIAT no se vende.

### Docs/Release

- Actualizar docs con estado real.
  - Tests actuales: 404.
  - Build local: pasa.
  - Lint/audit high/build/E2E readonly: pasan para piloto; quedan warnings lint y audit moderado.
  - Email actual: Resend; Brevo queda como historico/integracion legacy si aplica.
  - PSP QR/WhatsApp: configuracion externa pendiente. SIAT retirado.

- Checklist unico de release candidate creado/actualizado.
  - `docs/RELEASE_CANDIDATE.md`.

## P2 - Mejora continua

- Mutaciones multi-tenant: migrar patron `findFirst({ id, organizationId })` + `update({ id })` a mutaciones con scope o constraints compuestas donde convenga.
- Agregar indices de performance en SQL manual para consultas frecuentes:
  - productos por `organizationId`, `active`, `name`, `categoryId`.
  - clientes por `organizationId`, `name`, `email`, `phone`.
  - ordenes por `organizationId`, `createdAt`, `status`.
- Revisar CSP para reducir `'unsafe-inline'` y `'unsafe-eval'` cuando el stack lo permita.
- Usar `timingSafeEqual` en verificacion WhatsApp.
- Limpiar warnings ESLint no bloqueantes.
- Consolidar docs historicas o marcarlas como historicas para evitar contradicciones.
- Unificar sistema visual y reducir hardcodes de color.
- Mejorar semantica de command palette, pricing toggle y dialogos.

## Orden de trabajo recomendada

1. P0 backend/security en pedidos, purchase orders y productos: resuelto para piloto pago.
2. P0 dependencias: CSV-only y audit high resuelto para piloto.
3. P0 lint verde: resuelto para piloto.
4. P1 tracking publico de pedidos, SIAT retirado, RLS real y E2E sandbox.
5. P1 a11y/touch targets/moneda/copy.
6. P1 docs release candidate.
7. Gates completos.

## Gates obligatorios al cerrar

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --audit-level=high
npm run test:e2e
```

Si algun gate falla, el release queda bloqueado y debe registrarse el owner del frente responsable.

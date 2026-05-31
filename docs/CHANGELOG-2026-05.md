# GestiOS — Changelog Mayo 2026

## 2026-05-30 — Audit UI: locale es-BO + acentos completos

### Commits: `3300dce` → `2801e60` (6 commits)

Barrido completo de todos los archivos con texto en español en la UI.

**Locale:**
- Todos los `toLocaleString("es-MX")` → `"es-BO"` (cero ocurrencias `es-MX` restantes)
- Todos los `toLocaleDateString("es-MX")` → `"es-BO"`
- Todos los `toLocaleTimeString("es-MX")` → `"es-BO"`
- Moneda: `$` fijo → `Bs.` con `toLocaleString("es-BO")` en todos los formateos

**Archivos modificados:**
- `app/page.tsx` — landing page
- `app/(dashboard)/customers/page.tsx`
- `app/(dashboard)/orders/page.tsx` (incluyendo template de impresión)
- `app/(dashboard)/reports/page.tsx` (headers y labels CSV)
- `app/(dashboard)/pos/page.tsx`
- `app/(dashboard)/superadmin/page.tsx`
- `app/(dashboard)/superadmin/organizations/page.tsx`
- `app/(dashboard)/superadmin/users/page.tsx`
- `app/(dashboard)/settings/sessions/page.tsx`
- `app/(dashboard)/inventory/components/StockHistoryModal.tsx`

**Acentos corregidos en todos los archivos UI** — tildes faltantes, ¿/¡ de apertura, ñ.

---

## 2026-05-29 v2 — Onboarding tour + fixes

### Onboarding tour interactivo
- `components/dashboard/OnboardingTour.tsx` — tour localStorage-based (`gestios_onboarding_v1`)
- Welcome card + 4 pasos (POS, Inventario, Clientes, Reportes)
- Botones "Saltar tour" + "Ir a feature" por paso
- Activado en dashboard layout para non-superadmins

### Fixes
- Login redirect: `window.location.href = "/"` → `"/dashboard"` en `app/login/page.tsx`
- Sessions API: `DELETE /api/sessions` revoca sesión por sessionId
- Notifications API: try/catch, Promise.all, param `?unread=true`

---

## 2026-05-13 — Deploy masivo + nuevas features

### Deploy completo
- **Commit:** `8163631`
- **67 archivos** cambiados, 3808 inserciones
- **Producción:** https://gesti-os.vercel.app
- **Build:** Next.js 16.2.3, 83 páginas, TypeScript OK, 44s

### Landing page mejorada (`app/page.tsx`)
- Nueva sección "Cómo funciona" (4 pasos)
- Testimonios de clientes (3 ejemplos)
- FAQ (6 preguntas frecuentes)
- CTA final mejorado
- Nav sticky con backdrop blur

### Pricing page mejorada (`app/pricing/page.tsx`)
- Toggle mensual/anual con descuento 10%
- CTA con plan pre-seleccionado (`/signup?plan=pro`)
- Tabla comparativa detallada (20 features × 4 planes)
- Badges de ahorro anual
- Footer con CTA

### Signup con plan pre-seleccionado (`app/signup/page.tsx`)
- Lee `?plan=` de URL y muestra badge del plan seleccionado
- Suspense boundary para `useSearchParams`

### Export contable mejorado (`lib/accounting-export.ts`)
- **4 tipos de export:**
  1. `ventas` — Detalle de cada venta con margen, categoría, NIT
  2. `resumen` — Resumen financiero por método de pago, mes, estado
  3. `clientes` — CRM completo con total compras, puntos lealtad, última compra
  4. `inventario` — Stock actual con variantes, costos, proveedor
- Gate: add-on CONTABILIDAD o plan CRECER+ (csv_export feature)
- CSV con escape correcto de comas y comillas
- Rate limiting aplicado

### UI de reportes actualizada (`app/(dashboard)/reports/page.tsx`)
- 5 botones de export: Resumen, Ventas, Resumen Financiero, Clientes, Inventario
- Responsive (oculta los menos usados en pantallas pequeñas)

### Purchase Orders — Feature completa

#### Schema (`prisma/schema.prisma`)
- Modelo `PurchaseOrder` con status: BORRADOR → ENVIADO → PARCIAL → RECIBIDO / CANCELADO
- Modelo `PurchaseOrderItem` con productId, quantity, unitCost, received
- Relaciones con Supplier y Product
- Migración: `prisma/migrations/20260513120000_add_purchase_orders/migration.sql`

#### API (`app/api/purchase-orders/route.ts`)
- `GET` — Lista con paginación, filtros por status y supplier
- `POST` — Crea orden con items, valida supplier del org, log audit
- `PATCH` — Actualiza status/notas, si RECIBIDO → actualiza stock de productos
- `DELETE` — Elimina (no permite si ya RECIBIDO)

#### UI (`app/(dashboard)/purchase-orders/page.tsx`)
- Lista con filtros por status (badges con iconos)
- Modal de creación con selector de proveedor, productos, cantidades y costos
- Modal de detalle con opción de cambiar status
- Al marcar RECIBIDO → actualiza stock automáticamente
- Total calculado en tiempo real

### n8n workflows mejorados

#### `n8n/brevo-email-tracking.json` (Webhook)
- Agregado nodo de deduplicación (Code node con staticData)
- Timeout de 10s en HTTP request
- onError: continueRegularOutput (no falla el workflow)
- Filtro doble: existe + no vacío
- Formato de evento normalizado para GestiOS API

#### `n8n/brevo-email-tracking-polling.json` (Polling)
- Cada 5 minutos
- Fetch Brevo Statistics API (100 eventos, último día)
- Deduplicación por messageId (últimos 1000 IDs)
- Filtra eventos de últimos 5 minutos
- Envía batch a GestiOS API

#### `n8n/purchase-order-automation.json` (Nuevo)
- Cada 6 horas
- Fetch POs con status ENVIADO
- Detecta POs vencidas (past expectedDate)
- Calcula días de atraso
- Envía alerta a GestiOS (`/api/notifications/purchase-order-overdue`)
- Requiere env var: `GESTIOS_API_KEY`

### Documentación actualizada
- `docs/NEXT_STEPS.md` — Estado al 2026-05-13
- `docs/ANALYSIS.md` — Tests: 229, 13 files
- `docs/PLAN.md` — Deploy completado
- `docs/00-PROJECT-CONTEXT.md` — Estado actualizado
- `docs/SESSION_LOG.md` — Entrada 2026-05-13

---

## 2026-05-19 tarde — Analytics, Stock History, Loyalty Points, Charts, Tienda Dashboard

### PostHog Analytics Integration ✅
- `components/PostHogProvider.tsx` — Provider para context
- `components/PostHogPageview.tsx` — Automatic pageview tracking
- `next.config.ts` — Reverse proxy en `/ingest` para privacidad
- Pendiente: `NEXT_PUBLIC_POSTHOG_KEY` en env vars de Vercel

### SyncButton ✅
- `components/dashboard/SyncButton.tsx` — Botón de refresh en dashboard
- Implementa refetch de datos del dashboard

### Stock Movement History ✅
- `app/(dashboard)/inventory/components/StockHistoryModal.tsx` — Modal con historial de movimientos
- `GET /api/products/stock-entry?productId=X` — API para obtener historial
- Muestra entrada, salida, usuario, fecha

### Loyalty Points Adjustment ✅
- Formulario inline en modal de detalle de cliente
- `PATCH /api/customers/[id]` con parámetro `loyaltyPointsAdjustment`
- Permite sumar/restar puntos manualmente

### Recharts Charts ✅
- `components/dashboard/charts/SalesLineChart.tsx` — Gráfico de línea de ventas
- `components/dashboard/charts/CategoryBarChart.tsx` — Gráfico de barras por categoría
- Integrados en página de reportes

### Tienda Online Dashboard ✅
- `app/(dashboard)/tienda/page.tsx` — Dashboard principal
- `app/(dashboard)/tienda/TiendaSettings.tsx` — Configuración
- `GET /api/tienda/settings` — API para obtener/actualizar configuración
- Métricas de ventas online, control de visibilidad de productos

### Tests Completados ✅
- `purchase-orders.test.ts` — 28 tests
- `accounting-export.test.ts` — 27 tests
- **Total:** 284 tests pasando (suma +55 respecto a sesión anterior)

---

## 2026-05-19 mañana — CI fix + Email migration Brevo→Resend + Auth redirect fix

### CI Pipeline — Completamente funcional ✅
- Node 20 → Node 22 (requerido por `@prisma/streams-local`)
- `npm ci` → `npm install --prefer-offline` (lockfile mismatch fix)
- ESLint: react-compiler rules, no-explicit-any en tests, no-unescaped-entities
- Encoding fix en tests (`operación async falló`, `1 año`)
- `.obsidian/` y `remotion-video/node_modules/` agregados a .gitignore
- **Todos los jobs pasan: Lint ✅ TypeCheck ✅ UnitTests ✅**

### RLS habilitado en todas las tablas públicas ✅
- 17 tablas con RLS habilitado via Supabase MCP
- App usa `service_role` → bypassa RLS, sin cambios en comportamiento
- 0 CRITICAL advisors (eran 17)

### Email: Brevo → Resend ✅
- **Problema:** Brevo IP whitelist requiere plan de pago
- **Solución:** Migrado a Resend (3,000 emails/mes gratis, sin IP whitelist)
- Dominio `onia.com.bo` verificado en Resend
- Supabase SMTP: `smtp.resend.com:465`, user `resend`, sender `business@onia.com.bo`
- Emails de confirmación Supabase Auth funcionando en producción

### Auth redirect fix ✅
- **Bug:** Login redirigía a landing page (`/`) en vez de `/dashboard`
- **Root cause:** `app/auth/callback/route.ts:7` — default `?? "/setup"` enviaba usuarios con perfil existente a `/setup`, que luego redirigía a `/`
- **Fix:** Cambiado a `?? "/dashboard"` — usuarios existentes → dashboard, nuevos → caught by layout guard → `/setup`

---

---

## 2026-05-25 — n8n Workflows GestiOS + Migraciones Supabase + Fix Build

### Migraciones Supabase aplicadas ✅
- `prisma/migrations/20260523150000_add_notifications/migration.sql` — tabla `notifications` con índice compuesto
- `prisma/migrations/add_user_sessions` — tabla `UserSession` para gestión de dispositivos activos

### Fix build Vercel ✅
- **Bug:** `Profile.email does not exist in type 'ProfileSelect<DefaultArgs>'`
- **Causa:** `Profile` no tiene campo `email` (removido per AGENTS.md)
- **Fix:** `app/api/superadmin/organizations/[id]/whatsapp-addon/route.ts` — `select: { email: true }` → `select: { userId: true }`, `adminEmail` → `adminUserId`
- **Trigger n8n WF-GS-05:** `app/api/setup/route.ts` — fire-and-forget al crear nueva org (org ID, nombre, plan, businessType, slug)

### n8n Workflows GestiOS creados y activados ✅

#### WF-GS-02 — Plan Expiry WA (`xx4wzzzqZBGfu836`)
- **Trigger:** Cron diario 12pm
- **Función:** Busca orgs con `planExpiresAt` en ≤7 días + phone no nulo → manda WA usando credenciales del tenant en `org_addons`
- **Flujo:** `Calc Dates` → `Fetch Expiring Orgs` (Supabase REST) → `For Each Org` (batch=5) → `Fetch WA Addon` → `Send WA Expiry` (Meta Graph API v20.0)
- **Estado:** 🟢 Activo

#### WF-GS-03 — Birthday WA (`qOVpQwPZplQKYkMc`)
- **Trigger:** Cron diario 1pm
- **Función:** Busca todos los clientes con birthday + phone → filtra por mes/día == hoy (Code node) → manda WA usando credenciales del tenant
- **Flujo:** `Fetch Customers` (limit 1000) → `Filter Birthdays Today` (Code node, month+day match) → `Split In Batches` (batch=10) → `Fetch WA Addon` → `Send Birthday WA`
- **Estado:** 🟢 Activo

#### WF-GS-04 — Weekly Admin Digest (`6oowIHo8G9baBOYc`)
- **Trigger:** Cron lunes 9am
- **Función:** Fetch cross-tenant stats (orgs activas, nuevas, ventas ENTREGADO) → arma digest → email a `business@onia.com.bo`
- **Flujo:** 3 ramas paralelas (`fetchOrgStats`, `fetchNewOrgs`, `fetchRevenueStats`) → `buildDigest` (Code node) → `sendAdminEmail` (Resend API)
- **Credenciales hardcodeadas:** Supabase service role key + Resend API key (n8n VPS — sin soporte de variables)
- **Email:** `noreply@onia.com.bo` → `business@onia.com.bo`
- **Estado:** 🟢 Activo

### Documentación n8n actualizada
- `docs/N8N-SETUP.md` — Sección GestiOS Workflows agregada

---

## Pendiente para próximo deploy

### Requiere acción externa
1. **Aplicar migración de Purchase Orders a Supabase**
   - SQL en `prisma/migrations/20260513120000_add_purchase_orders/migration.sql`
   - Ejecutar en Supabase SQL Editor o con `npx prisma db push`

2. **Configurar env vars en Vercel**
   - `GESTIOS_API_KEY` — Para n8n purchase order automation

3. **Importar workflows n8n**
   - `n8n/brevo-email-tracking.json` (actualizado)
   - `n8n/brevo-email-tracking-polling.json` (actualizado)
   - `n8n/purchase-order-automation.json` (nuevo)

### Próximo sprint recomendado
1. Tests de integración para purchase orders
2. Tests de integración para export contable
3. Landing page: agregar screenshots reales del producto
4. Onboarding: tour interactivo + sample data auto-generado
5. Analytics: PostHog o similar

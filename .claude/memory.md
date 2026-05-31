# GestiOS — Memoria del proyecto

SaaS POS multi-tenant para negocios bolivianos. Cada query filtra por `organizationId`.

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Prisma 7 · Supabase · Tailwind CSS 4 (inline @theme, sin tailwind.config).

## Locale / negocio
- Locale `es-BO`, moneda `Bs.`
- Planes: Básico 350 / Crecer 530 / Pro 800 / Empresarial 1250 BOB
- Producción: gesti-os.vercel.app

## Auth
- `getTenantProfile()` en `lib/auth.ts` (Supabase Auth)
- Crons protegidos con `CRON_SECRET` bearer, comparación timing-safe (`lib/cron-auth.ts` → `verifyCronSecret`)

## Convenciones
- Envelope API: `{ success, data, error }`
- Antes de commit: `npm run build` (NO solo tsc) + tests verdes
- 386 tests (vitest, 26 archivos). Mantener cobertura.

## Design system
- Dark theme (`color-scheme: dark`)
- Acento kinetic orange `#FF6B00`, growth green `#00af74`
- Fonts: Space Grotesk (display) + Manrope (sans)
- Utils: `glass-panel`, animación `animate-pop` con `prefers-reduced-motion`

## Features completas
- Core: POS, inventario, clientes, pedidos, reportes, tienda online, WhatsApp backend, n8n workflows
- Centro notificaciones (`/api/notifications/*` + `NotificationBell.tsx`)
- UI sesiones activas (`settings/sessions/page.tsx` + `/api/sessions`)
- Onboarding tour (`OnboardingTour.tsx`, gate localStorage `gestios_onboarding_v1`)

## Gaps conocidos
- `isCurrent` de sesiones = heurística "más reciente" (Supabase no expone token-hash)
- E2E POS (venta autenticada) aún sin spec — pendiente (requiere seed de auth)

## E2E (Playwright)
- `@playwright/test` ^1.60, config `playwright.config.ts` (chromium, webServer `npm run dev`)
- Scripts: `npm run test:e2e`, `npm run test:e2e:install` (instala browser)
- Specs en `tests/e2e/`:
  - `landing.spec.ts` — smoke landing
  - `storefront-checkout.spec.ts` — flujo tienda + invariantes API (precio manipulado→400, body inválido→400). Mapea a evals/critical-flows.json (checkout-price-tamper)
- Guard: requiere env `STORE_SLUG` (tienda sembrada); se omite sin él. Skip en `NODE_ENV=production` (no crea pedidos reales)
- testids agregados en `app/[slug]/tienda/page.tsx`: cart-button, product-card, add-to-cart, open-checkout, checkout-name/email/phone/address, confirm-order, checkout-error, order-success

## Planes futuros
- E2E POS autenticado: fixture de login Supabase + org sembrada → venta completa
- E2E checkout-stock-race: 2 requests paralelas a stock=1 → 1×201 + 1×409 (necesita seed determinístico)
- CI: workflow GitHub Actions corriendo test:e2e contra preview Vercel con STORE_SLUG de prueba
- Cerrar último gap harness-audit: instalar plugin ECC (nivel usuario)

## Reglas críticas
- NO inventar URLs/APIs/datos externos sin verificar
- Autonomía vía MCPs antes de pedir acción manual
- `security-review` BLOQUEANTE en cambios auth/pagos/datos sensibles
- n8n VPS plan: sin `$env.*`, usar credenciales n8n o hardcode

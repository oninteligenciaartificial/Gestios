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
- Sin tests E2E (POS, checkout) — pendiente
- `isCurrent` de sesiones = heurística "más reciente" (Supabase no expone token-hash)

## Reglas críticas
- NO inventar URLs/APIs/datos externos sin verificar
- Autonomía vía MCPs antes de pedir acción manual
- `security-review` BLOQUEANTE en cambios auth/pagos/datos sensibles
- n8n VPS plan: sin `$env.*`, usar credenciales n8n o hardcode

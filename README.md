# GestiOS

SaaS multi-tenant de gestión comercial para negocios bolivianos. Punto de venta, inventario, clientes, pedidos, reportes y automatizaciones desde una sola plataforma.

**Producción:** https://gestioshq.app

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Email | Resend (dominio `onia.com.bo`) |
| WhatsApp | Meta Business API v20.0 |
| Automatizaciones | n8n (self-hosted) |
| Monitoring | Sentry + PostHog |
| Deploy | Vercel |
| Rate limiting | Upstash Redis + in-memory fallback |

---

## Módulos

| Módulo | Ruta | Plan mínimo |
|---|---|---|
| Dashboard (KPIs, alertas, onboarding) | `/dashboard` | Todos |
| Punto de Venta | `/pos` | Todos |
| Inventario + variantes | `/inventory` | Todos |
| Pedidos (CRUD, estados, email) | `/orders` | Todos |
| Clientes (CRM, loyalty points) | `/customers` | Todos |
| Categorías | `/categories` | Todos |
| Descuentos | `/discounts` | Todos |
| Corte de caja | `/caja` | Todos |
| Ventas (historial) | `/ventas` | Todos |
| Equipo / Staff | `/staff` | Todos |
| Sesiones activas | `/settings/sessions` | Todos |
| Reportes + exportación | `/reports` | CRECER |
| Proveedores | `/suppliers` | CRECER |
| Órdenes de compra | `/purchase-orders` | CRECER |
| Tienda online pública | `/{slug}/tienda` | PRO |
| Página de registro pública | `/registro/{slug}` | PRO |
| Sucursales | `/branches` | EMPRESARIAL |
| Auditoría | `/audit` | EMPRESARIAL |
| WhatsApp / Conversaciones | `/conversations` | Add-on |
| Panel superadmin | `/superadmin` | SUPERADMIN |

---

## Planes

| Plan | BOB/mes | Productos | Clientes | Staff |
|---|---|---|---|---|
| Básico | 350 | 150 | 50 | 1 |
| Crecer | 530 | 500 | 300 | 3 |
| Pro | 800 | ∞ | ∞ | 10 |
| Empresarial | 1.250 | ∞ | ∞ | ∞ |

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Generar tipos de Prisma (no requiere DB local)
npx prisma generate

# Dev server
npm run dev
```

> **No hay `.env` local.** La DB vive en Supabase. No ejecutar `prisma migrate dev`.
> Ver `docs/ARCHITECTURE.md` para reglas críticas.

### Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Dev server en localhost:3000 |
| `npm run build` | `prisma generate` + `next build` |
| `npm run test` | Vitest (411 tests) |
| `npm run lint` | ESLint |

---

## Variables de entorno (Vercel)

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
EMAIL_FROM_ADDRESS          # noreply@onia.com.bo
EMAIL_FROM_NAME             # GestiOS
BREVO_WEBHOOK_KEY           # Webhook signing para eventos legacy
WA_PHONE_NUMBER_ID
WA_ACCESS_TOKEN
WA_APP_SECRET
SENTRY_AUTH_TOKEN
UPSTASH_REDIS_REST_URL      # opcional
UPSTASH_REDIS_REST_TOKEN    # opcional
```

---

## Estructura de carpetas clave

```
app/
├── (dashboard)/    # Rutas autenticadas (sidebar, plan check)
├── api/            # Route handlers Next.js
├── [slug]/tienda/  # Storefront público
└── registro/       # Página de registro pública
lib/
├── auth.ts         # getTenantProfile() — contexto de request
├── plans.ts        # Feature gates + límites por plan
├── permissions.ts  # RBAC (hasPermission)
├── prisma.ts       # Singleton PrismaClient
└── email.ts        # Envío Resend + logging + rate limiting
prisma/
├── schema.prisma   # Fuente de verdad DB
└── migrations/     # SQL versionado
docs/               # Documentación técnica completa
tests/              # Vitest — 411 tests
```

---

## Documentación

| Archivo | Contenido |
|---|---|
| `AGENTS.md` | Reglas obligatorias para agentes antes de tocar el repo |
| `docs/ORCHESTRATOR.md` | Protocolo práctico para plan, skills, MCPs, subagentes y validación |
| `docs/SKILLS_ROUTING.md` | Selección de skills reales por tipo de tarea |
| `docs/AGENT_WORK_ORDER.md` | Coordinación multi-agente por frentes |
| `docs/AGENT_RELEASE_PLAYBOOK.md` | Guia de cierre: skills por frente, gates, deploy y plan futuro |
| `docs/GITHUB_REPO_RESEARCH.md` | Repos verificados para producto y fuentes aprobadas de skills externas |
| `docs/00-PROJECT-CONTEXT.md` | Contexto para sesiones Claude — pegar al inicio |
| `docs/ARCHITECTURE.md` | Estructura técnica, auth flow, multi-tenancy |
| `docs/DATABASE.md` | Todos los modelos Prisma |
| `docs/API_REFERENCE.md` | Todos los endpoints |
| `docs/BUSINESS_TYPES.md` | Variantes por tipo de negocio |
| `docs/EMAILS.md` | 12 tipos de email automático |
| `docs/BILLING-FLOW.md` | Flujo de pagos BCP Bolivia |
| `docs/env-vars-reference.md` | Variables de entorno y donde configurarlas sin exponer secretos |
| `docs/DENTALGEST_REUSE_AUDIT.md` | Auditoria de funciones utiles portadas desde DentalGest |
| `docs/QR-BOLIVIA.md` | Pagos QR Bolivia |
| `docs/SIAT-BOLIVIA.md` | Archivo histórico; SIAT no se vende en el alcance actual |
| `docs/N8N-SETUP.md` | Workflows n8n |
| `docs/MONITORING_REPAIR_FLOW.md` | Flujo Sentry/n8n/GitHub Issue/Codex para errores de produccion |
| `docs/SECURITY_REPORT.md` | Reporte de seguridad |
| `docs/NEXT_STEPS.md` | Estado del proyecto + log de cambios |
| `README-admin.md` | Guía de usuario para administradores |

---

## Multi-tenancy

Cada query a la DB lleva `where: { organizationId: profile.organizationId }`. RLS habilitado en `public.profiles`. El aislamiento del resto es a nivel de aplicación.

```typescript
// Patrón de API route
const profile = await getTenantProfile();
if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

const data = await prisma.model.findMany({
  where: { organizationId: profile.organizationId }
});
```

---

## Automatizaciones n8n activas

| Workflow | Trigger | Acción |
|---|---|---|
| WF-GS-02 | Diario 12pm | Alerta plan próximo a vencer por WhatsApp |
| WF-GS-03 | Diario 1pm | Felicitación de cumpleaños por WhatsApp |
| WF-GS-04 | Lunes 9am | Digest semanal de métricas a admin |
| WF-GS-05 | Email BCP recibido | Confirmación automática de pago |

---

## Cron jobs (Vercel)

| Job | Horario | Acción |
|---|---|---|
| `/api/cron/birthday` | `0 9 * * *` | Email cumpleaños con descuento |
| `/api/cron/expiry` | `0 8 * * *` | Alerta productos próximos a vencer |
| `/api/cron/inactive-customers` | `0 10 * * *` | Email clientes inactivos (30+ días) |
| `/api/cron/plan-expiry` | `0 7 * * *` | Alerta y suspensión de planes |
| `/api/cron/low-stock` | `30 8 * * *` | Alerta stock bajo a admins |
| `/api/cron/expire-qr` | `0 0 * * *` | Expira QRs de pago vencidos |

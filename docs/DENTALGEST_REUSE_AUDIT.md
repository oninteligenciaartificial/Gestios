# Auditoria de reutilizacion DentalGest -> GestiOS

Fecha: 2026-06-06

## Objetivo

Usar la documentacion de DentalGest como referencia para mejorar GestiOS sin copiar funcionalidades clinicas que no aplican. Esta auditoria registra que se reviso, que se porto y que queda como backlog util.

## Fuentes revisadas

- `C:\dev\proyectos\DentaGest\dental-saas\docs\GESTIOS_IMPLEMENTATION_HANDOFF.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\VERSION_1_0_READINESS.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\CREDENTIALS_GUIDE.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\GOOGLE_OAUTH_SETUP.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\DATA_MANAGEMENT.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\SENTRY_AUTOFIX_RUNBOOK.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\n8n-automation.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\PRICING.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\PLAN_LIMITS.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\WHATSAPP_MULTITENANT.md`
- `C:\dev\proyectos\DentaGest\dental-saas\docs\WHATSAPP_ADDON_ADMIN.md`

No se agregaron dependencias nuevas. Para `sitemap.ts` se consulto la documentacion local de Next.js 16 en `node_modules/next/dist/docs`.

## Cambios portados ahora

| Area | Cambio en GestiOS | Motivo |
|---|---|---|
| OAuth Google | Cookie temporal `gestios_oauth_next` y rescate de callback en `/` con `?code=...` hacia `/auth/callback` | Evita que un callback mal dirigido deje al usuario en landing con codigo OAuth visible. |
| OAuth Google | Nota visible en login/signup: Google puede mostrar Supabase como proveedor seguro | Reduce friccion de confianza mientras no exista custom auth domain. |
| OAuth Google | Limpieza de cookie temporal al terminar `/auth/callback` | Evita destinos viejos en futuros intentos de login. |
| SEO | `app/sitemap.ts` con rutas publicas reales de GestiOS | Cubre el checklist de base comercial: sitemap disponible en produccion. |
| SEO | `public/robots.txt` apunta a `https://gestioshq.app/sitemap.xml` | El robots anterior apuntaba al dominio Vercel viejo. |
| Documentacion | `README.md` actualizado a `https://gestioshq.app` y 411 tests | Mantiene la fuente publica alineada con el estado real. |

## Ya cubierto en GestiOS

| Bloque DentalGest | Estado en GestiOS |
|---|---|
| Reglas de agentes y orquestador | Existe `AGENTS.md`, `docs/ORCHESTRATOR.md`, `docs/SKILLS_ROUTING.md`, `docs/AGENT_WORK_ORDER.md`. |
| Landing y pricing | Existe landing negra, pricing, CTA, login y registro. |
| Auth email/password + reset + Google | Existe Supabase Auth con callback y setup de tenant. |
| Multi-tenant | Existe `Organization` + `Profile`; reglas obligan `organizationId`. |
| Planes y limites | Existe `lib/plans.ts` con BASICO, CRECER, PRO, EMPRESARIAL. |
| Cobro manual/QR | Existen endpoints de billing, payment requests y confirmacion por superadmin. |
| Superadmin | Existe panel de organizaciones, usuarios y pagos. |
| Sentry + autofix | Existe `docs/SENTRY_AUTOFIX_RUNBOOK.md` y `docs/MONITORING_REPAIR_FLOW.md`. |
| n8n | Existe documentacion y auditoria de workflows en `docs/N8N_WORKFLOW_AUDIT.md`. |
| WhatsApp como add-on | Existe `lib/whatsapp.ts`, conversaciones y variables opcionales. |

## No portado por ser dental-especifico

- Pacientes, odontograma, tratamientos, agenda clinica y recordatorios de limpieza.
- Copy de "clinica", "doctor", "paciente" o precios DentalGest.
- Workflows n8n atados a citas o pacientes.
- Planes `free/basic/professional/clinic`; GestiOS mantiene BASICO/CRECER/PRO/EMPRESARIAL.

## Backlog util recomendado

### P1 - Comercial y confianza

- Crear `docs/env-vars-reference.md` especifico de GestiOS, tomando `.env.example` como fuente, sin secretos.
- Crear guia Google OAuth propia de GestiOS con:
  - dominio `gestioshq.app`;
  - callback Supabase real;
  - nota sobre `supabase.co` hasta tener custom auth domain.
- Actualizar copy de pricing para indicar explicitamente que SIAT/QR/WhatsApp dependen de configuracion externa real.

### P1 - Seguridad y operacion

- Ampliar test unitario o integration test para `sanitizeOauthNext()` y callback OAuth.
- Validar en Supabase real:
  - redirect URLs de `gestioshq.app`;
  - Google provider activo;
  - Site URL productivo.
- Probar un login Google real en produccion con usuario existente y usuario nuevo.

### P2 - Automatizaciones

- Adaptar los workflows n8n comerciales de DentalGest solo si existen datos equivalentes:
  - aviso de fin de trial;
  - alerta de pago pendiente;
  - reporte semanal para negocio;
  - reconciliacion de pagos.
- No portar workflows de pacientes/citas.

### P2 - Add-ons

- Definir matriz comercial final de add-ons GestiOS:
  - WhatsApp operativo;
  - usuario extra;
  - onboarding/migracion de datos;
  - SIAT;
  - QR Bolivia.
- Mantener como "configuracion requerida" cualquier add-on que dependa de Meta, SIAT, PSP externo o credenciales no validadas.

## Criterio de cierre

Esta ronda cierra mejoras generales de bajo riesgo. El resto queda como backlog porque requiere una de estas condiciones:

- credenciales reales;
- proveedor externo validado;
- cambio comercial;
- migracion de base de datos;
- prueba manual en produccion.

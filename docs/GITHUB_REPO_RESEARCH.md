# GitHub repo research - 2026-06-12

## Alcance

Busqueda de repositorios publicos utiles para GestiOS, con foco en Next.js, SaaS, Supabase/Postgres, Prisma, e-commerce, observabilidad y operacion en Vercel.

Nota de herramienta: el plugin GitHub fue solicitado, pero no expuso una herramienta callable en esta sesion. Se uso `gh` local (`gh version 2.92.0`) para consultar repositorios publicos y evitar URLs inventadas.

## Stack de skills usado

- `codebase-onboarding`: mapear estructura, stack, entradas y convenciones.
- `backend-patterns`: contrastar backlog de API, seguridad y multi-tenant.
- `api-and-interface-design`: preservar contratos estables y validacion en bordes.
- `careful` / `guard`: evitar acciones destructivas o sensibles.
- `ui-styling`: aplicar mejoras de accesibilidad y targets tactiles sin redisenar el producto.

## Repositorios de valor

| Repo | Valor para GestiOS | Uso recomendado |
|---|---|---|
| [vercel/next.js](https://github.com/vercel/next.js) | Fuente primaria de Next.js. | Revisar cambios de App Router, build, Link, server/client boundaries y Turbopack antes de tocar Next 16. |
| [supabase/supabase](https://github.com/supabase/supabase) | Fuente primaria de Supabase, Auth y Postgres platform. | Patrones de Auth, storage, RLS y edge/runtime docs. |
| [vercel/commerce](https://github.com/vercel/commerce) | Referencia mantenida de storefront con Next.js. | UI y flujo de tienda publica, carrito, producto y checkout. No copiar integracion Shopify. |
| [dubinc/dub](https://github.com/dubinc/dub) | SaaS Next.js grande con Prisma, Tailwind, Vercel y Upstash. | Patrones de dashboard, observabilidad, rate limiting, multi-tenant operativo y DX. |
| [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit) | SaaS starter empresarial vivo. | Ideas para onboarding B2B, equipos, roles, settings y arquitectura SaaS. |
| [shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy) | Referencia historica de App Router, Prisma, Tailwind y componentes. | Patrones de UI y estructura, con cautela por antiguedad del stack. |
| [calcom/cal.diy](https://github.com/calcom/cal.diy) | Producto SaaS open source grande con Next.js, Postgres, Prisma, Zod y Tailwind. | Patrones de producto, permisos, settings, tests y operacion de app compleja. |

## Repositorios de skills y agentes

Estos repos son utiles para ampliar el stack de skills, pero no deben instalarse en bloque. Antes de incorporar una skill: leer `SKILL.md`, revisar scripts/hooks, confirmar permisos, y adaptar a las reglas de GestiOS.

Inventario local revisado:

- `C:\Users\PC\.claude\skills`: contiene las skills principales usadas por GestiOS: `frontend-patterns`, `nextjs-turbopack`, `ui-ux-pro-max`, `impeccable`, `backend-patterns`, `api-design`, `database-migrations`, `postgres-patterns`, `security-review`, `qa`, `qa-only`, `ship`, `review`, `document-generate`, `documentation-lookup`, entre otras.
- `C:\Users\PC\.codex\skills`: contiene skills complementarias para Codex: `api-and-interface-design`, `browser-testing-with-devtools`, `code-review-and-quality`, `security-and-hardening`, `test-driven-development`, `next-best-practices`, `next-cache-components`, `playwright`, `vercel-optimize`, entre otras.
- Conclusion: no falta ninguna skill critica para el routing actual. Las externas se deben evaluar por tarea, no instalar por defecto.

| Repo | Tipo | Valor para GestiOS | Cautela |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Skills oficiales | Repositorio publico oficial de Agent Skills; fuente primaria para skills generales de alta confianza. | Revisar cada skill y su compatibilidad con Codex/GestiOS antes de copiarla. |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Plugins/skills oficiales | Fuente oficial de plugins Claude Code con skills y MCPs de calidad. | Verificar compatibilidad con Codex antes de portar instrucciones. |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Skills oficiales Vercel | Skills oficiales para Next.js, React, frontend, web design y Vercel. Muy relevante para Next.js 16 y UI. | Usar como referencia o skill puntual; no saltarse `node_modules/next/dist/docs/` para Next 16. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | Skills de ingenieria | Muchas skills locales tienen `origin: ECC`; util para engineering, seguridad, testing, migraciones y patrones. | Es amplio; copiar solo skills puntuales y versionadas. |
| [trailofbits/skills](https://github.com/trailofbits/skills) | Seguridad | Skills para auditoria, vulnerabilidades y security research. Muy relevante para multi-tenant, auth, uploads y webhooks. | Revisar alcance para evitar scans ruidosos o dependencias externas no deseadas. |
| [SawyerHood/dev-browser](https://github.com/SawyerHood/dev-browser) | Browser/QA | Skill de navegador basada en Playwright; util para QA visual y flujos locales. | En esta sesion ya existe Browser plugin; evitar duplicar capacidades. |
| [skills-directory/skill-codex](https://github.com/skills-directory/skill-codex) | Orquestacion Claude/Codex | Skill para delegar prompts a Codex desde Claude Code; util como referencia de handoffs multi-agente. | No necesaria dentro de Codex si ya estamos en Codex. |
| [daymade/claude-code-skills](https://github.com/daymade/claude-code-skills) | Marketplace/coleccion | Catalogo de skills listas para workflows de desarrollo. | Marketplace: auditar cada skill individualmente. |
| [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills) | Full-stack skills | Coleccion de skills para desarrollo full-stack; puede aportar testing, frontend y backend. | Adaptar a Next.js 16/React 19/Prisma 7; no asumir versiones. |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Awesome list | Indice grande para descubrir skills, herramientas y workflows compatibles con Claude/Codex/Cursor. | Catalogo, no fuente directa de instalacion. |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | Subagentes | Ideas para dividir trabajo por roles: backend, frontend, security, QA, docs. | Convertir a roles del `docs/AGENT_WORK_ORDER.md`, no usar sin filtro. |
| [dotcommander/cclint](https://github.com/dotcommander/cclint) | Linter de agentes/skills | Puede servir para revisar formato de agents, commands y skills antes de incorporarlos. | Proyecto pequeno; validar madurez antes de usar en CI. |
| [softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit) | Skills multi-agente | Coleccion SKILL.md-compatible para desarrollo, docs y planning. | Revisar scripts y permisos; tomar solo piezas compatibles. |
| [mxyhi/ok-skills](https://github.com/mxyhi/ok-skills) | Skills/AGENTS playbooks | Playbooks y skills para Codex, Claude Code, Cursor y OpenClaw. | Bueno para inspiracion de AGENTS.md, pero GestiOS ya tiene reglas fuertes. |
| [livekit/agent-skills](https://github.com/livekit/agent-skills) | Skills voice AI | Relevante solo si GestiOS incorpora voz/telefonia/voice agents. | No aplica al alcance actual de piloto; no instalar por ahora. |

## Skills externas prioritarias a evaluar

1. Seguridad avanzada desde [trailofbits/skills](https://github.com/trailofbits/skills): auth, upload, webhooks, multi-tenant, secrets.
2. Next.js/React/Vercel desde [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), siempre contrastado con docs locales de Next 16.
3. Skills oficiales generales desde [anthropics/skills](https://github.com/anthropics/skills) y [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official).
4. Engineering/testing desde [affaan-m/ECC](https://github.com/affaan-m/ECC): `security-review`, `frontend-patterns`, `nextjs-turbopack`, `postgres-patterns`, `qa`.
5. Browser QA desde [SawyerHood/dev-browser](https://github.com/SawyerHood/dev-browser) solo si el Browser plugin local queda corto.
6. Lint/validacion de skills desde [dotcommander/cclint](https://github.com/dotcommander/cclint), evaluando madurez antes de CI.
7. Subagentes por frente desde [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents), traducidos al ownership de GestiOS.

## Hallazgos aplicados

- El backlog local ya es mas confiable que las plantillas SaaS genericas para decidir prioridades.
- No conviene agregar dependencias nuevas por ahora.
- Primer frente desarrollado: accesibilidad y touch targets en tienda publica y clientes.
- Backlog actualizado: hardening de upload QR Bolivia ya estaba resuelto en codigo y tests.

## Siguientes repos a consultar por tarea

- Para cambios Next.js 16: `node_modules/next/dist/docs/` primero, luego [vercel/next.js](https://github.com/vercel/next.js).
- Para Supabase/Auth/RLS/storage: [supabase/supabase](https://github.com/supabase/supabase) y docs oficiales antes de tocar implementacion.
- Para storefront: [vercel/commerce](https://github.com/vercel/commerce) como referencia de UX, sin incorporar Shopify.
- Para SaaS operacion y dashboards: [dubinc/dub](https://github.com/dubinc/dub), [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit) y [calcom/cal.diy](https://github.com/calcom/cal.diy).

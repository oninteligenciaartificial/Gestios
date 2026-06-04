# Skills routing para GestiOS

## Regla obligatoria

Antes de ejecutar cualquier accion, el agente debe:

1. Identificar el tipo de tarea.
2. Buscar si existe una skill aplicable en:
   - `C:\Users\PC\.claude\skills`
   - `C:\Users\PC\.codex\skills`
3. Leer el `SKILL.md` de cada skill aplicable.
4. Seguir esa skill antes de modificar codigo, correr acciones destructivas, hacer deploy o declarar terminado.
5. Si una skill mencionada no existe, no inventarla: usar la equivalente real o decir que no esta instalada.

## Skills por tipo de tarea

| Tarea | Skills a consultar antes |
|---|---|
| Planificacion o feature compleja | `make-plan`, `autoplan`, `plan-ceo-review`, `plan-eng-review` |
| Implementacion React/Next | `frontend-patterns`, `nextjs-turbopack` |
| UI, diseno, responsive, accesibilidad | `ui-ux-pro-max`, `impeccable`, `ui-styling`, `design-review` |
| API routes, server actions, middleware | `backend-patterns`, `api-design` |
| Prisma, Supabase, migraciones | `database-migrations`, `postgres-patterns` |
| Seguridad, auth, pagos, multi-tenant, datos cliente | `security-review`, `guard`, `careful` |
| Debugging o bug incierto | `investigate`, `careful` |
| QA visual o app real | `qa`, `qa-only`, `e2e-testing`, `click-path-audit` |
| Deploy, release, PR | `ship`, `land-and-deploy`, `deployment-patterns`, `review` |
| Documentacion | `document-generate`, `documentation-lookup`, `document-release` |
| Contexto largo o continuidad | `context-save`, `context-restore`, `context-budget` |

## Orden minimo antes de modificar codigo

1. Leer `AGENTS.md`.
2. Leer este archivo.
3. Para tareas amplias, release o multi-area, leer `docs/ORCHESTRATOR.md` y `docs/AGENT_WORK_ORDER.md`.
4. Leer la skill aplicable.
5. Leer docs locales de Next.js 16 si toca Next:
   - `node_modules/next/dist/docs/`
6. Inspeccionar archivos existentes.
7. Recien despues planificar o ejecutar.

## Reglas especificas de GestiOS

- No inventar APIs, paquetes, proveedores, URLs ni servicios externos.
- No agregar campos a Prisma sin migracion SQL y confirmacion en Supabase.
- No tocar `lib/prisma.ts` para quitar lazy initialization.
- Todo query multi-tenant debe filtrar por `organizationId`.
- Para auth/API usar `getTenantProfile()` desde `lib/auth.ts`.
- Para emails mantener fire-and-forget con `.catch(() => {})`.
- Para Zod 4 usar `z.record(z.string(), valueType)`.
- Para Next.js 16 revisar docs locales antes de cambiar routing, build, Link, config o server/client boundaries.

## Gates antes de declarar terminado

Ejecutar, como minimo:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Si toca flujo critico como POS, tienda, checkout, ventas, auth o billing, agregar:

```bash
npm run test:e2e
```

## Skills inexistentes detectadas

No asumir que existen estas skills como comandos instalados directos:

- `/tdd`
- `/build-fix`
- `/verify`
- `/code-review`

Equivalentes reales recomendados:

- TDD/testing: `e2e-testing`, `qa`, `qa-only`, y tests Vitest del repo.
- Build roto: `investigate`, `nextjs-turbopack`, `careful`.
- Verificacion: `qa`, `qa-only`, `e2e-testing`.
- Code review: `review`, `security-review`.

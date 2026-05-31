@AGENTS.md

---

## ORDEN OBLIGATORIA — Skills automáticas por tipo de tarea

**Invocar estas skills SIN que el usuario lo pida.** No es opcional. Cuando la tarea encaje, usar la skill ANTES de cualquier código o respuesta.

| Si la tarea es... | Invocar AUTOMÁTICAMENTE |
|-------------------|-------------------------|
| Implementar feature/refactor complejo | `/plan` → luego `/tdd` |
| Escribir/modificar código React/Next | `frontend-patterns` + `nextjs-turbopack` |
| API route / server action / middleware | `backend-patterns` |
| Migración Prisma o cambio de schema | `database-migrations` |
| Query SQL / optimización / RLS | `postgres-patterns` |
| Cualquier trabajo de UI (componente, página, estilo) | `ui-ux-pro-max` + `impeccable` |
| Tras escribir/modificar código | `code-review` |
| Auth, pagos, datos de cliente, multi-tenant | `security-review` (BLOQUEANTE antes de commit) |
| Build falla | `build-fix` |
| Confirmar que algo funciona en la app real | `verify` |
| Flujos críticos (POS, checkout, ventas) | `e2e-testing` |
| Limpieza de código muerto | `refactor-clean` |

**Reglas de orden:**
1. Skills de proceso primero (`plan`, `tdd`, `debugging`), luego de implementación.
2. `security-review` es BLOQUEANTE en cualquier cambio de auth/pagos/datos sensibles. No commitear sin pasarla.
3. Todo cambio de código pasa por `code-review` antes de declarar terminado.
4. Mantener disciplina TDD: 386 tests existentes, no bajar cobertura.
5. Antes de commit: build verde + tsc 0 + tests verdes. Ejecutar SIEMPRE `npm run build`, no solo `tsc` (tsc no captura errores de Next build).

---

## Regla crítica — Autonomía vía MCPs

**ANTES de pedirle al usuario que haga algo manualmente**, intentar hacerlo por medios propios:

1. **Verificar qué MCPs están disponibles** para la tarea (Supabase, Vercel, n8n, GitHub, computer-use, Chrome, etc.)
2. **Ejecutarlo directamente** si el MCP lo permite
3. **Si falta un MCP** que resolvería el problema: pedirle al usuario que lo conecte, explicando cuál y para qué
4. Solo pedir acción manual cuando no exista MCP y no sea posible automatizarlo

Ejemplos:
- Aplicar migration SQL → usar Supabase MCP (`execute_sql`), no pedirle que lo haga en el dashboard
- Crear workflow → usar n8n MCP (`create_workflow_from_code`), no escribir instrucciones manuales
- Setear env vars en Vercel → el Vercel MCP no tiene esa tool → pedir al usuario o sugerir agregar MCP

---

## Regla crítica — NO inventar

**NUNCA fabricar** URLs, nombres de empresas, APIs, librerías, o cualquier dato externo que no puedas verificar en el código o en la web real.

Si no sabes si algo existe: decirlo explícitamente. Usar `/deep-research` o WebSearch antes de recomendar servicios de terceros.

---

## Stack
Next.js 16 · React 19 · TypeScript · Prisma · Tailwind

## Skills útiles para este proyecto

### Cuando vayas a implementar algo nuevo
- `/feature-dev` — flujo completo (plan → TDD → código → review)
- `/plan` — solo el plan, si quieres ver los pasos antes
- `/tdd` — escribe los tests primero

### Frontend
- `/frontend-patterns` — patrones React/Next.js (Server Components, hooks, forms)
- `/nextjs-turbopack` — guía Next.js 16 específica
- `/design-system` — componentes UI consistentes

### Backend / Base de datos
- `/backend-patterns` — server actions, API routes, middleware
- `/database-migrations` — migraciones Prisma
- `/postgres-patterns` — queries y optimización

### Antes de hacer commit
- `/code-review` — revisión general
- `/security-review` — auth, pagos, datos de usuarios
- `/verify` — verifica que todo funciona

### Si el build falla
- `/build-fix` — resolver errores de compilación

### Para respuestas más cortas
- `/caveman` — reduce tokens al ~25%

---
> Cheatsheet completa: `~/.claude/MY-SKILLS-CHEATSHEET.md`

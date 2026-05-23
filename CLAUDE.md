@AGENTS.md

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

@AGENTS.md

Antes de ejecutar acciones:

1. Leer `AGENTS.md`.
2. Leer `docs/SKILLS_ROUTING.md`.
3. Para trabajos amplios, multi-area, release o auditoria, leer `docs/ORCHESTRATOR.md` y `docs/AGENT_WORK_ORDER.md`.
4. Revisar `docs/AGENT_AUDIT_BACKLOG.md` y `docs/RELEASE_CANDIDATE.md` solo como snapshots de estado; verificar antes de confiar.

## Routing de skills

`docs/SKILLS_ROUTING.md` es la fuente precisa de skills reales y equivalentes.

No asumir que existen como comandos instalados directos:

- `/tdd`
- `/build-fix`
- `/verify`
- `/code-review`

Equivalencias recomendadas:

- TDD/testing: tests Vitest del repo, `e2e-testing`, `qa`, `qa-only`.
- Build roto: `investigate`, `debugging-and-error-recovery`, `nextjs-turbopack`, `careful`.
- Verificacion: `qa`, `qa-only`, `e2e-testing`, gates del repo.
- Code review: `review`, `code-review-and-quality`, `security-review`.

## Autonomia con herramientas

Antes de pedir una accion manual, revisar las herramientas y MCPs realmente disponibles en esta sesion. No afirmar que existe Supabase MCP, Vercel MCP, n8n MCP, GitHub MCP u otro conector si no esta visible.

Si una herramienta falta, explicar cual falta y para que serviria. Si la accion es sensible o destructiva, pedir confirmacion explicita.

## Gates antes de cerrar

Para cambios de codigo:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Para flujos criticos como POS, tienda, checkout, ventas, auth, billing, webhooks o superadmin:

```bash
npm run test:e2e
```

Para dependencias o seguridad:

```bash
npm audit --audit-level=high
```

No declarar verde un comando no ejecutado. Si un gate se omite por entorno, documentar la razon exacta.

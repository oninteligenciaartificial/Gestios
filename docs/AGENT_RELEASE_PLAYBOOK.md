# Agent Release Playbook

Guia operativa para que cualquier agente sepa que skills usar, como dividir el trabajo y que validar antes de cerrar o desplegar GestiOS.

## Orden obligatorio

1. Leer `AGENTS.md`, `docs/SKILLS_ROUTING.md`, `docs/AGENT_WORK_ORDER.md`, `docs/ORCHESTRATOR.md` y este playbook.
2. Revisar `git status --short` y separar cambios propios de cambios existentes.
3. Elegir skills y herramientas antes de tocar codigo.
4. Investigar documentacion oficial, GitHub o codigo fuente local antes de usar APIs, librerias o comandos no verificados.
5. Ejecutar el trabajo por frentes cuando el cambio sea amplio.
6. Registrar decisiones, riesgos, checks y pendientes en docs relevantes.
7. Correr gates antes de declarar listo.

## Stack de skills por frente

| Frente | Skills primarias | Cuando usarlas |
|---|---|---|
| Backend/Data | `backend-patterns`, `api-design`, `database-migrations`, `postgres-patterns`, `careful` | API routes, Prisma, Supabase, queries, ownership por `organizationId`, migraciones y consistencia de datos |
| Frontend/UX | `frontend-patterns`, `nextjs-turbopack`, `ui-ux-pro-max`, `impeccable`, `ui-styling`, `design-review` | Paginas, componentes, responsive, accesibilidad, textos visibles y flujos de usuario |
| Security/RLS | `security-review`, `guard`, `careful`, `postgres-patterns` | Auth, RBAC, RLS, webhooks, uploads, rate limits, secretos, pagos y endpoints publicos |
| QA/Release | `qa`, `qa-only`, `e2e-testing`, `review`, `ship`, `deployment-patterns` | Lint, typecheck, tests, E2E, build, auditoria, release candidate y deploy |
| Docs/Context | `document-generate`, `documentation-lookup`, `document-release`, `context-save`, `context-restore`, `context-budget` | README, runbooks, handoffs, decisiones tecnicas y continuidad de contexto |
| Investigacion/GitHub | `find-skills`, `documentation-lookup`, GitHub plugin o `gh` CLI | Buscar repos, validar skills externas y verificar referencias antes de proponer instalacion |

Si una skill no esta instalada, no inventarla. Usar una equivalente real listada en la sesion o documentar que falta.

## Skills externas

Usar primero las skills locales ya inventariadas en `docs/GITHUB_REPO_RESEARCH.md`.

Repos aprobados para evaluar skills puntuales:

- `anthropics/skills`
- `anthropics/claude-plugins-official`
- `vercel-labs/agent-skills`
- `affaan-m/ECC`
- `trailofbits/skills`
- `SawyerHood/dev-browser`
- `VoltAgent/awesome-claude-code-subagents`

Repos de listas o marketplace son solo para descubrimiento. No instalar colecciones completas. Antes de copiar una skill externa, leer su `SKILL.md`, revisar scripts, hooks, permisos, dependencias y pedir confirmacion si modifica `C:\Users\PC\.claude\skills`, `C:\Users\PC\.codex\skills` o configuracion global.

## Plan de ejecucion por release

1. Contexto: leer reglas, release candidate, backlog y docs de arquitectura.
2. Inventario: revisar diff, archivos no trackeados y ownership de cambios.
3. Seleccion: declarar skills/MCPs/herramientas aplicables.
4. Implementacion: cambios acotados por frente, sin refactors ajenos.
5. Validacion: correr gates completos y registrar errores reales.
6. Documentacion: actualizar backlog, release notes, instrucciones y proximos pasos.
7. Deploy: confirmar branch/commit, gates, URL objetivo y rollback antes de produccion.

## Gates de cierre

Para cambios de codigo:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Si toca POS, tienda, checkout, ventas, auth, billing, webhooks, superadmin o flujo critico:

```bash
npm run test:e2e
```

Para dependencias o seguridad:

```bash
npm audit --audit-level=high
```

No declarar un gate verde si falla. Reportar comando, error principal, causa probable y siguiente accion.

## Checklist de deploy

Antes de deploy productivo confirmar explicitamente:

- Branch y commit esperados.
- Gates ejecutados y resultado.
- URL objetivo, normalmente `https://gestioshq.app`.
- Si hay migraciones, SQL revisado y plan de aplicacion.
- Variables de entorno afectadas, si aplica.
- Plan de rollback.

Para el batch actual no se requieren migraciones ni cambios de variables. Rollback esperado: restaurar/promover el deployment anterior desde Vercel y revertir el commit si aparece regresion.

## Plan futuro

### Inmediato

- Consolidar cambios del release en commit limpio, excluyendo archivos no relacionados.
- Ejecutar gates completos desde el working tree final.
- Hacer preview deploy o produccion solo con confirmacion explicita.

### Corto plazo

- Agregar token de tracking no secuencial a `/api/pedido/[id]`.
- Validar URL explicita para SIAT y documentar proveedor real.
- Revisar RLS/policies reales en Supabase fuera del repo.
- Completar auditoria de accesibilidad/touch targets en modulos POS, tienda, clientes y checkout.
- Ejecutar E2E con creacion real de pedido solo contra tienda sandbox y con rollback definido.

### Mediano plazo

- Reforzar mutaciones tenant-scoped compartidas con helpers reutilizables.
- Revisar indices de consultas criticas en ventas, inventario, pedidos y reportes.
- Endurecer CSP, webhooks y comparaciones sensibles donde aplique.
- Consolidar runbooks de incidentes para Supabase, Vercel, Sentry, Upstash y n8n.
- Mantener `docs/GITHUB_REPO_RESEARCH.md` como registro vivo de repos evaluados.

## Bloqueos externos conocidos

- Supabase real: policies/RLS y datos productivos no se validan desde el repo.
- Upstash/Sentry/n8n: requieren credenciales y paneles reales.
- WhatsApp, SIAT y QR Bolivia: dependen de proveedores y credenciales reales.
- E2E con escritura real: requiere sandbox y plan de limpieza.

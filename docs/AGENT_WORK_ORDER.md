# Orden maestra de agentes para GestiOS

## Regla principal

Ningun agente trabaja solo en cambios importantes. Antes de ejecutar una tarea de producto, codigo, seguridad, deploy o documentacion, debe:

1. Leer `AGENTS.md`.
2. Leer `docs/SKILLS_ROUTING.md`.
3. Identificar su rol principal y los roles de apoyo necesarios.
4. Consultar las skills aplicables antes de modificar archivos.
5. Coordinar con los otros frentes cuando el cambio toque mas de un area.
6. Dejar evidencia: archivos revisados, archivos cambiados, comandos ejecutados y riesgos pendientes.

Si una tarea parece de una sola area pero toca auth, pagos, datos de cliente, multi-tenant, DB, UI critica o deploy, se considera tarea multi-agente.

## Equipos obligatorios

| Frente | Responsabilidad | Skills base |
|---|---|---|
| Backend/Data | API routes, Prisma, Supabase, queries, integraciones server-side | `backend-patterns`, `api-design`, `database-migrations`, `postgres-patterns` |
| Frontend/UX | Pantallas, componentes, responsive, accesibilidad, copy de producto | `frontend-patterns`, `nextjs-turbopack`, `ui-ux-pro-max`, `impeccable`, `ui-styling`, `design-review` |
| Security/RLS | Auth, RBAC, RLS, webhooks, uploads, rate limits, secretos, pagos | `security-review`, `guard`, `careful`, `postgres-patterns` |
| QA/Release | Tests, E2E, build, lint, release checklist, regresiones | `qa`, `qa-only`, `e2e-testing`, `review`, `ship`, `deployment-patterns` |
| Docs/Context | Documentacion operativa, changelog, runbooks, handoff entre sesiones | `document-generate`, `documentation-lookup`, `document-release`, `context-save`, `context-restore` |

## Orden de ejecucion conjunta

### 1. Intake compartido

Todos los frentes parten de la misma definicion:

- Objetivo del cambio.
- Alcance explicito.
- Fuera de alcance.
- Riesgos multi-tenant.
- Plan de verificacion.
- Dependencias externas reales o pendientes.

No se aceptan planes que digan "integrar proveedor" sin nombre, contrato, API, credenciales y documentacion verificada.

### 2. Auditoria inicial paralela

Antes de escribir codigo:

- Backend/Data revisa modelos, queries, rutas y contratos.
- Frontend/UX revisa flujos, estados, formularios, responsive y accesibilidad.
- Security/RLS revisa boundaries, permisos, secrets, webhooks y rate limits.
- QA/Release revisa tests existentes, comandos, fixtures y gaps.
- Docs/Context revisa documentacion que quedara obsoleta.

Cada frente entrega:

- Hallazgos P0/P1/P2.
- Archivos afectados.
- Comandos o pruebas necesarias.
- Riesgos que bloquean release.

### 3. Implementacion por ownership

Cada agente debe tener ownership claro y no pisar a otros:

- Backend/Data: `app/api/**`, `lib/**`, `prisma/**`, tests de logica server.
- Frontend/UX: `app/**/page.tsx`, `components/**`, estilos, textos visibles.
- Security/RLS: validaciones, permisos, rate limits, headers, webhooks, storage, RLS docs.
- QA/Release: tests, Playwright, scripts, CI, release checklist.
- Docs/Context: `docs/**`, `README*.md`, `CLAUDE.md`, handoff docs.

Si un cambio cruza ownership, se coordina antes de editar. Nadie revierte cambios de otro agente sin confirmacion explicita.

### 4. Revision cruzada obligatoria

Antes de declarar terminado:

- Backend/Data confirma que no hay queries sin `organizationId`.
- Security/RLS confirma auth/RBAC/RLS/secrets/rate limits.
- Frontend/UX confirma que no hay estados rotos ni textos falsos.
- QA/Release confirma comandos verdes.
- Docs/Context confirma que docs y README no contradicen el codigo.

## Gates de salida

Para cualquier cambio de codigo:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Para flujos criticos como POS, ventas, tienda, checkout, auth, billing, webhooks o superadmin:

```bash
npm run test:e2e
```

Para cambios de seguridad o dependencias:

```bash
npm audit --audit-level=high
```

Si un comando falla, no se declara terminado. Se registra:

- Comando fallido.
- Error principal.
- Agente owner.
- Siguiente accion.

## Reglas no negociables de GestiOS

- No inventar URLs, APIs, proveedores, paquetes npm, credenciales ni estados de deploy.
- No agregar campos a Prisma sin SQL de migracion y confirmacion de Supabase.
- No tocar `lib/prisma.ts` para quitar lazy initialization.
- Todo acceso a datos tenant debe filtrar por `organizationId`.
- En API routes usar `getTenantProfile()` salvo rutas publicas, cron, setup, webhooks o superadmin con auth propia.
- Emails siempre fire-and-forget con `.catch(() => {})`.
- Zod 4: `z.record(z.string(), valueType)`.
- Next.js 16: leer `node_modules/next/dist/docs/` antes de cambiar routing, config, server/client boundaries, `Link`, build o Turbopack.
- SIAT, PSP QR Bolivia y WhatsApp Business requieren credenciales/proveedores reales; si faltan, se documenta como configuracion pendiente.

## Formato de reporte de cada agente

```md
## Reporte: <Frente>

### Revisado
- Archivos/directorios:
- Skills consultadas:

### Hallazgos
- P0:
- P1:
- P2:

### Cambios realizados
- Archivos:
- Resumen:

### Verificacion
- Comandos ejecutados:
- Resultado:

### Bloqueos
- Externos:
- Decisiones necesarias:
```

## Orden para una sesion completa

Cuando el usuario pida "terminar todo", "hacer todo lo pendiente" o "release completo":

1. Lanzar agentes paralelos para Backend/Data, Frontend/UX, Security/RLS y QA/Release.
2. El agente principal mantiene Docs/Context y coordinacion.
3. Consolidar hallazgos en una lista unica P0/P1/P2.
4. Implementar primero P0, luego P1, luego P2 si no bloquea release.
5. Correr gates de salida.
6. Actualizar documentacion.
7. Entregar resumen final con estado, comandos, riesgos y pendientes externos.

# GestiOS Agent Rules

Estas reglas aplican a cualquier agente que trabaje en este repo. Antes de actuar, leer tambien:

- `docs/SKILLS_ROUTING.md`
- `docs/AGENT_WORK_ORDER.md`
- `docs/ORCHESTRATOR.md`
- `docs/AGENT_RELEASE_PLAYBOOK.md`

## Regla base

Antes de ejecutar una accion importante, el agente debe:

1. Entender el objetivo, entregables, restricciones, riesgos y criterio de exito.
2. Revisar el estado del repo y los archivos relevantes.
3. Seleccionar skills, MCPs y herramientas aplicables antes de actuar.
4. Investigar documentacion oficial, GitHub o codigo fuente local antes de usar APIs externas, librerias, comandos o capacidades no verificadas.
5. Dividir el trabajo en frentes o subagentes cuando sea posible y util.
6. Documentar decisiones, errores, resultados, checks y proximos pasos.
7. Validar antes de declarar terminado.

No ejecutar acciones destructivas, irreversibles, costosas o sensibles sin confirmacion explicita del usuario.

## No inventar

Nunca fabricar URLs, empresas, APIs externas, paquetes npm, capacidades de MCP, resultados de pruebas, logs, credenciales, proveedores o estados de deploy.

Si algo no esta verificado:

- buscar en el repo, documentacion oficial o web real cuando corresponda;
- marcarlo como no verificado;
- pedir datos al usuario solo si no hay forma segura de avanzar.

## Skills, MCPs y herramientas

- Leer `docs/SKILLS_ROUTING.md` antes de modificar codigo, hacer deploy o cerrar una tarea.
- Si una skill mencionada no existe, no inventarla: usar una equivalente real o declarar que no esta instalada.
- Antes de instalar o copiar skills externas, revisar `docs/GITHUB_REPO_RESEARCH.md` y usar solo repos aprobados o documentar por que se propone uno nuevo.
- No instalar colecciones completas de skills. Elegir skills puntuales, leer su `SKILL.md`, revisar scripts/hooks/permisos y pedir confirmacion antes de modificar `C:\Users\PC\.claude\skills`, `C:\Users\PC\.codex\skills` o cualquier configuracion global.
- Antes de pedir trabajo manual al usuario, revisar si existe una herramienta/MCP que pueda hacerlo de forma segura.
- Si una herramienta externa no esta disponible, decir exactamente cual falta y para que se necesita.
- No asumir que existe un MCP, endpoint o permiso si no esta visible en la sesion.

## Trabajo paralelo

Para tareas amplias, multi-area o de release:

1. Seguir `docs/AGENT_WORK_ORDER.md`.
2. Asignar ownership claro por frente:
   - Backend/Data: API routes, Prisma, Supabase, queries, server-side.
   - Frontend/UX: paginas, componentes, responsive, accesibilidad, textos visibles.
   - Security/RLS: auth, RBAC, RLS, uploads, webhooks, rate limits, secretos, pagos.
   - QA/Release: tests, E2E, lint, typecheck, build, deploy.
   - Docs/Context: README, docs, runbooks, handoff, decisiones.
3. No revertir cambios de otros agentes sin confirmacion explicita.
4. Consolidar hallazgos P0/P1/P2 antes de declarar terminado.

## Stack

La fuente de verdad de versiones es `package.json`. Al momento de escribir esto: Next.js 16.2.6 + React 19 + Prisma 7 + Supabase Auth + Tailwind 4 + Zod 4 + Vitest 4 + Sentry.

Path alias: `@/*` apunta a la raiz del repo.

## Next.js 16

Este no es el Next.js que probablemente recuerdas. Antes de cambiar routing, build, `Link`, config, Turbopack o boundaries server/client, leer la guia relevante en:

```txt
node_modules/next/dist/docs/
```

Atender deprecations y cambios de API.

## Comandos

```bash
npm run dev
npm run build
npm test
npm test:watch
npm run lint
npx tsc --noEmit
npx prisma generate
```

`npm run build` ejecuta `prisma generate` + `next build`; no aplica migraciones.

## Produccion y acciones sensibles

Requieren confirmacion explicita del usuario:

- `npx vercel --prod --yes` o cualquier deploy productivo;
- cambios de variables de entorno;
- migraciones o queries contra Supabase real;
- operaciones con credenciales, proveedores externos o costo;
- comandos destructivos de Git, filesystem, DB o infraestructura.

Antes de deploy productivo: confirmar branch/commit esperado, gates ejecutados, URL objetivo y plan de rollback.

## Prisma + Supabase

La DB vive en Supabase. No asumir `DATABASE_URL` local.

### No agregar campos sin migracion

Antes de agregar un campo al schema:

1. Crear SQL en `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`.
2. Revisar el SQL.
3. Aplicarlo en Supabase con SQL revisado o `prisma migrate deploy` cuando corresponda.
4. Confirmar que la columna existe.
5. Solo despues actualizar `prisma/schema.prisma` y codigo consumidor.

Si no se puede aplicar la migracion, no agregar el campo.

No usar `prisma db push` contra produccion. `db push` queda limitado a entornos no productivos y nunca con `--accept-data-loss`.

### Reglas criticas de modelos

- `Profile` no tiene `email`, `createdAt` ni `updatedAt`.
- Usar `user.email` de Supabase Auth cuando haga falta email.
- `Category.businessType` existe y se usa para filtrar categorias por tipo de negocio.
- `OrgAddon.phoneNumberId` se usa para WhatsApp y para QR Bolivia como URL de QR subido.
- `EmailLog` registra envios y webhook de Brevo.
- No cambiar `lib/prisma.ts` para quitar lazy initialization.
- Para campos `Json?`: `Prisma.DbNull` para NULL, `undefined` para omitir, valor directo para guardar.

### Multi-tenant

- Todo query de modelos tenant-scoped debe filtrar por `organizationId`.
- Usar `getTenantProfile()` desde `lib/auth.ts` en API routes.
- Excepciones: rutas publicas, setup, cron, webhooks y superadmin con auth propia.
- RLS esta habilitado solo en `public.profiles`; el resto del aislamiento es a nivel de aplicacion.
- Una cuenta pertenece a una organizacion. No hay switching entre organizaciones.

## Auth, planes y dominio

- Staff se gestiona por `/api/team`; crea usuarios reales en Supabase Auth.
- Superadmin impersonation usa cookies y solo rol `SUPERADMIN`.
- Usar `isPlanAtLeast(plan, required)` y `canUseFeature(plan, feature)` desde `lib/plans.ts`.
- Planes: `BASICO`, `CRECER`, `PRO`, `EMPRESARIAL`.
- `tienda_online`, `registro_publico` y `pagos_qr` requieren PRO+.
- `sucursales`, `audit_log` y `roles_avanzados` requieren EMPRESARIAL+.
- `facturacion_siat` esta retirado del alcance comercial y debe permanecer deshabilitado.
- Moneda principal: BOB.
- QR Bolivia con PSP y WhatsApp requieren credenciales/proveedores reales; si faltan, documentarlo como gate externo.

## Implementacion

- Mantener cambios acotados al pedido.
- Seguir patrones existentes del repo antes de crear abstracciones nuevas.
- No agregar dependencias sin verificar documentacion oficial/GitHub y justificar compatibilidad.
- Emails siempre fire-and-forget con `.catch(() => {})`.
- Zod 4: `z.record(z.string(), valueType)`.
- No exponer secretos en logs, docs, commits ni respuestas.
- No leer ni imprimir `.env*` salvo que sea estrictamente necesario para la tarea y el usuario lo haya autorizado o el flujo lo requiera; aun asi, nunca mostrar valores.
- Si se detecta un secreto en archivos versionables, reportar ubicacion aproximada, eliminarlo del diff y recomendar rotacion.
- Archivos `.env*` deben permanecer ignorados salvo `.env.example`.

## Gates antes de cerrar

Para cambios de codigo, ejecutar como minimo:

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

Si un gate falla, no declararlo verde. Registrar comando, error principal, causa probable y siguiente accion.

## Reporte final esperado

Al cerrar una tarea, reportar:

- resumen ejecutivo;
- archivos creados/editados;
- decisiones tomadas;
- checks ejecutados y resultado;
- errores encontrados y solucion;
- riesgos restantes;
- proximos pasos;
- commit sugerido.

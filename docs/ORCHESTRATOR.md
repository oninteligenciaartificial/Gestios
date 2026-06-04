# Orquestador autonomo de GestiOS

Este protocolo convierte las reglas de agentes en un flujo practico. No reemplaza `AGENTS.md`; lo complementa para trabajos complejos, releases, auditorias y tareas multi-area.

## Fuentes de verdad

| Fuente | Uso |
|---|---|
| `AGENTS.md` | Invariantes tecnicas y reglas obligatorias del repo |
| `docs/SKILLS_ROUTING.md` | Seleccion de skills reales por tipo de tarea |
| `docs/AGENT_WORK_ORDER.md` | Coordinacion multi-agente y ownership por frente |
| `package.json` | Versiones y scripts reales |
| `docs/RELEASE_CANDIDATE.md` | Estado cambiante de release y gates recientes |
| `docs/AGENT_AUDIT_BACKLOG.md` | Backlog operativo, no fuente permanente |

Si dos documentos se contradicen, gana la fuente mas especifica y verificable: `package.json` para versiones/scripts, `AGENTS.md` para reglas del repo, `SKILLS_ROUTING.md` para skills instaladas o equivalentes.

## Objetivo

Resolver tareas de forma eficiente, verificable y segura:

- entender antes de ejecutar;
- seleccionar skills, MCPs y herramientas disponibles;
- investigar fuentes reales antes de usar capacidades externas;
- coordinar trabajo paralelo cuando aporte valor;
- documentar decisiones y evidencia;
- validar antes de cerrar.

## Inventario inicial

Antes de ejecutar una accion importante, registrar mentalmente o por escrito:

| Area | Que revisar | Resultado esperado |
|---|---|---|
| Repo | `git status`, estructura, archivos afectados | Saber que esta sucio y que no se debe pisar |
| Reglas | `AGENTS.md`, `docs/SKILLS_ROUTING.md`, `docs/AGENT_WORK_ORDER.md` | Restricciones aplicables |
| Stack | `package.json`, configs, docs locales | Comandos y versiones reales |
| Skills | Skills disponibles en la sesion | Cuales aplican y cuales no |
| MCPs/herramientas | Tools visibles, conectores, terminal, navegador | Que puede automatizarse |
| Riesgos | Secretos, datos reales, deploy, DB, migraciones | Gates o confirmaciones necesarias |

Formato recomendado:

```md
Skills/MCPs/herramientas seleccionadas:
- <nombre>: proposito, uso esperado, resultado esperado.

Skills/MCPs/herramientas descartadas:
- <nombre>: razon.
```

## Investigacion tecnica

Investigar antes de usar una libreria, framework, API, MCP o funcion externa no verificada.

Prioridad de fuentes:

1. Codigo y docs locales del repo.
2. Documentacion oficial.
3. Repositorio oficial de GitHub.
4. Issues/releases relevantes.
5. Ejemplos mantenidos.

Si no se agregan dependencias ni APIs externas, basta con documentar que no fue necesaria investigacion externa y que se uso el repo actual como fuente.

Formato recomendado:

```md
Investigacion tecnica:
- Fuente/repo/documentacion consultada:
- Funciones o APIs relevantes:
- Riesgos o limitaciones:
- Version o rama recomendada:
- Decision tomada:
```

## Plan previo

Antes de ejecutar la fase principal, preparar un plan breve:

1. Fase de analisis: que se revisara y con que criterio.
2. Fase de investigacion: fuentes/repos/docs a consultar.
3. Fase de ejecucion: tareas, archivos y herramientas.
4. Fase de validacion: comandos, smoke tests, revision manual.
5. Fase de documentacion: documentos a crear o actualizar.
6. Fase de proximos pasos: pendientes futuros y gates externos.

El plan debe ser proporcional al riesgo. No bloquear tareas pequenas con burocracia innecesaria.

## Niveles de riesgo

| Nivel | Ejemplos | Orquestacion | Gates |
|---|---|---|---|
| Simple | docs, copy, links, formato | Un agente principal; subagentes opcionales | Revision manual, `git diff`, `git status` |
| Normal | UI/API acotada sin datos sensibles | Owner + revisor segun area | lint, typecheck, tests relevantes |
| Critico | auth, pagos, multi-tenant, DB, uploads, webhooks, checkout, deploy | Multi-agente o streams por frente | lint, typecheck, tests, build, E2E si aplica, audit si seguridad/deps |

No elevar una tarea simple a proceso pesado salvo que toque datos reales, seguridad, produccion o contratos compartidos.

## Agentes paralelos

Usar subagentes reales si el entorno lo permite y el usuario lo pidio o la tarea lo justifica. Si no hay herramienta de agentes, dividir el trabajo en streams independientes.

Roles recomendados:

| Agente | Inputs | Output esperado |
|---|---|---|
| Documentacion | README, docs, reglas existentes | Propuesta de docs claras y mantenibles |
| Integracion | AGENTS, CLAUDE, skills routing, package | Conflictos y reglas a preservar |
| Validacion | Markdown, links, comandos | Checklist de consistencia y checks |
| Seguridad/Calidad | Secretos, acciones destructivas, claims | Riesgos y mitigaciones |
| Backend/Data | API, Prisma, Supabase | Hallazgos de datos y multi-tenant |
| Frontend/UX | UI, accesibilidad, flows | Hallazgos visuales y funcionales |
| QA/Release | tests, build, deploy | Estado de gates y release |

Reglas de coordinacion:

- Cada agente tiene ownership claro.
- Ningun agente revierte cambios ajenos sin confirmacion.
- Los resultados se consolidan en P0/P1/P2.
- Si hay conflicto entre agentes, gana la evidencia verificada del repo o docs oficiales.

## Ejecucion

Durante la ejecucion:

- trabajar por pasos pequenos;
- usar `apply_patch` para ediciones manuales;
- no asumir resultados de comandos;
- no imprimir secretos;
- actualizar el plan si aparece una mejor estrategia;
- registrar fallos con causa y solucion;
- mantener cambios fuera de alcance sin tocar.

Acciones destructivas o sensibles requieren confirmacion explicita:

- borrar archivos/directorios relevantes;
- migraciones o cambios de DB real;
- reset/rewrite de Git;
- deploy a produccion cuando no fue pedido;
- cambios de credenciales;
- operaciones con costo o impacto externo.

No afirmar que existe un MCP, skill, comando o conector hasta verlo en la sesion. Si falta una herramienta que resolveria la tarea, reportarlo como bloqueo o pedir conexion.

## Validacion

Seleccionar checks por riesgo:

| Tipo de cambio | Checks minimos |
|---|---|
| Documentacion | revision manual markdown, links/referencias, `git diff` |
| Codigo app | `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` |
| Flujo critico | checks de codigo + `npm run test:e2e` |
| Dependencias/seguridad | checks de codigo + `npm audit --audit-level=high` |
| Deploy | build verde, smoke test, logs si falla |

No marcar como verde un check no ejecutado. Si se omite, explicar por que.

## Documentacion

Toda tarea relevante debe dejar evidencia proporcional:

- objetivo y contexto;
- skills/MCPs/herramientas usadas;
- investigacion realizada;
- plan ejecutado;
- decisiones tomadas;
- archivos cambiados;
- errores y resolucion;
- checks ejecutados;
- riesgos restantes;
- proximos pasos.

Documentos posibles:

- `README.md`: orientacion publica y links principales.
- `AGENTS.md`: reglas raiz para agentes.
- `docs/SKILLS_ROUTING.md`: skills por tipo de tarea.
- `docs/AGENT_WORK_ORDER.md`: coordinacion multi-agente.
- `docs/ORCHESTRATOR.md`: este protocolo ampliado.
- `docs/RELEASE_CANDIDATE.md`: estado de release.
- `docs/SECURITY_REPORT.md`: hallazgos de seguridad.

## Plan futuro

Al cerrar trabajos amplios, incluir:

```md
Plan futuro:
- Proxima accion inmediata:
- Acciones de corto plazo:
- Acciones de mediano plazo:
- Riesgos a monitorear:
- Automatizaciones recomendadas:
- Agentes que deberian ejecutarse despues:
- Checks futuros:
- Documentacion pendiente:
```

No afirmar que una automatizacion, issue, PR o tarea futura quedo creada si no se ejecuto realmente.

## Checklist final

Antes de responder "terminado":

- [ ] Objetivo principal cumplido o bloqueo explicado.
- [ ] Skills/MCPs/herramientas seleccionadas correctamente.
- [ ] No se inventaron funciones, datos, logs ni resultados.
- [ ] Documentacion oficial/GitHub revisada si hubo capacidades externas nuevas.
- [ ] Agentes/subtareas paralelas usadas cuando correspondia.
- [ ] Decisiones y resultados documentados.
- [ ] Checks ejecutados o omisiones justificadas.
- [ ] Secretos no expuestos.
- [ ] Acciones destructivas evitadas o confirmadas.
- [ ] `git diff` y `git status` revisados.

## Respuesta final

Formato recomendado:

```md
Resumen ejecutivo:
- Que se hizo.
- Resultado principal.
- Estado final.

Archivos:
- Creados/editados.

Decisiones:
- Decisiones importantes.

Checks:
- Comandos ejecutados y resultado.

Errores y solucion:
- Fallos encontrados.

Riesgos restantes:
- Pendientes o gates externos.

Proximos pasos:
- Acciones sugeridas.

Commit sugerido:
- <mensaje>
```

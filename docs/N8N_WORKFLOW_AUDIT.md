# Auditoria de workflows n8n

Fecha: 2026-06-04

## Objetivo

Inventariar los workflows visibles en la instancia n8n conectada por MCP y separar cuales sirven, cuales requieren revision y cuales son candidatos a archivar o eliminar.

No se elimino, archivo, publico ni despublico ningun workflow durante esta auditoria.

Actualizacion 2026-06-04:

- Se hizo una verificacion final de los 12 candidatos fuertes.
- Todos siguen inactivos, no archivados y sin ejecuciones recientes visibles.
- Se intento archivarlos por MCP, pero n8n rechazo la operacion porque esos workflows tienen `availableInMCP=false`.
- Se probo lectura con la API publica de n8n usando el token MCP como API key y n8n respondio `401 No autorizado`.
- Resultado: no se archivo ni elimino nada; falta activar MCP access en esos workflows o proporcionar una API key publica de n8n con permiso minimo para archivar workflows.

## Fuentes y alcance

- MCP usado: `n8n-mcp` configurado globalmente en Codex.
- Proyecto visible: `On IA <oninteligenciaartificial@gmail.com>`.
- Workflows visibles por MCP: 46.
- Carpetas visibles:
  - `HERMES`
  - `Gesti-os`
  - `Dental-gest`
  - `udia 2do curso`
  - `udia 1er curso`
- Snapshot local temporal: `%TEMP%\gestios-n8n-workflow-audit.json`.

Limitaciones:

- La auditoria no borra nada porque borrar/archivar workflows es accion destructiva o sensible.
- Algunos workflows tienen `availableInMCP=false`; para ellos no hay detalle de nodos ni revision profunda desde MCP.
- El MCP disponible no expuso una operacion segura para mover workflows entre carpetas; la organizacion visual por carpeta debe hacerse desde la UI de n8n o con API adicional confirmada.
- Los nombres con caracteres danados se registran como los devolvio el MCP.

## Regla de limpieza recomendada

1. Primero archivar, no borrar.
2. Mantener archivado 7 a 14 dias.
3. Si nadie lo necesita y no tiene historial util, exportar o capturar evidencia minima.
4. Recien despues eliminar con confirmacion humana.

Motivo: la documentacion oficial de n8n indica que al borrar un workflow tambien se borra su historial de ejecuciones. La API publica de n8n tambien distingue operaciones como `archive`, `unarchive`, `delete`, `activate` y `deactivate`.

## Resumen ejecutivo

| Categoria | Cantidad | Accion recomendada |
|---|---:|---|
| Candidato fuerte a archivar/eliminar | 12 | Archivar primero; eliminar despues de ventana de seguridad |
| Candidato a archivar | 4 | Revisar nombre/dueno; archivar si nadie lo reclama |
| Mantener activo / revisar negocio | 22 | No tocar sin validar que negocio/proyecto lo usa |
| Mantener o revisar | 5 | Relacionados a GestiOS/monitoreo; revisar antes de decidir |
| Revisar manualmente | 3 | Tienen ejecuciones exitosas aunque estan inactivos |

## Candidatos fuertes a archivar/eliminar

Estos parecen practicas, cursos o pruebas. Estan inactivos y, en su mayoria, tienen MCP access apagado.

Verificacion final antes de archivar:

- `active=false` en los 12.
- `isArchived=false` en los 12.
- `recentExecutions=0` en los 12.
- `availableInMCP=false` en los 12; por eso MCP no pudo archivarlos.

| Workflow | ID | Activo | MCP | Motivo |
|---|---|---:|---:|---|
| `[UDIA] Mi primer workflow` | `jVrufLM0aWnYLj8c` | No | No | Practica/curso/test inactivo |
| `[UDIA] Primer flujo sencillo` | `9d6jOYklaeYTdllJ` | No | No | Practica/curso/test inactivo |
| `Action in app Udia` | `GWLdEFdUsHcuusng` | No | No | Practica/curso/test inactivo |
| `Ejercicio flujo de datos` | `t17aey6LEAhAITWp` | No | No | Practica/curso/test inactivo |
| `Nodos Core y HTTP REQUEST` | `8Jb45VT5MgmrahPI` | No | No | Practica/curso/test inactivo |
| `practica flujo de datos` | `mwAL9Vx15ouc50OW` | No | No | Practica/curso/test inactivo |
| `prueba de datos` | `mrwDIycuY7SgkFG0` | No | No | Practica/curso/test inactivo |
| `udia` | `HKTDjx21ohYeO19Y` | No | No | Practica/curso/test inactivo |
| `UDIA Bot telegram errores` | `Ex4Uf3PHb19tt3fz` | No | No | Practica/curso/test inactivo |
| `Udia credenciales` | `kYt1MnjOe1rnL5Rk` | No | No | Practica/curso/test inactivo |
| `udia if y switch` | `uRZxWpe41EambE0W` | No | No | Practica/curso/test inactivo |
| `UDIA Workflow de Prueba` | `8tQz364A2iDlUexR` | No | No | Practica/curso/test inactivo |

Accion recomendada:

- Archivar estos 12 en lote solo despues de confirmacion.
- No eliminar todavia porque MCP access esta apagado y no vimos nodos/historial profundo.

## Candidatos a archivar

Estos estan inactivos y sin ejecuciones recientes visibles, pero el nombre sugiere que podrian haber sido utiles para Discord/Notion o formularios.

| Workflow | ID | Activo | MCP | Nodos | Motivo |
|---|---|---:|---:|---:|---|
| `formularios con mensajes finales` | `A36FdAXRPKW6ULoM` | No | No | N/D | Inactivo, detalle limitado |
| `WF-DISCORD-03 Crear Evento desde Discord` | `rqwQv6THGv3JU4tx` | No | Si | 6 | Inactivo, sin ejecuciones recientes visibles |
| `WF-DISCORD-04: Alertas Tareas Notion` | `KQsJ9l87LsWzhn7e` | No | Si | 6 | Inactivo, sin ejecuciones recientes visibles |
| `WF-DISCORD-05 Asistente Discord` | `kfE43OhmczUkAKiN` | No | Si | 11 | Inactivo, sin ejecuciones recientes visibles |

Accion recomendada:

- Archivar si no forman parte de un sistema Discord/Notion activo.
- Antes de borrar, revisar si hay credenciales o webhooks externos apuntando a esos flujos.

## Mantener activo / revisar negocio

Estan activos. No se deben borrar sin validar que proyecto, cliente o automatizacion dependen de ellos.

| Workflow | ID | Exitos recientes | Errores recientes | Decision |
|---|---|---:|---:|---|
| `GestiOS - Birthday WA [WF-GS-03]` | `qOVpQwPZplQKYkMc` | 7 | 0 | Mantener |
| `GestiOS - Plan Expiry WA [WF-GS-02]` | `xx4wzzzqZBGfu836` | 7 | 0 | Mantener |
| `GestiOS - Weekly Admin Digest [WF-GS-04]` | `6oowIHo8G9baBOYc` | 0 | 1 | Mantener, revisar error |
| `Hermes Telegram Chat ID Capture` | `T3qtKnj94fBXQsxY` | 1 | 0 | Mantener si Hermes sigue activo |
| `ONIA - Video Lab Telegram Router` | `vuicWsvh0hwqKhYs` | 9 | 0 | Mantener si ONIA Video Lab sigue activo |
| `WF-00: Appointment Reminders` | `rROEMfHl1KVRvvbS` | 0 | 10 | Mantener por ahora, revisar errores |
| `WF-01: Trial Warnings` | `NDgVcJGnvrgK91St` | 4 | 6 | Mantener por ahora, revisar errores |
| `WF-02: QR Payment Alerts` | `9bF53cn0lkvdUyZT` | 0 | 10 | Mantener por ahora, revisar errores |
| `WF-03: Recurring Invoice Delivery` | `C9wNxI78lJUrcU4n` | 0 | 10 | Mantener por ahora, revisar errores |
| `WF-04: Overdue Invoice Dunning` | `8mO8JA5X0ILtvA1q` | 0 | 10 | Mantener por ahora, revisar errores |
| `WF-05: Birthday & Cleaning Reminder` | `Zzc1PgVzaKxOPxck` | 3 | 7 | Mantener por ahora, revisar errores |
| `WF-06: Weekly Clinic Digest` | `3VUUpM6FRTXzTSdA` | 1 | 1 | Mantener por ahora, revisar error |
| `WF-07: Payment Reconciliation` | `DKSPEsrRYDtoSaG0` | 5 | 5 | Mantener por ahora, revisar errores |
| `WF-08: Welcome Email for New Patients` | `F0HOvw0lpGqTdpQS` | 2 | 0 | Mantener |
| `WF-09: Trial Expired Alert` | `cA7PMtzHFR47NR9W` | 5 | 5 | Mantener por ahora, revisar errores |
| `WF-10: WhatsApp Addon Onboarding` | `JN4tcboVyFKv4qGA` | 0 | 0 | Mantener si addon WhatsApp esta vigente |
| `WF-11 Post-Treatment Follow-up` | `7avrjjM6NoRnTUrL` | 0 | 10 | Mantener por ahora, revisar errores |
| `WF-12: Plan Activation Confirmation` | `uAEgHBsVNkkfcAzd` | 0 | 0 | Mantener si billing/onboarding lo usa |
| `WF-13: WhatsApp Quota Alert` | `DtKnm7mTGTmM4dXu` | 1 | 9 | Mantener por ahora, revisar errores |
| `WF-DISCORD-06: Alertas de Suscripciones` | `dtl2ru7enIbao76C` | 0 | 8 | Mantener por ahora, revisar si Discord sigue en uso |
| `WF-GS-05: BCP Auto Payment Confirmation` | `jtLIb0i6jxAZOvwa` | 10 | 0 | Mantener |
| `WF-SENTRY-01 - Sentry Codex Triage` | `wImYWwbHGVK5tvIA` | 6 | 0 | Mantener |

Accion recomendada:

- No eliminar activos.
- Priorizar reparacion de los activos con 5 o mas errores recientes.
- Si alguno ya no pertenece al negocio actual, primero despublicar/archivar con ventana de observacion.

## Mantener o revisar

Estan inactivos pero parecen relacionados con GestiOS, monitoreo, Chatwoot o onboarding. No conviene borrarlos sin validar alcance.

| Workflow | ID | Exitos recientes | Errores recientes | Decision |
|---|---|---:|---:|---|
| `WF-08: GestiOS WhatsApp Onboarding` | `bfNDDU0b4rOfhHmH` | 0 | 0 | Revisar si reemplaza o duplica `WF-10` |
| `WF-11: Patient Sync Incremental (Chatwoot)` | `BUAMdJ1pz16CZ997` | 0 | 0 | Revisar si corresponde a Dental-gest |
| `WF-GS-01 - Trial Expiry Warning- Gesti-os` | `dybtwU9dejZXwYKF` | 0 | 0 | Revisar si fue reemplazado por `WF-01` o `WF-GS-02` |
| `WF-GS-05 - Nuevo Tenant Notificacion Admin - Gestios` | `CllIkRkqdcGXS67o` | 0 | 0 | Revisar si fue reemplazado por otro onboarding/admin |
| `WF-GS-ERR-01: Sentry to GitHub Issue Draft` | `H1PDrinGPYtBcyhw` | 1 | 0 | Mantener como draft de monitoreo |

## Revisar manualmente

Estan inactivos, pero tienen ejecuciones exitosas recientes. Podrian ser pruebas utiles o flujos pausados a proposito.

| Workflow | ID | Exitos recientes | Errores recientes | Decision |
|---|---|---:|---:|---|
| `Hermes Radar Diario Creativo y Clientes` | `lryabRhGQW4WIuJG` | 1 | 0 | Preguntar si Hermes sigue vigente |
| `WF-DISCORD-01: Resumen Diario de Agenda` | `MedkND258rck68om` | 9 | 0 | Revisar antes de archivar |
| `WF-DISCORD-02: Recordatorios de Eventos` | `M7m23v5JpPh4je76` | 10 | 0 | Revisar antes de archivar |

## Plan de limpieza propuesto

### Fase 1: limpieza segura

Con confirmacion explicita del usuario, archivar:

- Los 12 workflows UDIA/practica/test.
- `formularios con mensajes finales`.

### Fase 2: limpieza de integraciones pausadas

Antes de archivar:

- Confirmar si Discord/Notion sigue en uso.
- Confirmar si Hermes sigue en uso.
- Confirmar si Dental-gest y GestiOS comparten workflows o deben separarse por carpeta/proyecto.

### Fase 3: reparacion de activos

Revisar workflows activos con errores altos:

- `WF-00: Appointment Reminders`
- `WF-02: QR Payment Alerts`
- `WF-03: Recurring Invoice Delivery`
- `WF-04: Overdue Invoice Dunning`
- `WF-11 Post-Treatment Follow-up`
- `WF-13: WhatsApp Quota Alert`
- `WF-DISCORD-06: Alertas de Suscripciones`

### Fase 4: eliminacion definitiva

Solo despues de:

1. Archivar.
2. Esperar ventana de seguridad.
3. Confirmar que nadie lo uso.
4. Exportar o guardar evidencia minima.
5. Confirmacion explicita para eliminar.

## Proxima orden sugerida

```txt
Confirmo archivar primero los candidatos fuertes UDIA/practica/test:
jVrufLM0aWnYLj8c, 9d6jOYklaeYTdllJ, GWLdEFdUsHcuusng, t17aey6LEAhAITWp,
8Jb45VT5MgmrahPI, mwAL9Vx15ouc50OW, mrwDIycuY7SgkFG0, HKTDjx21ohYeO19Y,
Ex4Uf3PHb19tt3fz, kYt1MnjOe1rnL5Rk, uRZxWpe41EambE0W, 8tQz364A2iDlUexR.
No eliminar todavia.
```

## Riesgos restantes

- Algunos workflows apagados no tienen MCP access; antes de eliminarlos conviene revisarlos en UI o activar MCP access.
- Hay workflows activos con muchos errores recientes; limpiar no arregla esos errores.
- El token MCP fue pegado en chat durante la configuracion; conviene rotarlo despues de terminar esta limpieza.
- Borrar workflows en n8n puede borrar historial de ejecuciones, por eso esta auditoria recomienda archivar primero.

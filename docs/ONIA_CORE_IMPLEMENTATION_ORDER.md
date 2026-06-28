# ONIA Core Implementation Order

Estado: checklist local de implementacion.
Fecha: 2026-06-28.
Origen canonico: `C:\dev\proyectos\onia-hermes\hermes-content\docs\ONIA_CORE_IMPLEMENTATION_ORDER_2026.md`.

## Decision

ONIA Core es el sistema de organizacion operativa inicial de ONIA.

No se crea un repo nuevo para ONIA Core ni ProveeGest todavia. Primero se
implementa ONIA Core dentro de GestiOS, se valida como base multi-tenant para
ordenar empresas reales y luego se abre ProveeGest como familia B2B por rubro.

```text
ONIA Core organiza -> GestiOS implementa -> ProveeGest verticaliza -> ProveeGest Electrico valida
```

## Que es ONIA Core

ONIA Core debe responder primero:

1. Quien trabaja en la empresa.
2. Que rol y permisos tiene.
3. Que clientes, proveedores, contactos o areas existen.
4. Que tareas, solicitudes, casos o pendientes estan abiertos.
5. Quien es responsable.
6. En que estado esta cada pendiente.
7. Cual es la fecha limite o siguiente accion.
8. Que evidencia, nota, archivo o historial existe.
9. Que alerta requiere atencion.
10. Que reporte necesita gerencia.

Productos, inventario, ventas, compras y caja son modulos activables. No son la
definicion de ONIA Core.

## Fronteras

| Producto | Entra aqui | Fuera de alcance |
|---|---|---|
| ONIA Core | Tenant, equipo, roles, permisos, responsables, clientes, proveedores, contactos, tareas, solicitudes, estados, evidencia, reportes, auditoria, import/export y modulos activables | ERP pesado, POS disfrazado, SIAT activo, WhatsApp automatico, TR4 write |
| GestiOS | Primera implementacion de ONIA Core en este repo | Ser confundido con el nombre del core |
| ProveeGest | Solicitudes B2B, contactos, cotizaciones, catalogo tecnico, rubros, conocimiento comercial | Repo separado, portal cliente, integraciones profundas |
| DentalGest | Solo patrones: tenant, billing manual, audit, superadmin, add-ons | Pacientes, citas, tratamientos, odontograma, historia clinica |
| Ganadero OS | Solo patrones: organizationId, version, deletedAt, sync/offline | Ganado, potreros, sanidad, offline dentro de GestiOS |

## Orden de trabajo

### 0. Contrato de codigo

Primer corte implementado:

- `lib/onia-core.ts` define nombre canonico, preguntas del core, capacidades,
  familias, verticales/rubros y gates externos.
- `tests/onia-core.test.ts` protege que ONIA Core no vuelva a degradarse a POS,
  inventario, ERP o integracion externa.
- GestiOS queda como primera implementacion, no como nombre del core.

### 1. Baseline

Antes de cambios de codigo:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Registrar cualquier fallo en el reporte de la sesion. Si el fallo viene de
estado previo, no ocultarlo.

### 2. Tenant y permisos

Checklist:

- Todas las rutas privadas usan `getTenantProfile()` salvo excepciones
  documentadas.
- Toda lectura/escritura operativa filtra por `organizationId`.
- Las acciones de admin/superadmin no saltan permisos sin evidencia.
- Los logs no imprimen secretos ni datos sensibles innecesarios.
- Las pruebas cubren al menos una ruta critica contra acceso cross-tenant.

### 3. Core de organizacion

Orden:

1. Dashboard operativo.
2. Equipo, roles, areas y responsables.
3. Clientes, proveedores y contactos.
4. Tareas, solicitudes, casos y estados.
5. Checklists/procesos repetibles.
6. Notificaciones, actividad y evidencia.
7. Reportes gerenciales.
8. Import/export con validacion.
9. Modulos activables: catalogo, inventario, ventas, compras y caja.

### 4. ProveeGest B2B

Primera familia:

```text
ProveeGest
```

Primer rubro:

```text
ProveeGest Electrico
```

Motivo: una importadora o mayorista electrica no necesita un sistema llamado
solo "electronica"; necesita organizacion interna, responsables, solicitudes,
seguimiento, catalogo tecnico, cotizaciones y control comercial.

Piezas a disenar antes de migrar:

- `Area` o equivalente simple para organizar responsabilidades.
- `Contact` por cliente.
- `Task` como unidad basica de seguimiento.
- `CommercialRequest` o equivalente para solicitudes.
- `Quote` y `QuoteItem` si `Order` no alcanza para cotizaciones.
- `ProcessChecklist` o equivalente para rutinas repetibles.
- `ImportBatch` con dry-run y errores por fila.
- `KnowledgeItem` para base comercial interna.
- `ExternalAdapter` desactivado por defecto.

### 5. Bolivian Electric piloto

Alcance permitido:

- CRM gerencial.
- Solicitudes.
- Cotizaciones.
- Catalogo tecnico.
- Importacion controlada.
- Base de conocimiento comercial.
- Dashboard gerencial.
- Export/import manual.

Bloqueado:

- Escritura en TR4.
- WhatsApp automatico.
- Portal cliente.
- Integracion real-time.
- Reemplazo total del ERP.
- SIAT/facturacion fiscal.

## Rubros iniciales

No crear un producto por cada rubro si solo cambia el catalogo. Usar familia +
`businessType` + atributos.

| Familia | Rubro en sistema | Nombre comercial recomendado | Uso |
|---|---|---|---|
| GestiOS | `GENERAL` | GestiOS | organizacion general de empresa |
| GestiOS | `ROPA` | GestiOS Moda | organizacion + catalogo de ropa y variantes |
| GestiOS | `FARMACIA` | GestiOS Salud | organizacion + farmacia/insumos no clinicos |
| GestiOS | `FERRETERIA` | GestiOS Ferreteria | organizacion + ferreteria/construccion |
| ProveeGest | `B2B_DISTRIBUCION` | ProveeGest | mayoristas y distribuidoras |
| ProveeGest | `ELECTRICO` | ProveeGest Electrico | importadoras/mayoristas electricas |
| DentalGest | `DENTAL` | DentalGest | clinicas dentales, separado del core |
| Ganadero OS | `GANADERO` | HatoGest / Ganadero OS | rural/offline, separado del core |

## Reglas antes de migraciones

- No agregar campos Prisma sin revisar consultas, migracion SQL y rollback.
- No agregar integraciones sin proveedor, credenciales, contrato y logs.
- No vender add-ons no operables.
- No mezclar datos clinicos de DentalGest.
- No mover logica offline de Ganadero OS.
- No hardcodear Bolivian Electric dentro del core.

## Criterio de salida del primer sprint

- Baseline ejecutado y registrado.
- Rutas criticas auditadas por `organizationId`.
- Backlog P0/P1/P2 creado.
- Modelo de equipo, responsables, tareas y solicitudes decidido.
- Modelo de contactos/solicitudes/cotizaciones decidido.
- Rubro `ProveeGest Electrico` especificado.
- Integraciones sensibles documentadas como bloqueadas por defecto.

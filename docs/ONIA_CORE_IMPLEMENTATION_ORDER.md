# ONIA Core Implementation Order

Estado: checklist local de implementacion.
Fecha: 2026-06-28.
Origen canonico: `C:\dev\proyectos\onia-hermes\hermes-content\docs\ONIA_GESTIOS_CORE_IMPLEMENTATION_ORDER_2026.md`.

## Decision

GestiOS es el core operativo inicial de ONIA.

No se crea un repo nuevo para ProveeGest todavia. Primero se endurece GestiOS,
se valida como base multi-tenant y luego se abre ProveeGest como familia B2B por
rubro.

```text
GestiOS Core -> ProveeGest -> ProveeGest Electrico -> Bolivian Electric piloto
```

## Fronteras

| Producto | Entra aqui | Fuera de alcance |
|---|---|---|
| GestiOS Core | Tenant, roles, planes, add-ons, clientes, productos, inventario, ventas, compras, caja, reportes, auditoria, import/export | ERP pesado, SIAT activo, WhatsApp automatico, TR4 write |
| ProveeGest | Solicitudes B2B, contactos, cotizaciones, catalogo tecnico, rubros, conocimiento comercial | Repo separado, portal cliente, integraciones profundas |
| DentalGest | Solo patrones: tenant, billing manual, audit, superadmin, add-ons | Pacientes, citas, tratamientos, odontograma, historia clinica |
| Ganadero OS | Solo patrones: organizationId, version, deletedAt, sync/offline | Ganado, potreros, sanidad, offline dentro de GestiOS |

## Orden de trabajo

### 0. Baseline

Antes de cambios de codigo:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Registrar cualquier fallo en el reporte de la sesion. Si el fallo viene de
estado previo, no ocultarlo.

### 1. Tenant y permisos

Checklist:

- Todas las rutas privadas usan `getTenantProfile()` salvo excepciones
  documentadas.
- Toda lectura/escritura operativa filtra por `organizationId`.
- Las acciones de admin/superadmin no saltan permisos sin evidencia.
- Los logs no imprimen secretos ni datos sensibles innecesarios.
- Las pruebas cubren al menos una ruta critica contra acceso cross-tenant.

### 2. Core operativo

Orden:

1. Dashboard operativo.
2. Clientes y contactos.
3. Productos, categorias, variantes, stock minimo y sucursal.
4. Proveedores y ordenes de compra.
5. Ventas, pedidos y caja.
6. Notificaciones y actividad.
7. Reportes gerenciales.
8. Import/export con validacion.

### 3. ProveeGest B2B

Primera familia:

```text
ProveeGest
```

Primer rubro:

```text
ProveeGest Electrico
```

Motivo: una importadora o mayorista electrica no necesita un sistema llamado
solo "electronica"; necesita flujo B2B, catalogo tecnico, cotizaciones,
responsables, stock y seguimiento comercial.

Piezas a disenar antes de migrar:

- `Contact` por cliente.
- `CommercialRequest` o equivalente para solicitudes.
- `Quote` y `QuoteItem` si `Order` no alcanza para cotizaciones.
- `ImportBatch` con dry-run y errores por fila.
- `KnowledgeItem` para base comercial interna.
- `ExternalAdapter` desactivado por defecto.

### 4. Bolivian Electric piloto

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
| GestiOS | `GENERAL` | GestiOS | comercio general |
| GestiOS | `ROPA` | GestiOS Moda | ropa y variantes |
| GestiOS | `FARMACIA` | GestiOS Salud | farmacia/insumos no clinicos |
| GestiOS | `FERRETERIA` | GestiOS Ferreteria | ferreteria/construccion |
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
- Modelo de contactos/solicitudes/cotizaciones decidido.
- Rubro `ProveeGest Electrico` especificado.
- Integraciones sensibles documentadas como bloqueadas por defecto.


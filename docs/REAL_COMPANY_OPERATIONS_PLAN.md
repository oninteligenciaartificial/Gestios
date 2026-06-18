# GestiOS real company operations plan

Estado: fase 1 implementada, fase profesional dental iniciada.

## Criterio de producto

GestiOS debe ayudar a una empresa real a operar cada dia: vender, cobrar, reponer, comprar, revisar clientes, controlar caja, entender reportes y sostener pagos de cuenta.

DentalGest no es un plan comercial. Es un modo operativo para clinicas dentales con `businessType = DENTAL`. En ese modo GestiOS no maneja pacientes, citas, tratamientos, doctores ni historia clinica.

El modo dental debe servir tambien a clinicas con operacion formal: responsables de almacen, compras recurrentes, control de lotes, vencimientos, proveedores, continuidad de stock y posibles requisitos de infraestructura dedicada.

## Fase 1 implementada

- Dashboard como centro operativo diario.
  - Acciones recomendadas segun datos reales de la organizacion.
  - Rutina distinta para comercio general y modo DentalGest.
  - En comercio: POS, pedidos pendientes, inventario, compras, clientes y reportes.
  - En DentalGest: inventario dental, proveedores, compras y vencimientos.
- Ayuda contextual.
  - Modo DentalGest muestra solo guia de inventario, compras y administracion dental.
  - Add-ons comerciales de tienda quedan ocultos en ayuda dental.
  - Servidor propio administrado queda visible como add-on consultivo para clinicas con requisitos de infraestructura.
  - Se documenta que GestiOS no guarda datos clinicos.
- Busqueda global contextual.
  - Comercio busca productos, clientes y pedidos.
  - DentalGest busca solo insumos/productos de inventario.
- Correos.
  - Plantilla base profesional sin asset legacy.
  - Texto alternativo para entregabilidad.
  - Escape HTML para datos controlados por usuarios.
  - Dominio publico por defecto: `https://www.gestioshq.app`.

## Fase 2 recomendada

1. Inventario
   - Vista de reposicion por proveedor.
   - Filtro de productos sin costo, sin precio o sin stock minimo.
   - Accion rapida para crear orden de compra desde stock bajo.

2. Caja y ventas
   - Checklist de apertura y cierre diario.
   - Alertas si hay ventas del dia sin cierre.
   - Resumen de metodos de pago por turno.

3. Pedidos
   - Estados operativos claros: pendiente, confirmado, preparado, entregado, cancelado.
   - Alertas por pedidos pendientes antiguos.
   - Accion rapida para contactar cliente cuando exista canal configurado.

4. Clientes
   - Clientes inactivos.
   - Clientes frecuentes.
   - Cumpleanos y recordatorios sin prometer WhatsApp si no esta configurado.

5. Compras y proveedores
   - Historial por proveedor.
   - Proveedor sugerido para productos bajos.
   - Tiempo estimado de reposicion manual.

6. Reportes
   - Margen bruto aproximado cuando exista costo.
   - Productos que mas rotan.
   - Productos sin movimiento.
   - Ventas por dia y por metodo de pago.

7. Superadmin
   - Salud de cuentas: trial por vencer, pagos pendientes, tiendas sin productos, tiendas sin actividad.
   - Checklist de onboarding por organizacion.

8. Dental profesional
   - Vista de riesgo de continuidad de insumos.
   - Ordenes de compra sugeridas desde stock critico.
   - Filtro por responsable/area cuando exista modelo de roles o sucursales aprobado.
   - Runbook comercial para servidor propio administrado: alcance, SLA, backups, restore, monitoreo y costos.

## Reglas de ejecucion

- No agregar campos a Prisma sin migracion SQL revisada.
- No prometer QR, WhatsApp, SIAT, PSP o integraciones sin proveedor y credenciales reales.
- Priorizar mejoras que reduzcan trabajo manual del cliente o aumenten capacidad de cobrar.
- Cada fase debe cerrar con lint, typecheck, tests, build y E2E si toca flujo critico.

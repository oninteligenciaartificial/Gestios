# Bot IA add-on runbook

## Objetivo

Convertir WhatsApp Business + Bot IA en un add-on vendible sin prometer automatizacion no preparada.

El bot no reemplaza al operador. Su funcion inicial es:

- responder preguntas frecuentes aprobadas;
- calificar solicitudes;
- registrar contexto;
- derivar a humano cuando falte informacion, exista reclamo o haya riesgo comercial.

## Estado tecnico actual

GestiOS ya tiene:

- add-on `WHATSAPP` por organizacion;
- credenciales por tenant en `OrgAddon`;
- webhook Meta multi-tenant en `/api/webhooks/whatsapp`;
- bandeja de conversaciones en `/conversations`;
- readiness seguro en `/api/addons/whatsapp-readiness`;
- envio WhatsApp via `sendWhatsAppText` y `sendWhatsAppTemplate`.

El readiness no expone secretos. Solo devuelve booleanos y pasos faltantes.

## Requisitos antes de venderlo como activo

### Tecnicos

- Add-on `WHATSAPP` activo.
- `phoneNumberId` guardado para la organizacion.
- `accessToken` permanente guardado para la organizacion.
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` o `WA_VERIFY_TOKEN` configurado.
- `WHATSAPP_APP_SECRET` o `WA_APP_SECRET` configurado.
- Webhook Meta registrado:

```txt
https://www.gestioshq.app/api/webhooks/whatsapp
```

- `OPENAI_API_KEY` configurada si el alcance incluye respuestas IA.

### Operativos

- Base de respuestas aprobada por el negocio.
- Guion de calificacion.
- Preguntas obligatorias por tipo de solicitud.
- Reglas de escalamiento humano.
- Responsable humano y horario de atencion.
- Prueba interna con numero real antes de activar con clientes.

## Alcance comercial recomendado

### Setup inicial

Cobrar una sola vez por:

- configuracion Meta;
- conexion webhook;
- base de respuestas;
- guion de calificacion;
- pruebas internas;
- capacitacion breve.

### Mensualidad

Cobrar mensual por:

- monitoreo de respuestas;
- ajustes de conocimiento;
- revision mensual de conversaciones;
- soporte de integracion;
- mantenimiento de plantillas.

Meta puede cobrar consumo aparte. No incluir consumo ilimitado dentro del precio base.

## Flujo minimo del bot

1. Cliente escribe al WhatsApp del negocio.
2. Meta envia el evento a `/api/webhooks/whatsapp`.
3. GestiOS identifica la organizacion por `phoneNumberId`.
4. GestiOS registra o actualiza la conversacion.
5. Si el bot esta habilitado y el readiness esta completo:
   - clasifica intencion;
   - responde solo con base aprobada;
   - pide datos faltantes;
   - escala cuando no debe responder.
6. El humano toma control cuando hay que cotizar, resolver reclamo o cerrar venta sensible.

## Reglas de seguridad comercial

- No prometer precios, descuentos o disponibilidad si no esta en la base aprobada.
- No pedir datos sensibles innecesarios.
- No diagnosticar temas medicos, legales o financieros.
- No cerrar ventas de alto valor sin confirmacion humana.
- No decir que el bot esta activo si `Bot IA` aparece como `Requiere setup` en Add-ons.

## Checklist de activacion

1. Superadmin activa WhatsApp para la organizacion.
2. Copiar webhook desde Add-ons > Readiness WhatsApp / Bot IA.
3. Registrar webhook y verify token en Meta.
4. Confirmar que el readiness marque WhatsApp `Operativo`.
5. Cargar base de respuestas y guion.
6. Configurar `OPENAI_API_KEY` si aplica.
7. Definir responsable humano.
8. Probar con numero interno.
9. Activar piloto con limite de alcance.
10. Revisar conversaciones a los 7 dias.

## Criterio de no-go

No activar comercialmente si:

- faltan credenciales Meta;
- no hay responsable humano;
- no existe base de respuestas;
- el cliente espera atencion 24/7 sin soporte;
- el negocio no tiene claro que debe responder el bot;
- no se acepta que el consumo Meta/IA puede cobrarse aparte.

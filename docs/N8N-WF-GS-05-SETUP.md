# WF-GS-05: BCP Auto Payment Confirmation

**Workflow URL:** https://n8n-sergio-n8n.hqdqgh.easypanel.host/workflow/jtLIb0i6jxAZOvwa

## Objetivo

WF-GS-05 lee correos de confirmacion BCP, extrae una referencia `PAGO-...` y llama a GestiOS para confirmar el pago. GestiOS hace la actualizacion de DB; n8n ya no debe usar Supabase REST ni `SUPABASE_SERVICE_ROLE_KEY` para este flujo.

## Flujo actual

```txt
Gmail Trigger cada 1 min
  -> filtra correos BCP / Interbancaria QR
  -> extrae referencia con regex PAGO-[A-Z0-9]+-\d+
  -> si hay referencia:
       POST https://gestioshq.app/api/billing/n8n-confirm
       Authorization: Bearer <GESTIOS_API_KEY>
       body: { "reference": "<referencia>" }
  -> 200: pago confirmado y plan activado
  -> 404: referencia no existe o ya fue procesada; no reintentar como error critico
```

## Credenciales necesarias

### Gmail

1. En n8n, crear o reconectar credencial **Gmail OAuth2**.
2. Cuenta esperada: `sergio.urcullo.m@gmail.com`.
3. Permiso minimo: lectura de correos.

### GestiOS API

1. En Vercel, configurar `GESTIOS_API_KEY` con un secreto largo aleatorio.
2. En n8n, crear credencial **Bearer Auth**.
3. Token: el mismo valor de `GESTIOS_API_KEY`, sin escribir la palabra `Bearer`.
4. Asignar esa credencial al nodo HTTP Request que llama GestiOS.

No usar `SUPABASE_SERVICE_ROLE_KEY` en este workflow.

## Nodo HTTP Request final

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `https://gestioshq.app/api/billing/n8n-confirm` |
| Authentication | Bearer Auth |
| Body Content Type | JSON |
| Body | `{ "reference": "={{ $json.reference }}" }` |

Respuesta exitosa esperada:

```json
{
  "success": true,
  "paymentRequestId": "string",
  "organizationId": "string",
  "reference": "PAGO-...",
  "plan": "CRECER",
  "months": 1,
  "confirmedAt": "ISO date",
  "planExpiresAt": "ISO date"
}
```

## Formato BCP esperado

```txt
From: BolBancaMov@bcp.com.bo
Subject: Interbancaria QR - Banca Movil

Glosa: PAGO-A1B2C3D4-1716900000000
Monto: Bs. 350.00
```

Regex:

```txt
PAGO-[A-Z0-9]+-\d+
```

## Prueba recomendada

1. Crear una solicitud desde `/billing`.
2. Copiar la referencia `PAGO-...`.
3. Ejecutar el workflow manualmente con un input que tenga esa referencia o esperar el correo real de BCP.
4. Confirmar que el nodo GestiOS devuelve `200`.
5. Verificar en GestiOS:
   - `payment_requests.status = CONFIRMADO`
   - `payment_requests.confirmedBy = n8n-auto`
   - `organizations.plan` actualizado
   - `organizations.planExpiresAt` actualizado

## Troubleshooting

| Sintoma | Causa probable | Fix |
|---|---|---|
| `401` desde GestiOS | Bearer token no coincide con `GESTIOS_API_KEY` | Actualizar credencial Bearer en n8n o Vercel env |
| `404` desde GestiOS | Referencia no existe, no esta pendiente o ya fue procesada | Revisar `/superadmin/payments` |
| No dispara Gmail | Credencial Gmail desconectada, filtro muy estricto o correo ya leido | Reautorizar Gmail y revisar filtro del trigger |
| Pago queda pendiente | n8n no llamo el endpoint o recibio 401/404 | Revisar executions de WF-GS-05 |

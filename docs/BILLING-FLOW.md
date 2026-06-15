# GestiOS — Flujo de Pago y Activación de Plan

## Resumen

**Nota vigente para WF-GS-05:** n8n debe confirmar pagos llamando `POST /api/billing/n8n-confirm` con `Authorization: Bearer <GESTIOS_API_KEY>`. No debe escribir directo en Supabase REST con `SUPABASE_SERVICE_ROLE_KEY`.

GestiOS opera en Bolivia. No usa Stripe ni pasarelas internacionales.
El flujo es 100% manual: transferencia bancaria BCP + confirmación automática vía n8n.

---

## Actores

| Actor | Rol |
|---|---|
| Cliente (workspace admin) | Inicia el pago desde `/billing` |
| BCP Bolivia | Banco que procesa la transferencia |
| n8n WF-GS-05 | Detecta el email de confirmación BCP y activa el plan |
| Supabase | DB donde vive `payment_requests` y `organizations` |

---

## Flujo Completo

```
1. Cliente entra a /billing
2. Elige plan (BASICO/CRECER/PRO/EMPRESARIAL) + meses (1-12)
3. Click "Pagar con transferencia bancaria"
4. POST /api/billing/checkout → crea PaymentRequest{status: PENDIENTE}
5. UI muestra: cuenta BCP + monto + referencia PAGO-XXXXXXXX-timestamp
6. Cliente hace transferencia BCP incluyendo la referencia en la "Glosa"
7. BCP envía email de confirmación a sergio.urcullo.m@gmail.com
8. n8n WF-GS-05 detecta el email (polling cada 1 min)
9. n8n extrae referencia con regex /PAGO-[A-Z0-9]+-\d+/
10. n8n llama `POST /api/billing/n8n-confirm` con `GESTIOS_API_KEY`
11. GestiOS busca la solicitud pendiente, confirma el pago y actualiza el plan en una transaccion
12. Plan activo — workspace desbloqueado
```

---

## Descuentos por Volumen

| Meses | Descuento |
|---|---|
| 1-2 | 0% |
| 3-5 | 5% |
| 6-11 | 10% |
| 12 | 15% |

---

## Precios (BOB)

| Plan | Mensual |
|---|---|
| BASICO | Bs. 350 |
| CRECER | Bs. 530 |
| PRO | Bs. 800 |
| EMPRESARIAL | Bs. 1.250 |

Definidos en `lib/plans.ts` → `PLAN_PRICES_BOB`.

---

## Datos Bancarios

```
Banco:   BCP Bolivia
Cuenta:  701-51726678-3-55
Titular: Urcullo Mercado Sergio
```

QR estático: `/public/QR-BCP-GESTIOS.png`

---

## API Endpoints

### POST /api/billing/n8n-confirm
- Auth: `Authorization: Bearer <GESTIOS_API_KEY>` o `x-gestios-api-key`
- Body: `{ reference: "PAGO-..." }`
- Accion: confirma solo solicitudes `PENDIENTE`, marca `confirmedBy=n8n-auto` y activa/extiende el plan.
- Uso: n8n WF-GS-05. Reemplaza acceso directo de n8n a Supabase REST.

### POST /api/billing/checkout
- Auth: role=ADMIN del workspace
- Body: `{ plan: "CRECER", months: 3 }`
- Valida: no puede haber otra solicitud PENDIENTE (409)
- Devuelve: referencia + instrucciones bancarias
- Crea: `PaymentRequest` en DB

### POST /api/billing/confirm
- Auth: role=SUPERADMIN (via `getSuperAdmin()`)
- Body: `{ reference: "PAGO-...", organizationId: "..." }`
- Acción: transacción atómica — PaymentRequest → CONFIRMADO + Organization → plan actualizado
- Usado por: superadmin. n8n debe usar `/api/billing/n8n-confirm`.

---

## Modelo DB

```prisma
model PaymentRequest {
  id             String    @id @default(cuid())
  organizationId String
  plan           String    // BASICO | CRECER | PRO | EMPRESARIAL
  months         Int
  amountBOB      Int
  reference      String    @unique
  status         String    @default("PENDIENTE") // PENDIENTE | CONFIRMADO | RECHAZADO
  confirmedAt    DateTime?
  confirmedBy    String?
  createdAt      DateTime  @default(now())
}
```

---

## n8n Workflow WF-GS-05

- **ID**: `jtLIb0i6jxAZOvwa`
- **URL**: https://n8n-sergio-n8n.hqdqgh.easypanel.host/workflow/jtLIb0i6jxAZOvwa
- **Trigger**: Gmail OAuth2 polling cada 1 minuto
- **Email**: `sergio.urcullo.m@gmail.com`
- **Remitente BCP**: `BolBancaMov@bcp.com.bo`
- **Subject BCP**: `Interbancaria QR - Banca Móvil`
- **Regex**: `/PAGO-[A-Z0-9]+-\d+/`
- **Setup completo**: ver `docs/N8N-WF-GS-05-SETUP.md`

---

## Estados de PaymentRequest

| Estado | Descripción |
|---|---|
| PENDIENTE | Cliente generó solicitud, esperando transferencia |
| CONFIRMADO | n8n detectó pago, plan activado |
| RECHAZADO | Cancelado manualmente por superadmin |

---

## Casos Edge

**Cliente ya tiene solicitud pendiente**
→ `POST /api/billing/checkout` devuelve 409
→ UI muestra mensaje "Ya tienes una solicitud pendiente"

**Referencia no encontrada en email**
→ n8n skip, no hace nada

**Referencia ya procesada (no PENDIENTE)**
→ Supabase devuelve array vacío → n8n skip

**Plan ya activo**
→ GestiOS actualiza normalmente la organizacion (extiende o cambia plan)

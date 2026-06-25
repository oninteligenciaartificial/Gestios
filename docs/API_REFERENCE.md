# API Reference

Base path: `/api`. Todas las rutas requieren sesión Supabase activa.  
Formato de respuesta paginada: `{ data: T[], meta: { total, page, limit, pages } }`  
Formato de error: `{ error: string, upgrade?: true, requiredPlan?: PlanType }`

---

## /api/me

### GET /api/me
Retorna el perfil del usuario autenticado + org.

**Response:** `Profile & { email: string, organization: Organization }`

Si SUPERADMIN está impersonando: retorna con `role: "ADMIN"` y org impersonada.

### PATCH /api/me
Actualiza perfil y/o organización.

**Permiso requerido:** Solo ADMIN puede editar datos de org.

**Body:**
```json
{
  "name": "string",
  "orgName": "string",
  "orgPhone": "string",
  "orgAddress": "string",
  "orgRfc": "string",
  "orgLogoUrl": "string",
  "orgCurrency": "string",
  "orgBusinessType": "GENERAL|ROPA|SUPLEMENTOS|ELECTRONICA|FARMACIA|DENTAL|FERRETERIA"
}
```

**Response:** `{ ok: true }`

---

## /api/products

### GET /api/products
Lista productos activos de la org.

**Query params:**
- `search` — filtro por nombre (insensible a mayúsculas)
- `categoryId` — filtro por categoría
- `page` (default 1), `limit` (default 100, max 200)

**Response:** paginada. Incluye `category`, `supplier`, `variants[]` (solo activos).

### POST /api/products
**Permiso:** `products:create`  
**Límite plan:** BASICO 150, CRECER 500, PRO/EMPRESARIAL ∞

**Body:**
```json
{
  "name": "string (required)",
  "description": "string?",
  "sku": "string?",
  "barcode": "string?",
  "unit": "string?",
  "categoryId": "string?",
  "supplierId": "string?",
  "price": 0,
  "cost": 0,
  "stock": 0,
  "minStock": 5,
  "batchExpiry": "ISO date?",
  "imageUrl": "string?",
  "hasVariants": false,
  "attributeSchema": { "talla": ["XS","S","M"], "color": [] }
}
```

Nota: si `hasVariants=true`, `stock` se guarda como 0 (se maneja por variantes).

---

## /api/products/[id]

### PATCH /api/products/[id]
**Permiso:** solo ADMIN.  
Campos actualizables: `name`, `description`, `sku`, `categoryId`, `supplierId`, `price`, `cost`, `stock`, `minStock`, `active`.

### DELETE /api/products/[id]
**Permiso:** solo ADMIN.  
Soft-delete: pone `active: false`.

---

## /api/products/[id]/variants

### GET /api/products/[id]/variants
Retorna variantes activas del producto.

### POST /api/products/[id]/variants
**Permiso:** `products:create`

**Body:**
```json
{
  "attributes": { "talla": "M", "color": "Negro" },
  "sku": "string?",
  "stock": 0,
  "price": null
}
```

### PATCH /api/products/[id]/variants?variantId=xxx
**Permiso:** `products:edit`

**Body (todos opcionales):** `attributes`, `sku`, `stock`, `price`, `active`

### DELETE /api/products/[id]/variants?variantId=xxx
**Permiso:** `products:delete`  
Soft-delete: `active: false`.

---

## /api/products/stock-entry

### GET /api/products/stock-entry
**Permiso:** cualquiera  
Retorna historial de stock entries de un producto.

**Query params:**
- `productId` — ID del producto (required)

**Response:**
```json
[
  {
    "id": "string",
    "organizationId": "string",
    "userId": "string",
    "userName": "string",
    "action": "stock_entry",
    "entity": "product",
    "entityId": "string",
    "details": "{\"quantity\": 10, \"variantId\": null, \"notes\": null}",
    "createdAt": "ISO date"
  }
]
```

### POST /api/products/stock-entry
**Permiso:** solo ADMIN.  
Incrementa stock del producto o variante. Crea entry en activity log.

**Body:**
```json
{
  "productId": "string",
  "variantId": "string?",
  "quantity": 1,
  "notes": "string?"
}
```

**Response:** producto/variante actualizado.

---

## /api/products/export — /api/products/import

### GET /api/products/export
**Permiso:** `products:export` (CRECER+)  
Descarga CSV de productos.

### POST /api/products/import
**Permiso:** `products:import` (CRECER+)  
Sube CSV de productos. `multipart/form-data` con campo `file`.

---

## /api/orders

### GET /api/orders
**Query params:**
- `status` — `PENDIENTE|CONFIRMADO|ENVIADO|ENTREGADO|CANCELADO`
- `page`, `limit` (max 200)

**Response:** paginada. Incluye `items[].product`, `customer`, `staff`.

### POST /api/orders
**Permiso:** `orders:create`

**Body:**
```json
{
  "customerName": "string (required)",
  "customerId": "string?",
  "paymentMethod": "EFECTIVO|TARJETA|TRANSFERENCIA",
  "shippingAddress": "string?",
  "notes": "string?",
  "items": [
    {
      "productId": "string",
      "quantity": 1,
      "unitPrice": 0,
      "variantId": "string?",
      "variantSnapshot": { "talla": "M" }
    }
  ]
}
```

**Efectos secundarios:**
- Decrementa stock (variante si `variantId`, producto si no)
- Envía email de confirmación al cliente (si tiene email)
- Envía alerta de nuevo pedido a admins de la org

---

## /api/orders/[id]

### GET /api/orders/[id]
Retorna pedido con items y cliente.

### PATCH /api/orders/[id]
**Permiso:** `orders:edit`

**Body:**
```json
{
  "status": "PENDIENTE|CONFIRMADO|ENVIADO|ENTREGADO|CANCELADO",
  "notes": "string?"
}
```

**Efectos secundarios:**
- Cancela → restaura stock
- Des-cancela → re-decrementa stock
- Cambia estado → envía email de actualización al cliente
- Marca ENTREGADO → acumula puntos de lealtad (1 punto por Bs. 10)

---

## /api/customers

### GET /api/customers
**Permiso:** `customers:view`

**Query params:** `search` (nombre/phone/email), `page`, `limit` (default 100)

### POST /api/customers
**Permiso:** `customers:create`  
**Límite plan:** BASICO 50, CRECER 300, PRO/EMPRESARIAL ∞

**Body:**
```json
{
  "name": "string (required)",
  "phone": "string?",
  "email": "string?",
  "address": "string?",
  "rfc": "string?",
  "birthday": "ISO date?",
  "notes": "string?"
}
```

---

## /api/customers/[id]

### GET, PATCH, DELETE — CRUD estándar
**Permiso:** `customers:view/edit`

---

## /api/customers/export — /api/customers/import
**Permiso:** `csv_export/csv_import` (CRECER+)

---

## /api/categories

### GET /api/categories — lista todas
### POST /api/categories — `{ name: string }`
### PATCH /api/categories/[id] — `{ name: string }`
### DELETE /api/categories/[id] — elimina si no tiene productos

---

## /api/suppliers
Plan CRECER+. CRUD estándar: `{ name, contact?, phone?, email?, notes? }`

---

## /api/discounts
CRUD estándar.

**Body POST:**
```json
{
  "code": "VERANO20",
  "description": "string?",
  "type": "PORCENTAJE|MONTO_FIJO",
  "value": 20,
  "expiresAt": "ISO date?"
}
```

---

## /api/branches
Plan EMPRESARIAL. CRUD: `{ name, address?, phone? }`

---

## /api/reports

### GET /api/reports
Plan CRECER+.

**Query params:**
- `from` (ISO date) — default primer día del mes actual
- `to` (ISO date) — default hoy
- `branchId` (string?) — filtrar por sucursal

**Response:**
```json
{
  "currency": "BOB",
  "totalRevenue": 0,
  "totalOrders": 0,
  "totalCustomers": 0,
  "totalMargin": 0,
  "topSelling": [{ "name", "quantity", "revenue", "margin" }],
  "salesByCategory": [{ "name", "revenue", "quantity" }],
  "topCustomers": [{ "customerId", "customerName", "total", "orders" }],
  "lowStock": [{ "id", "name", "stock", "minStock" }],
  "paymentBreakdown": { "EFECTIVO": 0, "TARJETA": 0 },
  "salesByStaff": [{ "staffId", "staffName", "total", "orders" }],
  "noMovement": [{ "id", "name", "stock", "updatedAt" }]
}
```

---

## /api/reports/caja
Reporte de corte de caja por turno/día.

---

## /api/addons

### GET /api/addons
Retorna add-ons activos de la org.

### GET /api/addons/whatsapp-readiness

Retorna el estado de activacion de WhatsApp Business + Bot IA para la organizacion autenticada. No expone tokens ni secretos.

**Response:**
```json
{
  "whatsappReady": false,
  "botReady": false,
  "webhookUrl": "https://www.gestioshq.app/api/webhooks/whatsapp",
  "checks": [
    {
      "key": "addon_active",
      "label": "Add-on WhatsApp activo para la organizacion",
      "ok": false,
      "requiredFor": "whatsapp",
      "owner": "superadmin"
    }
  ],
  "manualRequirements": ["Base de respuestas aprobada por el negocio."],
  "nextSteps": ["Add-on WhatsApp activo para la organizacion"]
}
```

---

## /api/payments

### POST /api/payments
Crea solicitud de pago manual (QR boliviano). Gestionada desde superadmin.

---

## /api/billing/n8n-confirm

### POST
Endpoint server-to-server para que n8n confirme pagos BCP por referencia.

**Auth:** `Authorization: Bearer <GESTIOS_API_KEY>` o header `x-gestios-api-key`.

**Body:**
```json
{
  "reference": "PAGO-ABC12345-1781380000000"
}
```

**Efectos secundarios:**
- Busca `PaymentRequest` con `reference` y `status=PENDIENTE`.
- Marca el pago como `CONFIRMADO`, `confirmedBy=n8n-auto`.
- Actualiza la organizacion al plan pagado.
- Extiende `planExpiresAt` desde la fecha actual o desde el vencimiento vigente si aun esta activo.
- Limpia `trialEndsAt`.

**Response OK:**
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

**Errores:** `401` key invalida, `404` referencia inexistente o ya procesada, `503` falta `GESTIOS_API_KEY`.

---

## /api/activity-log

### GET /api/activity-log
Feed de actividad de la org. Todos los planes.

---

## /api/setup

### POST /api/setup
Solo para usuarios sin perfil. Crea org + profile ADMIN.

**Body:**
```json
{
  "organizationName": "string",
  "userName": "string"
}
```

Crea org con slug único y trial de 7 días. **Solo funciona una vez por usuario.**

---

## /api/superadmin/impersonate

### POST — inicia impersonación (guarda cookie `impersonate_org_id`)
### DELETE — termina impersonación

---

## /api/purchase-orders

Plan CRECER+. Órdenes de compra a proveedores.

### GET /api/purchase-orders
**Query params:**
- `page` (default 1), `limit` (default 20)
- `status` — filtro: BORRADOR, ENVIADO, PARCIAL, RECIBIDO, CANCELADO
- `supplierId` — filtro por proveedor

**Response:** paginada con items e info de proveedor.

### POST /api/purchase-orders
**Body:**
```json
{
  "supplierId": "string",
  "expectedDate": "ISO date?",
  "notes": "string?",
  "items": [
    {
      "productId": "string",
      "quantity": 10,
      "unitCost": 50.00
    }
  ]
}
```

**Response:** orden creada (status 201).

### PATCH /api/purchase-orders
**Query params:** `id` (required)

**Body:**
```json
{
  "status": "BORRADOR|ENVIADO|PARCIAL|RECIBIDO|CANCELADO?",
  "expectedDate": "ISO date?",
  "notes": "string?"
}
```

**Efectos secundarios:**
- Si `status === RECIBIDO`, incrementa stock de todos los items.

### DELETE /api/purchase-orders
**Query params:** `id` (required)

No permite eliminar órdenes RECIBIDO.

---

## /api/sessions

Gestión de sesiones de usuario (dispositivos).

### GET /api/sessions
Retorna todas las sesiones activas del usuario.

**Response:**
```json
[
  {
    "id": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "userAgent": "string | null",
    "isCurrent": boolean
  }
]
```

### DELETE /api/sessions/[id]
Cierra sesión de un dispositivo específico.

**Response:** `{ ok: true }`

---

## /api/sample-data

### POST /api/sample-data
**Permiso:** solo ADMIN  
Genera datos de ejemplo para la organización (productos, clientes, órdenes).

**Response:**
```json
{
  "productsCreated": 15,
  "customersCreated": 10,
  "ordersCreated": 5,
  "message": "Datos de ejemplo creados exitosamente"
}
```

---

## /api/tienda/settings

Configuración de tienda online (PRO+).

### GET /api/tienda/settings
Retorna configuración y estadísticas de la tienda.

**Response:**
```json
{
  "slug": "string",
  "name": "string",
  "currency": "BOB",
  "activeProducts": 42,
  "lastOrder": {
    "id": "string",
    "customerName": "string",
    "total": 150.00,
    "createdAt": "ISO date"
  } | null
}
```

---

## /api/team

Gestión de staff (usuarios adicionales). Plan BASICO 1 staff, CRECER 5, PRO/EMPRESARIAL ∞.

### GET /api/team
**Permiso:** ADMIN

Retorna todos los miembros de la organización.

**Response:**
```json
[
  {
    "id": "string",
    "userId": "string",
    "name": "string",
    "role": "ADMIN|STAFF",
    "organizationId": "string",
    "branchId": "string | null"
  }
]
```

### POST /api/team
**Permiso:** ADMIN  
**Rate limit:** 5 invitaciones por minuto

Crea nuevo usuario en Supabase Auth y Profile en la org.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 6 chars)",
  "role": "ADMIN|STAFF"
}
```

**Response:** profile creado (status 201).

---

## /api/cron/*

Endpoints internos para Vercel Cron. No requieren sesión de usuario pero verifican header de autorización.

| Ruta | Acción |
|---|---|
| `GET /api/cron/birthday` | Emails de cumpleaños |
| `GET /api/cron/expiry` | Alertas de vencimiento (7 días) |
| `GET /api/cron/inactive-customers` | Emails a clientes inactivos 30+ días |
| `GET /api/cron/plan-expiry` | Alerta y suspensión de planes vencidos |
| `GET /api/cron/low-stock` | Alertas de stock bajo |
| `GET /api/cron/expire-qr` | Expira QRs de pago vencidos |

---

## /api/webhooks/whatsapp

### GET — verificación del webhook Meta
### POST — recepción de mensajes entrantes

---

## /api/webhooks/brevo

### POST — tracking de eventos de email (delivery, bounce, spam)

**Header requerido:** `x-brevo-webhook-key` con valor de `BREVO_WEBHOOK_KEY`

**Body:**
```json
{
  "event": "delivered|bounce|blocked|spam|error",
  "email": "cliente@ejemplo.com",
  "message-id": "<brevo-message-id>",
  "date": "2026-05-11T12:00:00Z",
  "reason": "mailbox full"  // solo para bounce/error
}
```

Actualiza el `EmailLog` correspondiente con el nuevo status.

---

## Environment Variables

| Variable | Propósito | Requerida en |
|---|---|---|
| `RESEND_API_KEY` | Transactional emails | Production |
| `EMAIL_FROM_ADDRESS` | Sender email (default: noreply@onia.com.bo) | Production |
| `EMAIL_FROM_NAME` | Sender name (default: GestiOS) | Production |
| `SENTRY_AUTH_TOKEN` | Source map uploads en build | Production |
| `BREVO_WEBHOOK_KEY` | Signing webhooks de email | Production |
| `GESTIOS_API_KEY` | Auth de n8n hacia endpoints internos | Production |

Ver `docs/ARCHITECTURE.md` para lista completa.

---

## /api/superadmin/email-stats

### GET — métricas de email para SUPERADMIN

**Query params:**
- `from` / `to` — rango de fechas (default últimos 30 días)
- `type` — filtro por tipo de email
- `status` — filtro por status

**Response:**
```json
{
  "total": 1234,
  "delivered": 1100,
  "bounced": 50,
  "failed": 84,
  "byType": [{ "type": "order_confirmation", "count": 800 }],
  "byStatus": [{ "status": "DELIVERED", "count": 1100 }],
  "daily": [{ "date": "2026-05-11", "sent": 45, "delivered": 42 }]
}
```

---

## /api/addons/qr-bolivia

### GET — retorna URL del QR subido por el merchant (para POS)

**Response:**
```json
{
  "qrImageUrl": "https://...supabase.co/storage/.../qr.png",
  "active": true
}
```

### POST — activa/desactiva el addon QR Bolivia

**Body:**
```json
{
  "active": true,
  "hasNit": true,
  "nit": "123456789"  // opcional si hasNit=false
}
```

---

## /api/addons/qr-bolivia/upload

### POST — sube imagen QR personal (para merchants sin NIT)

**Content-Type:** `multipart/form-data` con campo `file`

**Response:**
```json
{
  "url": "https://...supabase.co/storage/.../qr.png"
}
```

---

## Códigos de error comunes

| Status | Significado |
|---|---|
| 401 | Sin sesión |
| 403 | Sin permiso, o límite de plan alcanzado (`upgrade: true`) |
| 404 | Recurso no encontrado o no pertenece a la org |
| 400 | Body inválido o JSON malformado |
| 409 | Conflicto (ej: setup duplicado, slug ya existe) |

# Base de Datos

PostgreSQL vía Supabase. ORM: Prisma. Fuente de verdad: `prisma/schema.prisma`.

## Enums

```
PlanType:             BASICO | CRECER | PRO | EMPRESARIAL
AddonType:            WHATSAPP | FACTURACION | QR_BOLIVIA | ECOMMERCE | CONTABILIDAD
QrPaymentStatus:      PENDIENTE | PAGADO | EXPIRADO | CANCELADO | FALLIDO
Role:                 SUPERADMIN | ADMIN | MANAGER | STAFF | VIEWER
OrderStatus:          PENDIENTE | CONFIRMADO | ENVIADO | ENTREGADO | CANCELADO
PaymentMethod:        EFECTIVO | TARJETA | TRANSFERENCIA
DiscountType:         PORCENTAJE | MONTO_FIJO
PaymentRequestStatus: PENDIENTE | CONFIRMADO | RECHAZADO
```

## Modelos

### Organization (`organizations`)
Tenant raíz. Todo dato lleva `organizationId`.

| Campo | Tipo | Notas |
|---|---|---|
| id | cuid | PK |
| name | String | |
| slug | String | unique — URL pública |
| currency | String | default "BOB" |
| businessType | String | default "GENERAL" |
| plan | PlanType | default BASICO |
| planExpiresAt | DateTime? | null = sin expiración |
| trialEndsAt | DateTime? | |
| stripeCustomerId / stripeSubId | String? | unique, para Stripe futuro |

---

### Profile (`profiles`)
Un profile por usuario Supabase. Liga `userId` (Auth UID) con org y rol.

| Campo | Tipo | Notas |
|---|---|---|
| userId | String | unique |
| organizationId | String? | null = SUPERADMIN sin org |
| role | Role | default STAFF |
| branchId | String? | sucursal asignada |

---

### Branch (`branches`)
Sucursales físicas. Solo plan EMPRESARIAL.

---

### OrgAddon (`org_addons`)
Add-ons activos por org. `unique([organizationId, addon])`.

| Campo | Tipo |
|---|---|
| addon | AddonType |
| active | Boolean |
| stripeItemId | String? |
| phoneNumberId | String? | Para WhatsApp: Meta phone_number_id. Para QR Bolivia: URL de imagen QR subida |

---

### Product (`products`)

| Campo | Tipo | Notas |
|---|---|---|
| categoryId | String? | FK → Category (SetNull) |
| supplierId | String? | FK → Supplier (SetNull) |
| sku | String? | unique per org |
| price / cost | Decimal(10,2) | |
| stock | Int | ignorado si hasVariants=true |
| minStock | Int | threshold de alerta |
| batchExpiry | DateTime? | para farmacia/alimentos |
| hasVariants | Boolean | default false |
| attributeSchema | Json? | schema de ejes |
| active | Boolean | soft-delete |

Índice único: `(organizationId, sku)`

---

### ProductVariant (`product_variants`)

| Campo | Tipo | Notas |
|---|---|---|
| productId | String | FK → Product (cascade delete) |
| attributes | Json | `{ talla: "M", color: "Negro" }` |
| sku | String? | unique per org |
| stock | Int | stock propio |
| price | Decimal? | null = hereda precio del producto |
| active | Boolean | soft-delete |

Índices: `(productId, active)`, `(organizationId)`

---

### Customer (`customers`)

| Campo | Tipo |
|---|---|
| name / phone / email / address / rfc | String? |
| birthday | DateTime? |
| loyaltyPoints | Int |
| notes | String? |

---

### Order (`orders`)

| Campo | Tipo | Notas |
|---|---|---|
| customerId | String? | FK (SetNull) |
| staffId | String? | FK (SetNull) |
| branchId | String? | FK (SetNull) |
| customerName | String | snapshot del nombre |
| status | OrderStatus | |
| paymentMethod | PaymentMethod | |
| total | Decimal(10,2) | |

---

### OrderItem (`order_items`)

| Campo | Tipo | Notas |
|---|---|---|
| orderId | String | FK → Order (cascade) |
| productId | String | FK → Product (restrict) |
| variantId | String? | FK → ProductVariant (SetNull) |
| quantity | Int | |
| unitPrice | Decimal(10,2) | precio al momento de la venta |
| variantSnapshot | Json? | atributos congelados al vender |

Índice: `(variantId)`

---

### Discount (`discounts`)
`unique([organizationId, code])`

| Campo | Tipo |
|---|---|
| code | String |
| type | DiscountType |
| value | Decimal |
| active | Boolean |
| expiresAt | DateTime? |

---

### PurchaseOrder (`purchase_orders`)
Órdenes de compra a proveedores. Plan CRECER+.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| organizationId | String | FK → Organization (cascade) |
| supplierId | String | FK → Supplier (restrict) |
| status | PurchaseOrderStatus | BORRADOR, ENVIADO, PARCIAL, RECIBIDO, CANCELADO |
| expectedDate | DateTime? | fecha esperada de entrega |
| total | Decimal(10,2) | suma de items |
| notes | String? | observaciones |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Índices: `(organizationId, createdAt)`, `(organizationId, status)`, `(supplierId)`

---

### PurchaseOrderItem (`purchase_order_items`)
Items dentro de una orden de compra.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| purchaseOrderId | String | FK → PurchaseOrder (cascade) |
| productId | String | FK → Product (restrict) |
| quantity | Int | cantidad solicitada |
| unitCost | Decimal(10,2) | costo unitario |
| received | Int | cantidad recibida (para PARCIAL) |

Índices: `(purchaseOrderId)`, `(productId)`

---

### Invoice (`invoices`)
Modelo historico de facturacion electronica. SIAT esta retirado del alcance comercial actual.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| organizationId | String | FK → Organization (cascade) |
| orderId | String | FK → Order (cascade, unique) |
| nroFactura | Int | número secuencial de factura |
| cufe | String? | Código Único de Factura Electrónica (del SIN) |
| cuis | String | CUIS vigente al momento de emisión |
| cufd | String | CUFD vigente al momento de emisión |
| nitEmisor | String | NIT de la empresa (de Organization.nitEmisor) |
| nitReceptor | String | NIT del cliente (default: "99999999" para consumidor final) |
| razonReceptor | String | nombre del cliente |
| status | InvoiceStatus | PENDIENTE, ENVIADO, OBSERVADO, ANULADO |
| xmlData | Text? | XML firmado enviado al SIN |
| sinResponse | Json? | respuesta cruda del SIN/intermediario |
| total | Decimal(10,2) | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Índices: `(organizationId, createdAt)`

---

### QrPayment (`qr_payments`)
Pagos via QR boliviano. Multi-proveedor.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| organizationId | String | FK → Organization (cascade) |
| orderId | String | FK → Order (cascade) |
| provider | String | "AGGREGATOR", "QR_SWITCH", "TIGO", "BIPAGO" |
| externalId | String | ID asignado por el PSP |
| qrPayload | Text | string EMVCo para renderizar QR |
| qrImageUrl | String? | URL imagen pre-renderizada (opcional) |
| amount | Decimal(10,2) | |
| currency | String | default "BOB" |
| status | QrPaymentStatus | PENDIENTE, PAGADO, EXPIRADO, CANCELADO, FALLIDO |
| expiresAt | DateTime | vencimiento del QR |
| paidAt | DateTime? | fecha de pago |
| payerInfo | Json? | info enmascarada del pagador |
| providerResponse | Json? | respuesta cruda del PSP |
| webhookReceivedAt | DateTime? | timestamp de webhook |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Índices: `unique([provider, externalId])`, `(organizationId, createdAt)`, `(orderId, status)`, `(status, expiresAt)`

---

### ActivityLog (`activity_logs`)
Feed de actividad. Disponible en todos los planes.

---

### AuditLog (`audit_logs`)
Log con JSON `before`/`after`. Solo plan EMPRESARIAL.

Índices: `(organizationId, createdAt)`, `(entityType, entityId)`

---

### PaymentRequest (`payment_requests`)
Solicitudes de pago manual via QR boliviano. Gestionadas desde superadmin.

| Campo | Tipo |
|---|---|
| plan | PlanType |
| months | Int |
| amountBOB | Decimal |
| status | PaymentRequestStatus |
| confirmedAt / confirmedBy | — |

---

### WaConversation (`wa_conversations`)
Conversaciones entrantes de WhatsApp. Solo si add-on WHATSAPP activo.

Índice: `(organizationId, openedAt)`

---

## Diagrama de relaciones (simplificado)

```
Organization
  ├── Profile[]
  ├── Branch[]
  ├── OrgAddon[]
  ├── Category[]
  ├── Supplier[]
  │     └── PurchaseOrder[]
  │           └── PurchaseOrderItem[] → Product
  ├── Discount[]
  ├── Product[]
  │     └── ProductVariant[]
  ├── Customer[]
  ├── Order[]
  │     ├── OrderItem[] → Product / ProductVariant
  │     ├── Invoice
  │     └── QrPayment[]
  ├── ActivityLog[]
  ├── AuditLog[]
  ├── PaymentRequest[]
  ├── WaConversation[]
  ├── CashRegister[]
  └── EmailLog[]
```

## Migraciones

Están en `prisma/migrations/`. Sin `DATABASE_URL` local — las migraciones se aplican en Vercel vía `prisma migrate deploy` en el build.

### `20260428000000_add_variants`
Agrega:
- `organizations.businessType`
- `products.hasVariants`, `products.attributeSchema`
- Tabla `product_variants` completa
- `order_items.variantId`, `order_items.variantSnapshot`

### `20260509120000_create_cash_registers`
Agrega:
- Tabla `cash_registers` — cierre diario de caja por organización/sucursal
- Índices únicos parciales para garantizar un corte por día (con y sin `branchId`)
- **Aplicado directamente a Supabase el 2026-05-09** (no via `migrate deploy`)

### `20260511181518_create_email_log`
Agrega:
- Tabla `email_logs` — tracking de emails enviados via Brevo/Resend
- Índices para queries por org, status y tipo
- **Aplicar manualmente a Supabase** (no via `migrate deploy`)

### `20260513120000_add_purchase_orders`
Agrega:
- Tabla `purchase_orders` — órdenes de compra a proveedores
- Tabla `purchase_order_items` — items de cada orden
- Modelo `PurchaseOrder` y `PurchaseOrderItem` en Prisma
- Enum `PurchaseOrderStatus: BORRADOR | ENVIADO | PARCIAL | RECIBIDO | CANCELADO`

### EmailLog (`email_logs`)

Log de emails enviados via Resend/Brevo. Cada envío se registra antes de llamar la API.

| Campo | Tipo | Notas |
|---|---|---|
| organizationId | String? | FK → Organization (nullable para emails del sistema) |
| to | String | destinatario |
| type | String | tipo de email (welcome_email, order_confirmation, etc.) |
| subject | String | asunto del email |
| status | String | SENT, DELIVERED, BOUNCED, FAILED |
| brevoMessageId | String? | ID de mensaje del proveedor de email (Resend/Brevo) para tracking |
| error | String? | mensaje de error si FAILED |
| createdAt | DateTime | timestamp de envío |

Índices: `(organizationId, createdAt)`, `(status, createdAt)`, `(type, createdAt)`

**Webhook tracking:** `/api/webhooks/brevo` actualiza `status` a DELIVERED/BOUNCED según eventos de email.

---

### CashRegister (`cash_registers`)

| Campo | Tipo | Notas |
|---|---|---|
| organizationId | String | FK → Organization (cascade) |
| staffId | String? | FK → Profile (SetNull) |
| branchId | String? | FK → Branch (SetNull) |
| date | Date | día del corte |
| totalEfectivo | Decimal(10,2) | total sistema efectivo |
| totalTarjeta | Decimal(10,2) | total sistema tarjeta |
| totalTransferencia | Decimal(10,2) | total sistema transferencia |
| totalQr | Decimal(10,2) | total sistema QR |
| montoRealEfectivo | Decimal(10,2)? | conteo físico del cajero |
| diferencia | Decimal(10,2)? | montoReal − totalEfectivo |
| notas | String? | observaciones del cierre |

Restricción: un solo corte por `(organizationId, date)` sin sucursal, o por `(organizationId, date, branchId)` con sucursal.

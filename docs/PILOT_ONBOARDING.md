# GestiOS — Onboarding de Clientes Piloto

Guía operativa para incorporar el primer cliente de pago. Fecha: 2026-06-08.

---

## 1. Crear una nueva organización (registro)

El cliente crea su propia cuenta desde la web pública.

### Flujo estándar (self-service)

1. El cliente entra a **https://gestioshq.app/signup**
2. Crea cuenta con email + contraseña
3. El sistema redirige a `/setup`
4. En `/setup` ingresa:
   - **Nombre de la tienda** (se genera un `slug` único automáticamente)
   - **Su nombre** (perfil del ADMIN)
   - **Tipo de negocio**: GENERAL, ROPA, SUPLEMENTOS, ELECTRONICA, FARMACIA, FERRETERIA
5. Se crea la organización con `plan: BASICO` y `trialEndsAt: ahora + 7 días`
6. Redirige a `/dashboard` con `WelcomeBanner`
   - Botón "Cargar datos de ejemplo" (carga productos/clientes ficticios, idempotente)
   - Accesos rápidos: inventario, POS, equipo

> El trial de 7 días da acceso completo (con límites BASICO). Sin acción el plan vence y redirige a `/plan-vencido`.

---

## 2. Activar un plan manualmente desde superadmin

Si el cliente ya pagó o se le quiere otorgar un plan sin esperar el flujo automático:

1. Ir a **https://gestioshq.app/superadmin/payments** (requiere cuenta `SUPERADMIN`)
2. Buscar la solicitud de pago (`PaymentRequest`) con status `PENDIENTE`
3. Click en "Confirmar pago"
4. El sistema ejecuta la transacción atómica:
   - `payment_requests.status → CONFIRMADO`
   - `organizations.plan → <plan elegido>`
   - `organizations.planExpiresAt → hoy + meses`

### Activación directa (sin solicitud de pago)

Si no existe `PaymentRequest` (cliente de cortesía, prueba, etc.):

```sql
-- Ejecutar en Supabase SQL Editor
UPDATE organizations
SET plan = 'CRECER',
    "planExpiresAt" = now() + interval '1 month'
WHERE id = '<organizationId>';
```

> Obtener el `organizationId` desde `/superadmin/organizations` — buscar por nombre o slug.

---

## 3. Módulos disponibles por plan

| Módulo / Feature | BASICO | CRECER | PRO | EMPRESARIAL |
|---|---|---|---|---|
| Dashboard + KPIs | ✅ | ✅ | ✅ | ✅ |
| Punto de Venta (POS) | ✅ | ✅ | ✅ | ✅ |
| Inventario (sin variantes) | ✅ | ✅ | ✅ | ✅ |
| Variantes de productos | — | ✅ | ✅ | ✅ |
| Pedidos (CRUD + estados) | ✅ | ✅ | ✅ | ✅ |
| Órdenes de compra | — | ✅ | ✅ | ✅ |
| Clientes | 50 max | 300 max | Ilimitados | Ilimitados |
| Descuentos | 3 max | Ilimitados | Ilimitados | Ilimitados |
| Staff | 1 | 3 | 10 | Ilimitado |
| Corte de caja | ✅ | ✅ | ✅ | ✅ |
| Categorías | ✅ | ✅ | ✅ | ✅ |
| Reportes avanzados | — | ✅ | ✅ | ✅ |
| Import/Export CSV | — | ✅ | ✅ | ✅ |
| Alertas de stock | — | ✅ | ✅ | ✅ |
| Proveedores | — | ✅ | ✅ | ✅ |
| Tienda Online (`/{slug}/tienda`) | — | — | ✅ | ✅ |
| Registro público clientes | — | — | ✅ | ✅ |
| Pagos QR Bolivia | — | — | ✅ | ✅ |
| Email marketing (12 tipos) | — | — | ✅ | ✅ |
| Sucursales múltiples | — | — | — | ✅ |
| Audit Log | — | — | — | ✅ |
| Facturación SIAT | — | — | — | ✅ |
| Roles avanzados | — | — | — | ✅ |
| Export contable | — | — | — | ✅ |

### Precios mensuales (BOB)

| Plan | Precio |
|---|---|
| BASICO | Bs. 350/mes |
| CRECER | Bs. 530/mes |
| PRO | Bs. 800/mes |
| EMPRESARIAL | Bs. 1.250/mes |

Descuentos por pago anticipado: 3-5 meses → 5%, 6-11 meses → 10%, 12 meses → 15%.

---

## 4. Add-ons con configuración externa

### WhatsApp Business

**Estado**: Backend completo. Requiere configuración externa por tenant.

Pasos para activar para un cliente:
1. El cliente debe tener una cuenta de **Meta Business Manager** con un número de WhatsApp Business
2. Obtener del cliente:
   - `Phone Number ID` (ID del número en Meta)
   - `Access Token` (System User token — no caduca)
3. En la DB, actualizar el `OrgAddon` del tenant:
   ```sql
   UPDATE "OrgAddon"
   SET "phoneNumberId" = '<PHONE_NUMBER_ID>',
       "accessToken"   = '<ACCESS_TOKEN>',
       active = true
   WHERE "organizationId" = '<orgId>'
     AND addon = 'WHATSAPP';
   ```
4. Registrar webhook en Meta Business Dashboard:
   - URL: `https://gestioshq.app/api/webhooks/whatsapp`
   - Verify Token: valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en Vercel
   - Suscribir a: `messages`

**Env vars en Vercel** (solo para fallback local, producción usa DB):
- `WHATSAPP_PHONE_NUMBER_ID` / `WA_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN` / `WA_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET` / `WA_APP_SECRET`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` / `WA_VERIFY_TOKEN`

### Facturación SIAT Bolivia

**Estado**: Scaffold completo. Requiere contrato con intermediario.

- Requiere NIT del cliente
- Requiere contratar intermediario: FacturAPI Bolivia o Nube Fiscal
- Ver `docs/SIAT-BOLIVIA.md` para detalles

### Pagos QR Bolivia (upload personal)

**Estado**: Upload de QR personal implementado y funcional.

- El cliente sube su QR de banco/Tigo/BiPago desde `/billing`
- Se guarda en Supabase Storage (bucket `org-assets`)
- Se muestra en el POS al cobrar
- QR automático via PSP (Kuapay, etc.) requiere contrato externo — pendiente

---

## 5. Acceso superadmin e impersonación

### URL de acceso

```
https://gestioshq.app/superadmin
```

Requiere cuenta con `role = SUPERADMIN` en Supabase Auth.

### Crear cuenta superadmin

Configurar en Vercel:
- `SUPERADMIN_EMAIL` — email del superadmin
- `SUPERADMIN_PASSWORD` — contraseña segura

O crear directamente en Supabase Auth + asignar `SUPERADMIN` en `profiles.role`.

### Módulos superadmin

| Ruta | Función |
|---|---|
| `/superadmin` | Panel principal — resumen de orgs y métricas |
| `/superadmin/organizations` | Listar, buscar y ver detalles de cada org |
| `/superadmin/users` | Ver todos los usuarios |
| `/superadmin/payments` | Confirmar/rechazar pagos BCP pendientes |

### Impersonar un tenant

1. Ir a `/superadmin/organizations`
2. Buscar la org por nombre o slug
3. Click en "Impersonar" — establece cookie de sesión de esa org
4. Se puede navegar como si fuera ese tenant
5. Para salir: click en "Salir de impersonación" o limpiar cookies

> Impersonación usa cookies seguras y solo está disponible para `role = SUPERADMIN`.

---

## 6. Flujo completo de pago (referencia rápida)

```
1. Cliente entra a /billing
2. Elige plan + meses → POST /api/billing/checkout
3. UI muestra: cuenta BCP 701-51726678-3-55 + referencia PAGO-XXXXX-timestamp
4. Cliente transfiere por BCP con la referencia en la "Glosa"
5. BCP envía email a sergio.urcullo.m@gmail.com
6. n8n WF-GS-05 detecta email (polling cada 1 min) → activa plan automáticamente
7. Si n8n falla: superadmin confirma manualmente en /superadmin/payments
```

**n8n WF-GS-05**: ID `jtLIb0i6jxAZOvwa` — activo. Verificar credenciales en:
https://n8n-sergio-n8n.hqdqgh.easypanel.host/workflow/jtLIb0i6jxAZOvwa

---

## 7. Checklist de verificación post-onboarding

Para confirmar que el cliente está operativo:

- [ ] Cuenta creada en `/signup`
- [ ] Setup completado (`/setup`) — org + perfil ADMIN creados
- [ ] Plan activado (trial o pago)
- [ ] Al menos 1 producto cargado en inventario
- [ ] Primera venta en POS realizada
- [ ] Staff invitado si aplica
- [ ] Add-ons activados si el plan lo permite y el cliente lo requiere

---

## 8. Restricciones del piloto

- Import/export: **solo CSV** (no XLSX)
- Integraciones externas activas solo con credenciales reales: SIAT, QR PSP y WhatsApp Business API
- Upstash Redis no configurado: rate limiting en memoria (suficiente para piloto, no para escala)
- E2E con creación de pedidos reales requiere `E2E_CREATE_ORDERS=true` — no correr en producción por defecto

Ver `docs/RELEASE_CANDIDATE.md` para lista completa de bloqueos para release público masivo.

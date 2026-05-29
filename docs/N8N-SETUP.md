# n8n Setup Guide for GestiOS

n8n is an open-source workflow automation platform used in GestiOS to bridge external services that lack native webhook support, and to run scheduled automations that complement the built-in Vercel cron jobs. Specifically, n8n handles two concerns: relaying Brevo email delivery events back to GestiOS (since Brevo's free plan does not send webhooks directly), and polling for overdue purchase orders every few hours to trigger internal alerts.

---

## Prerequisites

Before importing any workflow you need:

| Item | Description |
|---|---|
| n8n instance | Self-hosted or n8n Cloud. Minimum version: 1.x |
| n8n base URL | The public URL where your n8n instance is reachable, e.g. `https://n8n.yourserver.com` |
| Brevo API key | Found in Brevo → Settings → API Keys. Required for the polling workflow. |
| `BREVO_WEBHOOK_KEY` | A secret string you define. Set it in both Brevo (webhook signing) and in GestiOS env vars. |
| `GESTIOS_API_KEY` | A secret key used by n8n to authenticate calls to GestiOS API routes. Set in Vercel. |
| GestiOS base URL | Your production URL, e.g. `https://gestios.vercel.app` |

---

## How to Import a Workflow

For each of the three JSON files below, follow these steps in n8n:

1. Open your n8n instance and log in.
2. In the left sidebar go to **Settings → Workflows** (or click the **Workflows** menu item).
3. Click **+ New Workflow**, then open the menu (three dots or **Import** button).
4. Select **Import from File**.
5. Choose the corresponding `.json` file from the `n8n/` directory of this project.
6. Click **Save**.
7. Configure credentials as described in each section below.
8. Click **Activate** (toggle in the top-right) to enable the workflow.

---

## Workflow 1 — Brevo Email Tracking (Webhook)

**File:** `n8n/brevo-email-tracking.json`

**What it does:** Receives real-time email delivery events (delivered, bounced, spam) from Brevo via a webhook, deduplicates them using in-memory state, and forwards them to `POST /api/webhooks/brevo` in GestiOS so that `EmailLog` statuses are updated.

### Step-by-step

1. Import the file following the steps above.
2. After import, open the workflow. Locate the **Webhook Trigger** node.
3. Copy the **Webhook URL** shown in that node (it will look like `https://your-n8n.com/webhook/brevo-email-events`).
4. In Brevo: go to **Transactional → Settings → Webhook** and add a new webhook:
   - URL: the n8n webhook URL you copied
   - Events: check `delivered`, `bounced`, `blocked`, `spam`
5. In n8n, open the **Send to GestiOS API** node and set:
   - **URL env var `GESTIOS_URL`**: your GestiOS production URL (e.g. `https://gestios.vercel.app`)
   - **Header `Authorization`**: `Bearer <BREVO_WEBHOOK_KEY>` — set this via n8n **Credentials** or an environment variable named `BREVO_WEBHOOK_KEY`
6. Activate the workflow.

### Credentials to configure inside n8n

| Variable | Value |
|---|---|
| `GESTIOS_URL` | GestiOS production URL |
| `BREVO_WEBHOOK_KEY` | Same secret used in `BREVO_WEBHOOK_KEY` env var in Vercel |

### How to activate

Toggle the **Active** switch in the top-right corner of the workflow editor to **ON**.

---

## Workflow 2 — Brevo Email Tracking (Polling)

**File:** `n8n/brevo-email-tracking-polling.json`

**What it does:** Runs every 5 minutes, polls the Brevo statistics API for recent email events, filters out already-processed events, and sends new ones to `POST /api/webhooks/brevo` in GestiOS. Use this workflow **instead of** Workflow 1 if Brevo webhooks are not available on your plan.

### Step-by-step

1. Import the file.
2. Open the **Fetch Brevo Events** node. This node uses `genericCredentialType: httpHeaderAuth`.
3. In n8n, create a new **HTTP Header Auth** credential:
   - Header name: `api-key`
   - Header value: your Brevo API key
4. Assign that credential to the **Fetch Brevo Events** node.
5. Open the **Send to GestiOS** node and configure:
   - `GESTIOS_URL`: GestiOS production URL
   - `BREVO_WEBHOOK_KEY`: the shared secret key
6. The schedule is set to every 5 minutes — adjust in the **Schedule Trigger** node if needed.
7. Activate the workflow.

### Credentials to configure inside n8n

| Variable | Value |
|---|---|
| HTTP Header Auth credential | Brevo API key (`api-key: <YOUR_BREVO_API_KEY>`) |
| `GESTIOS_URL` | GestiOS production URL |
| `BREVO_WEBHOOK_KEY` | Same secret used in `BREVO_WEBHOOK_KEY` env var in Vercel |

### How to activate

Toggle the **Active** switch to **ON**. The first run will occur within 5 minutes.

> **Note:** Use either Workflow 1 (webhook) or Workflow 2 (polling), not both simultaneously. If Brevo supports webhooks on your plan, prefer Workflow 1 for lower latency.

---

## Workflow 3 — Purchase Order Automation

**File:** `n8n/purchase-order-automation.json`

**What it does:** Runs every 6 hours, fetches purchase orders with status `ENVIADO` from GestiOS, identifies orders whose `expectedDate` has passed, formats a summary notification, and sends it to `POST /api/notifications/purchase-order-overdue` so that admins are alerted about overdue supplier orders.

### Step-by-step

1. Import the file.
2. Open the **Fetch Pending POs** node and configure:
   - `GESTIOS_URL`: GestiOS production URL
   - `GESTIOS_API_KEY`: the API key for n8n to authenticate with GestiOS
3. Open the **Send Alert to GestiOS** node and verify the same credentials are set.
4. The schedule runs every 6 hours — adjust in the **Schedule Trigger** node if needed.
5. Activate the workflow.

### Credentials to configure inside n8n

| Variable | Value |
|---|---|
| `GESTIOS_URL` | GestiOS production URL |
| `GESTIOS_API_KEY` | API key for GestiOS (set as `GESTIOS_API_KEY` in Vercel env vars) |

### How to activate

Toggle the **Active** switch to **ON**. The first run will occur at the next 6-hour interval.

---

---

## GestiOS Automation Workflows (WF-GS-02, WF-GS-03, WF-GS-04)

Estos 3 workflows son específicos de GestiOS y ya están creados y activos en n8n. No requieren importar JSON — se crearon via n8n MCP con credenciales hardcodeadas.

### Instancia n8n
`https://n8n-sergio-n8n.hqdqgh.easypanel.host`

### WF-GS-02 — Plan Expiry WA
| Campo | Valor |
|---|---|
| ID | `xx4wzzzqZBGfu836` |
| Trigger | Cron `0 12 * * *` (diario 12pm) |
| Función | Orgs con plan venciendo en ≤7 días → WA reminder |
| Sender WA | Credenciales del tenant (desde `org_addons`) |
| Estado | 🟢 Activo |

### WF-GS-03 — Birthday WA
| Campo | Valor |
|---|---|
| ID | `qOVpQwPZplQKYkMc` |
| Trigger | Cron `0 13 * * *` (diario 1pm) |
| Función | Clientes con cumpleaños hoy → WA saludo |
| Filtro | Code node filtra por mes+día (Supabase REST no soporta EXTRACT) |
| Sender WA | Credenciales del tenant (desde `org_addons`) |
| Estado | 🟢 Activo |

### WF-GS-04 — Weekly Admin Digest
| Campo | Valor |
|---|---|
| ID | `6oowIHo8G9baBOYc` |
| Trigger | Cron `0 9 * * 1` (lunes 9am) |
| Función | Stats cross-tenant → email digest a admin |
| Destinatario | `business@onia.com.bo` |
| Remitente | `noreply@onia.com.bo` via Resend |
| Estado | 🟢 Activo |

### Nota sobre credenciales
n8n VPS (self-hosted) no soporta `$vars` (feature de n8n Cloud). Las credenciales están hardcodeadas directamente en los nodos HTTP Request. Si rota la `SUPABASE_SERVICE_ROLE_KEY` o `RESEND_API_KEY`, actualizar los 3 workflows via n8n MCP o UI.

---

### WF-GS-05 — BCP Auto Payment Confirmation
| Campo | Valor |
|---|---|
| ID | `jtLIb0i6jxAZOvwa` |
| Trigger | Gmail OAuth2 polling cada 1 minuto |
| Gmail | `sergio.urcullo.m@gmail.com` |
| Remitente BCP | `BolBancaMov@bcp.com.bo` |
| Función | Detecta pago BCP → activa plan workspace automáticamente |
| Credencial Gmail | `Gmail sergio.urcullo` (OAuth2) |
| Credencial Supabase | `Supabase GestiOS` (supabaseApi) |
| Estado | 🟡 Configurado — activar tras asignar credenciales |
| Setup detallado | Ver `docs/N8N-WF-GS-05-SETUP.md` |
| Flujo completo | Ver `docs/BILLING-FLOW.md` |

---

## Environment Variables in GestiOS (Vercel)

Add the following to your Vercel project environment variables:

| Variable | Description |
|---|---|
| `BREVO_WEBHOOK_KEY` | Secret used to verify requests from n8n to `/api/webhooks/brevo`. Must match the value configured in n8n. |
| `GESTIOS_API_KEY` | Secret used by the Purchase Order workflow to authenticate requests from n8n to GestiOS API routes. |

To add them: Vercel Dashboard → Your Project → Settings → Environment Variables → Add.

Redeploy after adding new variables.

---

## Testing Each Workflow

### Workflow 1 — Brevo Webhook

1. In n8n, open the workflow and click **Test Workflow** (without activating).
2. Send a test POST to the webhook URL using curl or Postman:
   ```bash
   curl -X POST https://your-n8n.com/webhook/brevo-email-events \
     -H "Content-Type: application/json" \
     -d '{"body": {"event": "delivered", "email": "test@example.com", "messageId": "test-123", "date": "2026-01-01T00:00:00Z"}}'
   ```
3. Check the n8n execution log — all 4 nodes should show green.
4. In GestiOS Supabase DB, verify the `EmailLog` record for that `brevoMessageId` has `status = DELIVERED`.

### Workflow 2 — Brevo Polling

1. Click **Test Workflow** in n8n.
2. The workflow will call Brevo's API and process any events from the last 24 hours.
3. Check the **Filter New Events** node output — it should show the events being processed.
4. Verify the **Send to GestiOS** node returns a 2xx response.

### Workflow 3 — Purchase Order Automation

1. Create a test purchase order in GestiOS with status `ENVIADO` and set `expectedDate` to yesterday.
2. Click **Test Workflow** in n8n.
3. The **Check Overdue POs** node should output that order with `daysOverdue: 1`.
4. The **Send Alert to GestiOS** node should return a 2xx response.
5. Check GestiOS admin notifications or logs to confirm the alert was received.

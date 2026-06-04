# WF-GS-05: BCP Auto Payment Confirmation — Setup Guide

**Workflow URL**: https://n8n-sergio-n8n.hqdqgh.easypanel.host/workflow/jtLIb0i6jxAZOvwa

## Overview

Polls `sergio.urcullo.m@gmail.com` every minute for BCP payment confirmation emails.
When found, extracts the `PAGO-XXXXX-timestamp` reference, looks up the pending
payment in Supabase, marks it CONFIRMADO, and activates the organization's plan.

## Flow

```
Gmail Trigger (every 1 min, from BolBancaMov@bcp.com.bo)
  → Extract Reference from Email   (regex PAGO-[A-Z0-9]+-\d+)
  → Reference Found?
      YES → Lookup Payment in Supabase  (GET payment_requests WHERE reference=X AND status=PENDIENTE)
              → Payment Record Exists?
                  YES → Mark Payment CONFIRMADO  (PATCH payment_requests)
                          → Compute Plan Expiry  (adds months to today)
                          → Activate Org Plan    (PATCH organizations)
                  NO  → Skip (no matching payment)
      NO  → Skip (reference not in email)
```

## Step 1 — Configure Gmail Credential

1. Go to n8n → Credentials → New
2. Type: **Gmail OAuth2**
3. Name: `Gmail sergio.urcullo`
4. Authenticate with `sergio.urcullo.m@gmail.com`
5. Grant access to read emails
6. Save

> The workflow already has "Gmail account" auto-assigned. You may need to
> reconnect it to `sergio.urcullo.m@gmail.com` if the auto-assigned credential
> belongs to a different account.

## Step 2 — Configure Supabase Credential

1. Go to n8n → Credentials → New
2. Type: **Supabase**
3. Name: `Supabase GestiOS`
4. Host: `https://<SUPABASE_PROJECT_REF>.supabase.co`
5. Service Role Key: `<SUPABASE_SERVICE_ROLE_KEY>`
6. Save

Then assign this credential to these 3 HTTP Request nodes in the workflow:
- **Lookup Payment in Supabase**
- **Mark Payment CONFIRMADO**
- **Activate Org Plan in Supabase**

## Step 3 — Activate Workflow

1. Open workflow: https://n8n-sergio-n8n.hqdqgh.easypanel.host/workflow/jtLIb0i6jxAZOvwa
2. Verify all nodes show green credential badges
3. Click **Activate** (top-right toggle)

## Step 4 — Test

Send yourself a test email from any account with:
- Subject containing `Interbancaria QR`
- Body/snippet containing a reference like `PAGO-XXXXXXXX-1234567890`

Verify the workflow execution appears in n8n executions log.

For a real end-to-end test:
1. Create a payment request from the billing UI (as a workspace admin)
2. Get the reference code shown in the bank transfer modal
3. Wait for a real BCP transfer, or manually trigger the workflow with test data

## BCP Email Format Reference

```
From: BolBancaMov@bcp.com.bo
Subject: Interbancaria QR - Banca Móvil

Estimado cliente, se realizó la siguiente operación:
...
Glosa: PAGO-A1B2C3D4-1716900000000
Monto: Bs. 150.00
...
```

The regex `PAGO-[A-Z0-9]+-\d+` extracts the reference from anywhere in the body or snippet.

## Database Tables Used

| Table | Operation | Condition |
|-------|-----------|-----------|
| `payment_requests` | SELECT | reference=X AND status=PENDIENTE |
| `payment_requests` | PATCH | SET status=CONFIRMADO, confirmedAt=now(), confirmedBy=n8n-auto |
| `organizations` | PATCH | SET plan=X, planExpiresAt=Y |

## Troubleshooting

**Workflow not triggering**: Check Gmail credential is connected to `sergio.urcullo.m@gmail.com`.
The filter matches emails with `readStatus: unread` — BCP emails must be unread to trigger.

**Payment not found**: Verify the workspace admin completed the checkout flow and a
`payment_requests` record with status=PENDIENTE exists in Supabase.

**Supabase 401**: Regenerate the service role key in Supabase → Settings → API and
update the `Supabase GestiOS` credential.

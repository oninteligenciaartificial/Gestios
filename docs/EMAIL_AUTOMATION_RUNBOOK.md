# Email and Notification Automation Runbook

## Scope

This runbook covers the current production flow for business emails and in-app notifications.

Provider:
- Business emails: Resend API through `RESEND_API_KEY`.
- Supabase Auth emails: Resend SMTP configured in Supabase.

No database migration is required for this flow.

## What fires automatically

| Event | Email | In-app notification |
|---|---|---|
| New order | Customer confirmation if the customer has email. Admin alert to org admins. | `nuevo_pedido` linked to `/ventas/{id}` |
| Order status changed | Customer status update if the customer has email. | `pedido_actualizado` linked to `/ventas/{id}` |
| Order delivered | Loyalty points email if the customer has email. | Covered by order status notification |
| Manual stock alert | Low stock email to the signed-in user. | `stock_bajo` linked to `/inventory` |

## Required external configuration

1. Vercel must have `RESEND_API_KEY`.
2. Vercel should have `EMAIL_FROM_ADDRESS` and `EMAIL_FROM_NAME`.
3. The sender domain must be verified in Resend.
4. Cron routes only run automatically if the scheduler that calls them is configured outside the repo.

Do not print or commit these values.

## Smoke test

1. Log in as an org admin.
2. Create or edit a customer with a real test email.
3. Create an order for that customer.
4. Confirm the customer inbox receives `order_confirmation`.
5. Confirm the admin inbox receives `new_order_alert`.
6. Open the dashboard bell and confirm a `nuevo_pedido` notification appears.
7. Change the order status.
8. Confirm the customer inbox receives `order_status_update`.
9. Confirm the dashboard bell shows `pedido_actualizado`.
10. Trigger the stock alert button when products are below minimum stock.
11. Confirm the signed-in user receives `low_stock_alert`.
12. Confirm the dashboard bell shows `stock_bajo`.

## Troubleshooting

- If no email is received, check `/email-stats` as SUPERADMIN and filter recent `FAILED` records.
- `RESEND_API_KEY not configured` means the runtime has no Resend key.
- `Daily email limit reached` means the local guardrail blocked the send for the day.
- If the email log is `SENT` but inbox is empty, check spam, Resend delivery activity, and sender domain status.
- If the bell is empty, call `GET /api/notifications?limit=10` while authenticated and confirm rows exist for the same `organizationId`.

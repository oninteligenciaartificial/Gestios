# Security Policy

## Reporting a Vulnerability

Report security issues privately to **oninteligenciaartificial@gmail.com**. Do not open public GitHub issues for vulnerabilities.

Expect an acknowledgement within 72 hours. Please include:
- Affected endpoint or component
- Steps to reproduce
- Impact assessment

## Supported Versions

Only the latest `main` (deployed to production) receives security fixes.

## Security Model

GestiOS is a multi-tenant SaaS. Core invariants:

- **Tenant isolation**: every database query MUST filter by `organizationId`. Cross-tenant data access is a critical vulnerability.
- **Authentication**: Supabase Auth via `getTenantProfile()` (`lib/auth.ts`). All API routes verify a valid profile before any data access.
- **Authorization**: role checks (`ADMIN`, `MANAGER`, etc.) enforced per route for privileged operations.
- **Cron protection**: cron endpoints require `CRON_SECRET` bearer token, validated with timing-safe comparison (`lib/cron-auth.ts`).
- **Rate limiting**: applied on public endpoints (e.g. tienda checkout, cron).
- **Input validation**: all request bodies validated with Zod at the boundary.

## Handling Secrets

- Secrets live in environment variables (`.env`, Vercel env). Never hardcoded.
- Required: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, DB credentials.
- Service-role key is server-only. Never expose to client.

## Pre-commit Security Checklist

- [ ] No hardcoded secrets/tokens/keys
- [ ] All queries scoped by `organizationId`
- [ ] User input validated (Zod)
- [ ] Auth + role checks present on new routes
- [ ] No PII leaked in public responses or logs
- [ ] Run `security-review` skill for auth/payment/sensitive-data changes

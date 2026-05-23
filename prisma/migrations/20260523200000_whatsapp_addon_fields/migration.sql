-- Migration: WhatsApp add-on fields for multi-tenant support
-- Apply in Supabase SQL Editor before deploying

-- OrgAddon: per-tenant WhatsApp credentials + Chatwoot
ALTER TABLE "org_addons"
  ADD COLUMN IF NOT EXISTS "accessToken"     TEXT,
  ADD COLUMN IF NOT EXISTS "templateName"    TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingAt"    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "chatwootInboxId" INTEGER;

-- Organization: whatsapp addon flag
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "whatsappAddon" BOOLEAN NOT NULL DEFAULT FALSE;

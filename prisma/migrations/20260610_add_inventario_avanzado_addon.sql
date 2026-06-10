-- Add INVENTARIO_AVANZADO to AddonType enum and inventarioAvanzadoAddon field to Organization
ALTER TYPE "AddonType" ADD VALUE IF NOT EXISTS 'INVENTARIO_AVANZADO';

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "inventarioAvanzadoAddon" BOOLEAN NOT NULL DEFAULT false;

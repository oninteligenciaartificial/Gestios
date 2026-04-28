-- Add businessType to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "businessType" TEXT NOT NULL DEFAULT 'GENERAL';

-- Add hasVariants and attributeSchema to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hasVariants" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "attributeSchema" JSONB;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- Add indexes to product_variants
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_organizationId_sku_key" ON "product_variants"("organizationId", "sku") WHERE "sku" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "product_variants_productId_active_idx" ON "product_variants"("productId", "active");
CREATE INDEX IF NOT EXISTS "product_variants_organizationId_idx" ON "product_variants"("organizationId");

-- Add FK from product_variants to products
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add variantId and variantSnapshot to order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantSnapshot" JSONB;

-- Add index on order_items.variantId
CREATE INDEX IF NOT EXISTS "order_items_variantId_idx" ON "order_items"("variantId");

-- Add FK from order_items to product_variants
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

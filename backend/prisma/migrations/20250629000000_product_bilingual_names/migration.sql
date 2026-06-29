-- Add bilingual product names (Arabic / English, either optional but at least one required in app layer)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "nameAr" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "nameEn" TEXT;

UPDATE "Product"
SET "nameAr" = "name"
WHERE "nameAr" IS NULL AND "name" IS NOT NULL AND TRIM("name") <> '';

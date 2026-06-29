-- Bilingual product descriptions (Arabic / English — either optional)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;

UPDATE "Product"
SET "descriptionAr" = "description"
WHERE "descriptionAr" IS NULL
  AND "description" IS NOT NULL
  AND TRIM("description") <> '';

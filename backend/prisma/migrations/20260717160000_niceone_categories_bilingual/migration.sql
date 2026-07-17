-- Bilingual category names + allow products without classification
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameAr" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameEn" TEXT;

-- Backfill from existing name
UPDATE "Category" SET "nameAr" = "name" WHERE "nameAr" IS NULL;

-- Products may be uncategorized (user will reclassify later)
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL;
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_subcategoryId_fkey";
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_tertiaryCategoryId_fkey";
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_tertiaryCategoryId_fkey"
  FOREIGN KEY ("tertiaryCategoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

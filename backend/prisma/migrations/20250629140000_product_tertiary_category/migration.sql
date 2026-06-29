-- Three-level category hierarchy: tertiary sections on products
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tertiaryCategoryId" TEXT;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_tertiaryCategoryId_fkey"
  FOREIGN KEY ("tertiaryCategoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Product_tertiaryCategoryId_idx" ON "Product"("tertiaryCategoryId");

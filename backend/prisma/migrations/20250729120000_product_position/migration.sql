-- ترتيب المنتجات ضمن البراند (الافتراضي: تاريخ الإضافة)
ALTER TABLE "Product" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Product_brandId_position_idx" ON "Product"("brandId", "position");

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "brandId"
      ORDER BY "createdAt" ASC, id ASC
    ) - 1 AS pos
  FROM "Product"
)
UPDATE "Product" AS p
SET "position" = ranked.pos
FROM ranked
WHERE p.id = ranked.id;

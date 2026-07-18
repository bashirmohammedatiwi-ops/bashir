-- Many-to-many: product can belong to multiple subcategories and tertiary sections
CREATE TABLE IF NOT EXISTS "_ProductSubcategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProductSubcategories_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_ProductSubcategories_B_index" ON "_ProductSubcategories"("B");

ALTER TABLE "_ProductSubcategories"
  DROP CONSTRAINT IF EXISTS "_ProductSubcategories_A_fkey";
ALTER TABLE "_ProductSubcategories"
  ADD CONSTRAINT "_ProductSubcategories_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ProductSubcategories"
  DROP CONSTRAINT IF EXISTS "_ProductSubcategories_B_fkey";
ALTER TABLE "_ProductSubcategories"
  ADD CONSTRAINT "_ProductSubcategories_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "_ProductTertiaryCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProductTertiaryCategories_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_ProductTertiaryCategories_B_index" ON "_ProductTertiaryCategories"("B");

ALTER TABLE "_ProductTertiaryCategories"
  DROP CONSTRAINT IF EXISTS "_ProductTertiaryCategories_A_fkey";
ALTER TABLE "_ProductTertiaryCategories"
  ADD CONSTRAINT "_ProductTertiaryCategories_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ProductTertiaryCategories"
  DROP CONSTRAINT IF EXISTS "_ProductTertiaryCategories_B_fkey";
ALTER TABLE "_ProductTertiaryCategories"
  ADD CONSTRAINT "_ProductTertiaryCategories_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from existing single-value columns
INSERT INTO "_ProductSubcategories" ("A", "B")
SELECT "subcategoryId", "id" FROM "Product"
WHERE "subcategoryId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "_ProductTertiaryCategories" ("A", "B")
SELECT "tertiaryCategoryId", "id" FROM "Product"
WHERE "tertiaryCategoryId" IS NOT NULL
ON CONFLICT DO NOTHING;

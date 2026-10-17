-- دليل البشرة: محتوى الدليل والعوالم
ALTER TABLE "SkinConcern" ADD COLUMN "subtitle" TEXT;
ALTER TABLE "SkinConcern" ADD COLUMN "color" TEXT;
ALTER TABLE "SkinConcern" ADD COLUMN "worldSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SkinConcern" ADD COLUMN "causes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SkinConcern" ADD COLUMN "tips" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SkinConcern" ADD COLUMN "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SkinConcern" ADD COLUMN "avoid" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SkinConcern" ADD COLUMN "skinTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- الباقات والروتينات
ALTER TABLE "Package" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Package" ADD COLUMN "worldSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Package" ADD COLUMN "concernSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Package" ADD COLUMN "skinTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Package" ADD COLUMN "endsAt" TIMESTAMP(3);

ALTER TABLE "PackageItem" ADD COLUMN "stepTitle" TEXT;
ALTER TABLE "PackageItem" ADD COLUMN "note" TEXT;
ALTER TABLE "PackageItem" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- توفير الباقات في الطلب
ALTER TABLE "Order" ADD COLUMN "packageDiscount" INTEGER NOT NULL DEFAULT 0;

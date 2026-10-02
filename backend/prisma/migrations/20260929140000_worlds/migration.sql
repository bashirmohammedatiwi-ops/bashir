-- عوالم التطبيق: هوية مستقلة وربط الأقسام والبنرات ومنشورات الرئيسية
CREATE TABLE "World" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "nameEn" TEXT,
  "taglineAr" TEXT,
  "taglineEn" TEXT,
  "accentColor" TEXT NOT NULL,
  "canvasColor" TEXT NOT NULL,
  "inkColor" TEXT NOT NULL,
  "surfaceColor" TEXT NOT NULL DEFAULT '#FFFFFF',
  "position" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "coverImageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "World_slug_key" ON "World"("slug");
CREATE INDEX "World_isActive_idx" ON "World"("isActive");
CREATE INDEX "World_position_idx" ON "World"("position");

ALTER TABLE "World" ADD CONSTRAINT "World_coverImageId_fkey"
  FOREIGN KEY ("coverImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorldCategory" (
  "worldId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "WorldCategory_pkey" PRIMARY KEY ("worldId", "categoryId")
);

CREATE INDEX "WorldCategory_categoryId_idx" ON "WorldCategory"("categoryId");

ALTER TABLE "WorldCategory" ADD CONSTRAINT "WorldCategory_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorldCategory" ADD CONSTRAINT "WorldCategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Banner" ADD COLUMN "worldId" TEXT;
CREATE INDEX "Banner_worldId_idx" ON "Banner"("worldId");
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HomeBlock" ADD COLUMN "worldId" TEXT;
CREATE INDEX "HomeBlock_worldId_idx" ON "HomeBlock"("worldId");
ALTER TABLE "HomeBlock" ADD CONSTRAINT "HomeBlock_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;

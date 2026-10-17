-- تطبيق المدير: إيقاف/تشغيل تدرج + مجموعات الباركودات المحفوظة.
-- IF NOT EXISTS في كل خطوة: الترحيل لا يفشل أبداً عند إعادة التشغيل.

ALTER TABLE "ProductShade" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "BarcodeDraftGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'violet',
    "note" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BarcodeDraftGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BarcodeDraft" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT,
    "note" TEXT,
    "imageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER,
    "productId" TEXT,
    "shadeId" TEXT,
    "addedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BarcodeDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BarcodeDraftGroup_position_idx" ON "BarcodeDraftGroup"("position");
CREATE UNIQUE INDEX IF NOT EXISTS "BarcodeDraft_groupId_barcode_key" ON "BarcodeDraft"("groupId", "barcode");
CREATE INDEX IF NOT EXISTS "BarcodeDraft_barcode_idx" ON "BarcodeDraft"("barcode");
CREATE INDEX IF NOT EXISTS "BarcodeDraft_groupId_addedAt_idx" ON "BarcodeDraft"("groupId", "addedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BarcodeDraft_groupId_fkey') THEN
    ALTER TABLE "BarcodeDraft" ADD CONSTRAINT "BarcodeDraft_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "BarcodeDraftGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

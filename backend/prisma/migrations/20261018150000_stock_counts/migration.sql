-- جرد المخزون من تطبيق المدير. IF NOT EXISTS في كل خطوة: آمن عند إعادة التشغيل.

CREATE TABLE IF NOT EXISTS "StockCount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockCount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockCountLine" (
    "id" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productId" TEXT,
    "shadeId" TEXT,
    "name" TEXT,
    "counted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockCountLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockCount_status_createdAt_idx" ON "StockCount"("status", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "StockCountLine_countId_barcode_key" ON "StockCountLine"("countId", "barcode");
CREATE INDEX IF NOT EXISTS "StockCountLine_countId_idx" ON "StockCountLine"("countId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockCountLine_countId_fkey') THEN
    ALTER TABLE "StockCountLine" ADD CONSTRAINT "StockCountLine_countId_fkey"
      FOREIGN KEY ("countId") REFERENCES "StockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

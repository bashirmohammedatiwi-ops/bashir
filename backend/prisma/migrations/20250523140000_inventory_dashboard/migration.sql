-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESTOCK';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOW_STOCK';

-- CreateTable
CREATE TABLE "PosSyncRun" (
    "id" TEXT NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "changedItems" INTEGER NOT NULL DEFAULT 0,
    "syncedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "skippedItems" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sourceHost" TEXT,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosSyncRun_createdAt_idx" ON "PosSyncRun"("createdAt");

-- CreateIndex
CREATE INDEX "PosSyncRun_ok_idx" ON "PosSyncRun"("ok");

-- CreateIndex
CREATE INDEX "InventorySyncSnapshot_stock_idx" ON "InventorySyncSnapshot"("stock");

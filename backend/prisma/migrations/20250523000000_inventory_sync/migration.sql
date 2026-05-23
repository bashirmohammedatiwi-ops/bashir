-- AlterTable
ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");

-- CreateTable
CREATE TABLE "InventorySyncSnapshot" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productCode" TEXT,
    "productNum" TEXT,
    "name" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "offerName" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySyncSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventorySyncSnapshot_barcode_key" ON "InventorySyncSnapshot"("barcode");

-- CreateIndex
CREATE INDEX "InventorySyncSnapshot_syncedAt_idx" ON "InventorySyncSnapshot"("syncedAt");

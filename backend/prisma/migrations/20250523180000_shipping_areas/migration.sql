-- CreateTable
CREATE TABLE "ShippingArea" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fee" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingArea_pkey" PRIMARY KEY ("id")
);

-- DropColumn
ALTER TABLE "ShippingZone" DROP COLUMN "expressFee";

-- CreateIndex
CREATE INDEX "ShippingArea_zoneId_idx" ON "ShippingArea"("zoneId");

-- CreateIndex
CREATE INDEX "ShippingArea_isActive_idx" ON "ShippingArea"("isActive");

-- CreateIndex
CREATE INDEX "ShippingArea_position_idx" ON "ShippingArea"("position");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingArea_zoneId_name_key" ON "ShippingArea"("zoneId", "name");

-- AddForeignKey
ALTER TABLE "ShippingArea" ADD CONSTRAINT "ShippingArea_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

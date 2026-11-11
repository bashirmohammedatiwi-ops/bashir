-- طلبات التطبيق: مراحل التجهيز، المطلوب مقابل المُجهَّز، سجل المسح، تعديلات المبلغ، شحنات شركة التوصيل والخط الزمني.
-- إضافي فقط: لا يحذف ولا يغيّر أي عمود موجود.

-- CreateEnum
CREATE TYPE "FulfillmentStage" AS ENUM ('NEW', 'CONFIRMED', 'PICKING', 'PICKED', 'READY_FOR_PICKUP', 'INVOICED', 'HANDED_OVER', 'OUT_FOR_DELIVERY', 'DELIVERY_ISSUE', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNING', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickLineKind" AS ENUM ('ORDERED', 'EXTRA');

-- CreateEnum
CREATE TYPE "ExtraCharge" AS ENUM ('PAID', 'FREE');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('MATCHED', 'EXTRA', 'EXTRA_PROPOSED', 'OVER', 'UNKNOWN', 'REMOVED', 'MANUAL');

-- CreateEnum
CREATE TYPE "ShipmentState" AS ENUM ('PENDING', 'CREATING', 'CREATED', 'RETRYING', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('SHORTAGE', 'EXTRA', 'DISCOUNT_RECALC', 'ROUNDING', 'PARTIAL_DELIVERY', 'MANUAL');

-- CreateEnum
CREATE TYPE "AdjustmentMethod" AS ENUM ('NONE', 'COD_CHANGE', 'CARD_REFUND', 'LOYALTY_POINTS');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adjustmentTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "codAmount" INTEGER,
ADD COLUMN     "finalDiscountTotal" INTEGER,
ADD COLUMN     "finalSubtotal" INTEGER,
ADD COLUMN     "finalTotal" INTEGER,
ADD COLUMN     "fulfillmentStage" "FulfillmentStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "parcelCount" INTEGER,
ADD COLUMN     "pickApprovedById" TEXT,
ADD COLUMN     "pickStartedAt" TIMESTAMP(3),
ADD COLUMN     "pickedAt" TIMESTAMP(3),
ADD COLUMN     "pickerId" TEXT,
ADD COLUMN     "pickerName" TEXT,
ADD COLUMN     "posCashierName" TEXT,
ADD COLUMN     "posClientReceiptId" TEXT,
ADD COLUMN     "posInvoicedAt" TIMESTAMP(3),
ADD COLUMN     "posReceiptNumber" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "shadeName" TEXT;

-- CreateTable
CREATE TABLE "OrderPickLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "kind" "PickLineKind" NOT NULL,
    "productId" TEXT,
    "shadeId" TEXT,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "shadeName" TEXT,
    "orderedQty" INTEGER NOT NULL DEFAULT 0,
    "pickedQty" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "charge" "ExtraCharge" NOT NULL DEFAULT 'PAID',
    "reason" TEXT,
    "substituteForLineId" TEXT,
    "manualConfirm" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPickLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderScan" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineId" TEXT,
    "barcode" TEXT NOT NULL,
    "result" "ScanResult" NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "userName" TEXT,
    "device" TEXT,
    "clientScanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAdjustment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "AdjustmentMethod" NOT NULL DEFAULT 'NONE',
    "status" TEXT NOT NULL DEFAULT 'DONE',
    "note" TEXT,
    "data" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'HI_EXPRESS',
    "clientIdentifier" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "state" "ShipmentState" NOT NULL DEFAULT 'PENDING',
    "statusId" INTEGER,
    "statusName" TEXT,
    "statusAt" TIMESTAMP(3),
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "governanceId" INTEGER,
    "cityId" INTEGER,
    "codAmount" INTEGER NOT NULL DEFAULT 0,
    "shippingCost" INTEGER,
    "returnCost" INTEGER,
    "collectedAmount" INTEGER,
    "driverName" TEXT,
    "deliveryAttempts" INTEGER,
    "settlementId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "statusId" INTEGER,
    "statusAt" TIMESTAMP(3),
    "note" TEXT,
    "proofUrl" TEXT,
    "raw" JSONB,
    "dedupeKey" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierAreaMap" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'HI_EXPRESS',
    "governorate" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "governanceId" INTEGER NOT NULL,
    "cityId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierAreaMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderPickLine_orderId_idx" ON "OrderPickLine"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPickLine_orderId_orderItemId_key" ON "OrderPickLine"("orderId", "orderItemId");

-- CreateIndex
CREATE INDEX "OrderScan_orderId_createdAt_idx" ON "OrderScan"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderScan_orderId_clientScanId_key" ON "OrderScan"("orderId", "clientScanId");

-- CreateIndex
CREATE INDEX "OrderAdjustment_orderId_createdAt_idx" ON "OrderAdjustment"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderAdjustment_status_idx" ON "OrderAdjustment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_clientIdentifier_key" ON "Shipment"("clientIdentifier");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_state_nextAttemptAt_idx" ON "Shipment"("state", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "Shipment_isFinal_statusAt_idx" ON "Shipment"("isFinal", "statusAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentEvent_dedupeKey_key" ON "ShipmentEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_receivedAt_idx" ON "ShipmentEvent"("shipmentId", "receivedAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourierAreaMap_provider_governorate_area_key" ON "CourierAreaMap"("provider", "governorate", "area");

-- CreateIndex
CREATE INDEX "Order_fulfillmentStage_createdAt_idx" ON "Order"("fulfillmentStage", "createdAt");

-- CreateIndex
CREATE INDEX "Order_posInvoicedAt_idx" ON "Order"("posInvoicedAt");

-- AddForeignKey
ALTER TABLE "OrderPickLine" ADD CONSTRAINT "OrderPickLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPickLine" ADD CONSTRAINT "OrderPickLine_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderScan" ADD CONSTRAINT "OrderScan_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAdjustment" ADD CONSTRAINT "OrderAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- مرحلة الطلبات الموجودة من حالتها الحالية (مرة واحدة).
UPDATE "Order" SET "fulfillmentStage" = CASE "status"
  WHEN 'CONFIRMED' THEN 'CONFIRMED'::"FulfillmentStage"
  WHEN 'PROCESSING' THEN 'PICKING'::"FulfillmentStage"
  WHEN 'SHIPPED' THEN 'HANDED_OVER'::"FulfillmentStage"
  WHEN 'DELIVERED' THEN 'DELIVERED'::"FulfillmentStage"
  WHEN 'CANCELLED' THEN 'CANCELLED'::"FulfillmentStage"
  WHEN 'REFUNDED' THEN 'CANCELLED'::"FulfillmentStage"
  ELSE 'NEW'::"FulfillmentStage"
END
WHERE "status" <> 'PENDING';

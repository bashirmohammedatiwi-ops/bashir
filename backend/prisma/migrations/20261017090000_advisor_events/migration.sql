-- CreateTable
CREATE TABLE "AdvisorEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "type" TEXT NOT NULL,
    "sig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvisorEvent_createdAt_idx" ON "AdvisorEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AdvisorEvent_productId_type_idx" ON "AdvisorEvent"("productId", "type");

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'QI',
    "requestId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentType" TEXT,
    "maskedPan" TEXT,
    "paymentSystem" TEXT,
    "rrn" TEXT,
    "authId" TEXT,
    "resultCode" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOperation" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requestId" TEXT,
    "amount" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "actorId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_requestId_key" ON "PaymentTransaction"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_paymentId_key" ON "PaymentTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentOperation_transactionId_createdAt_idx" ON "PaymentOperation"("transactionId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOperation" ADD CONSTRAINT "PaymentOperation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;


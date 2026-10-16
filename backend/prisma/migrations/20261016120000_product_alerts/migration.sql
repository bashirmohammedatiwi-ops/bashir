-- CreateTable
CREATE TABLE "ProductAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "basePrice" INTEGER,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAlert_type_productId_idx" ON "ProductAlert"("type", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAlert_userId_productId_type_key" ON "ProductAlert"("userId", "productId", "type");

-- AddForeignKey
ALTER TABLE "ProductAlert" ADD CONSTRAINT "ProductAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlert" ADD CONSTRAINT "ProductAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


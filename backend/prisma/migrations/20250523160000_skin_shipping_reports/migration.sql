-- CreateEnum
CREATE TYPE "PackageKind" AS ENUM ('GENERAL', 'ROUTINE_MORNING', 'ROUTINE_EVENING', 'BRIDAL_KIT');

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "kind" "PackageKind" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE INDEX "Package_kind_idx" ON "Package"("kind");

-- CreateTable
CREATE TABLE "SkinConcern" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkinConcern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSkinConcern" (
    "productId" TEXT NOT NULL,
    "concernId" TEXT NOT NULL,

    CONSTRAINT "ProductSkinConcern_pkey" PRIMARY KEY ("productId","concernId")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "standardFee" INTEGER NOT NULL DEFAULT 5000,
    "expressFee" INTEGER NOT NULL DEFAULT 8000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkinConcern_slug_key" ON "SkinConcern"("slug");

-- CreateIndex
CREATE INDEX "SkinConcern_isActive_idx" ON "SkinConcern"("isActive");

-- CreateIndex
CREATE INDEX "SkinConcern_position_idx" ON "SkinConcern"("position");

-- CreateIndex
CREATE INDEX "ProductSkinConcern_concernId_idx" ON "ProductSkinConcern"("concernId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingZone_governorate_key" ON "ShippingZone"("governorate");

-- CreateIndex
CREATE INDEX "ShippingZone_isActive_idx" ON "ShippingZone"("isActive");

-- CreateIndex
CREATE INDEX "ShippingZone_position_idx" ON "ShippingZone"("position");

-- AddForeignKey
ALTER TABLE "ProductSkinConcern" ADD CONSTRAINT "ProductSkinConcern_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSkinConcern" ADD CONSTRAINT "ProductSkinConcern_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "SkinConcern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

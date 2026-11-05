-- عروض الخصم من لوحة التحكم (تبقى فوق أسعار الـ POS بين البداية والنهاية) — إضافة فقط.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "offerId" TEXT;
CREATE INDEX IF NOT EXISTS "Product_offerId_idx" ON "Product"("offerId");

CREATE TABLE IF NOT EXISTS "ProductOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "barcodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductOffer_isActive_startsAt_endsAt_idx" ON "ProductOffer"("isActive", "startsAt", "endsAt");

CREATE TABLE IF NOT EXISTS "ProductOfferItem" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "prevPrice" INTEGER NOT NULL,
    "prevOriginalPrice" INTEGER NOT NULL,
    "prevDiscountPercent" INTEGER NOT NULL,
    "prevIsPromo" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductOfferItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductOfferItem_offerId_productId_key" ON "ProductOfferItem"("offerId", "productId");
CREATE INDEX IF NOT EXISTS "ProductOfferItem_productId_idx" ON "ProductOfferItem"("productId");
ALTER TABLE "ProductOfferItem" ADD CONSTRAINT "ProductOfferItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductOfferItem" ADD CONSTRAINT "ProductOfferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

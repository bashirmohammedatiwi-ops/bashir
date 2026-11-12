-- خصم يدوي من كاشير الطلبات (بالدينار) وسببه. إضافي فقط.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cashierDiscount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cashierDiscountNote" TEXT;

-- رسوم تغليف الهدية على الطلب (إضافة فقط بقيمة افتراضية 0 — الطلبات السابقة لا تتغير).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "giftWrapFee" INTEGER NOT NULL DEFAULT 0;

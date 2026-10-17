-- مدة التوصيل لكل محافظة
ALTER TABLE "ShippingZone" ADD COLUMN "deliveryDaysMin" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ShippingZone" ADD COLUMN "deliveryDaysMax" INTEGER NOT NULL DEFAULT 3;
-- بداية معقولة: بغداد أسرع، والبقية 2–4 أيام (تُعدّل من لوحة التحكم).
UPDATE "ShippingZone" SET "deliveryDaysMin" = 1, "deliveryDaysMax" = 2 WHERE "governorate" LIKE '%بغداد%';
UPDATE "ShippingZone" SET "deliveryDaysMin" = 2, "deliveryDaysMax" = 4 WHERE "governorate" NOT LIKE '%بغداد%';

-- طلب هدية
ALTER TABLE "Order" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "giftMessage" TEXT;
ALTER TABLE "Order" ADD COLUMN "giftHidePrices" BOOLEAN NOT NULL DEFAULT false;

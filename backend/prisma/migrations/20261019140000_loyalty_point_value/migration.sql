-- خصم النقاط بالدينار لكل طلب — الطلبات القديمة كانت بقاعدة 100 نقطة = 1,000 د.ع.
ALTER TABLE "Order" ADD COLUMN "loyaltyDiscount" INTEGER NOT NULL DEFAULT 0;
UPDATE "Order" SET "loyaltyDiscount" = ("loyaltySpent" / 100) * 1000 WHERE "loyaltySpent" > 0;

-- مكافأة أول طلب بالقاعدة الجديدة: 50 نقطة (= 500 د.ع سابقاً) ← 500 نقطة (= 500 د.ع).
UPDATE "Setting"
SET "value" = jsonb_set("value"::jsonb, '{firstOrderBonusPoints}', '500'::jsonb)
WHERE "key" = 'store' AND ("value"::jsonb ->> 'firstOrderBonusPoints') = '50';

-- خيارات شركة التوصيل لكل طلب (كاشير الطلبات): نوع الشحنة، ملاحظة للمندوب، هاتف ثانٍ. إضافي فقط.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courierTypeId" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courierNote" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courierPhone2" TEXT;

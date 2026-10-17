-- نطاق الجرد (براند أو قسم) لإظهار ما لم يُمسح. إضافة فقط، آمنة عند إعادة التشغيل.
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

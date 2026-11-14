-- «عدد محلي» للمنتج: المخزون (وتدرجاته) يُدخل من لوحة التحكم ولا تغيّره مزامنة الكاشير. إضافي فقط.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "manualStock" BOOLEAN NOT NULL DEFAULT false;

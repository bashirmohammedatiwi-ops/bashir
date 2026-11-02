-- رفوف واجهة العالم الشخصية (إخفاء/موضع) — إضافة فقط، فارغ = السلوك الحالي.
ALTER TABLE "World" ADD COLUMN IF NOT EXISTS "homeShelves" JSONB;

-- تحسين البحث: إضافة pg_trgm لتحمّل أخطاء الكتابة وفهارس GIN للمطابقة السريعة.
-- تمت كتابتها بشكل آمن: إن كانت الإضافة أو الفهارس موجودة مسبقاً لا يفشل التنفيذ.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- فهارس trigram على حقول البحث الرئيسية — تُسرّع similarity() و LIKE '%..%'.
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_nameAr_trgm_idx" ON "Product" USING gin ("nameAr" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_nameEn_trgm_idx" ON "Product" USING gin ("nameEn" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Brand_name_trgm_idx" ON "Brand" USING gin (name gin_trgm_ops);

-- سلامة الطلب والمبلغ: مفتاح منع التكرار، لقطة عنوان التوصيل، وخصم مخزون التدرج.
-- إضافة فقط (أعمدة تقبل الفراغ وفهارس وجدول جديد) — لا يُحذف أو يُعدَّل أي سجل، و IF NOT EXISTS آمن عند إعادة التشغيل.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "clientRef" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipFullName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipGovernorate" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipArea" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipStreet" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipHouse" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipNotes" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shadeStockHeld" BOOLEAN;

-- العمود جديد وكل قيمه فارغة (NULL لا يتعارض في الفهرس الفريد) — لا تعارض مع الطلبات الحالية.
CREATE UNIQUE INDEX IF NOT EXISTS "Order_userId_clientRef_key" ON "Order"("userId", "clientRef");

-- تقييم واحد لكل زبونة ومنتج يُفرض في الكود؛ هذا الفهرس يسرّع البحث عن تقييمها فقط.
CREATE INDEX IF NOT EXISTS "Review_userId_productId_idx" ON "Review"("userId", "productId");

-- إحصاء عبارات البحث (بلا هوية الزبونة).
CREATE TABLE IF NOT EXISTS "SearchQueryStat" (
    "id" TEXT NOT NULL,
    "q" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "zeroCount" INTEGER NOT NULL DEFAULT 0,
    "lastTotal" INTEGER NOT NULL DEFAULT 0,
    "lastAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchQueryStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SearchQueryStat_q_lang_key" ON "SearchQueryStat"("q", "lang");

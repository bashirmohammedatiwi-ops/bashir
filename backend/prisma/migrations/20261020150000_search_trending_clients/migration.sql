-- «الأكثر بحثاً» يُعدّ الباحثات المختلفات لا الطلبات: عبارة يكررها جهاز واحد لا تُنشر.
-- إضافة فقط (عمود بقيمة افتراضية وجدول جديد) — لا يُحذف أو يُعدَّل أي سجل، و IF NOT EXISTS آمن عند إعادة التشغيل.

ALTER TABLE "SearchQueryStat" ADD COLUMN IF NOT EXISTS "clients" INTEGER NOT NULL DEFAULT 0;

-- بصمة مملّحة ومقتطعة للباحثة (لا عنوان ولا حساب) لكل عبارة — تكفي لعدّها مرة واحدة فقط.
CREATE TABLE IF NOT EXISTS "SearchQueryClient" (
    "id" TEXT NOT NULL,
    "q" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryClient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SearchQueryClient_q_lang_client_key" ON "SearchQueryClient"("q", "lang", "client");
CREATE INDEX IF NOT EXISTS "SearchQueryClient_createdAt_idx" ON "SearchQueryClient"("createdAt");

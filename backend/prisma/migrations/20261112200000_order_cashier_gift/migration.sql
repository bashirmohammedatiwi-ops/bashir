-- «فاتورة هدية» من كاشير الطلبات: الأصناف بلا مقابل (إيصال هدية في المحل)، والتوصيل/التغليف فقط على شركة التوصيل. إضافي فقط.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cashierGift" BOOLEAN NOT NULL DEFAULT false;

-- إخفاء المخزون القليل لكل قسم رئيسي (يظهر «نافذ» للزبون إذا المخزون ≤ الحد).
ALTER TABLE "Category" ADD COLUMN "hideLowStock" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Category" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 2;

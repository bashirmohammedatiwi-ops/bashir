-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "title" TEXT,
ADD COLUMN "subtitle" TEXT,
ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "homePosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'rose',
ADD COLUMN "maxDiscount" INTEGER,
ADD COLUMN "perUserLimit" INTEGER,
ADD COLUMN "worldSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Coupon_showOnHome_idx" ON "Coupon"("showOnHome");

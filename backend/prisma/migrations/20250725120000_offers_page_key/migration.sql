-- CreateEnum
CREATE TYPE "CmsPageKey" AS ENUM ('HOME', 'OFFERS');

-- AlterTable
ALTER TABLE "HomeBlock" ADD COLUMN "pageKey" "CmsPageKey" NOT NULL DEFAULT 'HOME';

-- CreateIndex
CREATE INDEX "HomeBlock_pageKey_idx" ON "HomeBlock"("pageKey");
CREATE INDEX "HomeBlock_pageKey_isActive_idx" ON "HomeBlock"("pageKey", "isActive");

-- CreateEnum
CREATE TYPE "NotificationLinkType" AS ENUM ('NONE', 'PRODUCT', 'CATEGORY', 'BRAND', 'PACKAGE', 'EXTERNAL_URL');

-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM ('ALL', 'USER');

-- CreateEnum
CREATE TYPE "NotificationPushStatus" AS ENUM ('PENDING', 'SENT', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "linkType" "NotificationLinkType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "linkId" TEXT,
ADD COLUMN     "linkSlug" TEXT,
ADD COLUMN     "linkLabel" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "targetType" "NotificationTargetType" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "pushStatus" "NotificationPushStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "sentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "failedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_isActive_idx" ON "DeviceToken"("isActive");

-- CreateIndex
CREATE INDEX "Notification_pushStatus_idx" ON "Notification"("pushStatus");

-- CreateIndex
CREATE INDEX "Notification_linkType_idx" ON "Notification"("linkType");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

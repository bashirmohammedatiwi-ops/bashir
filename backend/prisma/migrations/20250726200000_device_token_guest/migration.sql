-- Allow anonymous device tokens for broadcast push (guests / before login)
ALTER TABLE "DeviceToken" DROP CONSTRAINT "DeviceToken_userId_fkey";
ALTER TABLE "DeviceToken" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

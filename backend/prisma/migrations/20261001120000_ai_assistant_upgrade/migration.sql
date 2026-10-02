-- Assistant upgrade: long-term user memory (AiUserMemory).

CREATE TABLE IF NOT EXISTS "AiUserMemory" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "userId" TEXT,
    "guestKey" TEXT,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "evidence" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUserMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AiUserMemory_ownerKey_kind_key_key" ON "AiUserMemory"("ownerKey", "kind", "key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiUserMemory_userId_updatedAt_idx" ON "AiUserMemory"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiUserMemory_guestKey_updatedAt_idx" ON "AiUserMemory"("guestKey", "updatedAt");

-- AddForeignKey
ALTER TABLE "AiUserMemory" ADD CONSTRAINT "AiUserMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssistantGuide" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "concern" TEXT,
    "productId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantGuide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssistantGuide_isActive_idx" ON "AssistantGuide"("isActive");
CREATE INDEX "AssistantGuide_concern_idx" ON "AssistantGuide"("concern");

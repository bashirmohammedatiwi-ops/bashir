CREATE TABLE "AssistantTurn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "kind" TEXT,
    "concern" TEXT,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tappedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" INTEGER,
    "feedbackNote" TEXT,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantTurn_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssistantTurn_createdAt_idx" ON "AssistantTurn"("createdAt");
CREATE INDEX "AssistantTurn_userId_createdAt_idx" ON "AssistantTurn"("userId", "createdAt");
CREATE INDEX "AssistantTurn_outcome_idx" ON "AssistantTurn"("outcome");

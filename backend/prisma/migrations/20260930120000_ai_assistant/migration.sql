-- AI Shopping Assistant: conversations, messages, usage logs, product embeddings
-- + normalized lexical search document for the assistant retrieval layer.

CREATE TABLE IF NOT EXISTS "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestKey" TEXT,
    "title" TEXT,
    "state" JSONB NOT NULL DEFAULT '{}',
    "summary" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastIntent" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "payload" JSONB,
    "intent" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "latencyMs" INTEGER,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "feedback" INTEGER,
    "feedbackNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiUsageLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "conversationId" TEXT,
    "userId" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "intent" TEXT,
    "latencyMs" INTEGER,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "toolCalls" JSONB,
    "retrievalMs" INTEGER,
    "candidateCount" INTEGER,
    "selectedProductIds" JSONB,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "estCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductEmbedding" (
    "productId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dims" INTEGER NOT NULL,
    "embedding" TEXT NOT NULL,
    "docHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("productId")
);

CREATE INDEX IF NOT EXISTS "AiConversation_userId_lastMessageAt_idx" ON "AiConversation"("userId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "AiConversation_guestKey_lastMessageAt_idx" ON "AiConversation"("guestKey", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiMessage_feedback_idx" ON "AiMessage"("feedback");
CREATE INDEX IF NOT EXISTS "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AiUsageLog_conversationId_idx" ON "AiUsageLog"("conversationId");
CREATE INDEX IF NOT EXISTS "AiUsageLog_intent_idx" ON "AiUsageLog"("intent");
CREATE INDEX IF NOT EXISTS "AiUsageLog_status_idx" ON "AiUsageLog"("status");
CREATE INDEX IF NOT EXISTS "ProductEmbedding_model_idx" ON "ProductEmbedding"("model");
CREATE INDEX IF NOT EXISTS "ProductEmbedding_docHash_idx" ON "ProductEmbedding"("docHash");

DO $$ BEGIN
    ALTER TABLE "AiConversation"
        ADD CONSTRAINT "AiConversation_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "AiMessage"
        ADD CONSTRAINT "AiMessage_conversationId_fkey"
        FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "ProductEmbedding"
        ADD CONSTRAINT "ProductEmbedding_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Normalized lexical document for assistant retrieval (maintained by the app on write).
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchText" TEXT NOT NULL DEFAULT '';

-- Fuzzy matching support. pg_trgm ships with the official postgres image.
-- If the extension cannot be created (managed DB without contrib), the lexical
-- layer falls back to normalized ILIKE automatically.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_searchText_trgm_idx"
    ON "Product" USING GIN ("searchText" gin_trgm_ops);

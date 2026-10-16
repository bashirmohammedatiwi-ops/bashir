-- CreateTable
CREATE TABLE "AdvisorAiUsage" (
    "day" TEXT NOT NULL,
    "chatCalls" INTEGER NOT NULL DEFAULT 0,
    "enrichCalls" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorAiUsage_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "AdvisorEnrichment" (
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorEnrichment_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "AdvisorEnrichment_type_idx" ON "AdvisorEnrichment"("type");

-- CreateTable
CREATE TABLE "AdvisorPhrase" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "delta" JSONB NOT NULL,
    "intent" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorPhrase_phrase_key" ON "AdvisorPhrase"("phrase");

-- CreateIndex
CREATE INDEX "AdvisorPhrase_source_idx" ON "AdvisorPhrase"("source");

-- CreateTable
CREATE TABLE "AdvisorQueryLog" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sample" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisorQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorQueryLog_text_key" ON "AdvisorQueryLog"("text");

-- CreateIndex
CREATE INDEX "AdvisorQueryLog_resolved_count_idx" ON "AdvisorQueryLog"("resolved", "count");

-- CreateTable
CREATE TABLE "AdvisorTraining" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "running" BOOLEAN NOT NULL DEFAULT false,
    "liveAi" BOOLEAN NOT NULL DEFAULT true,
    "autoNew" BOOLEAN NOT NULL DEFAULT true,
    "dailyBatches" INTEGER NOT NULL DEFAULT 60,
    "tasks" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorTraining_pkey" PRIMARY KEY ("id")
);

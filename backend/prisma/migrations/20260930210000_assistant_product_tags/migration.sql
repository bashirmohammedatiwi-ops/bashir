CREATE TABLE "AssistantProductTag" (
    "productId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'other',
    "role" TEXT NOT NULL DEFAULT 'other',
    "area" TEXT NOT NULL DEFAULT 'other',
    "concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audience" TEXT NOT NULL DEFAULT 'adult',
    "summary" TEXT NOT NULL DEFAULT '',
    "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "sourceHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantProductTag_pkey" PRIMARY KEY ("productId")
);

ALTER TABLE "AssistantTurn" ADD COLUMN "cartIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "AssistantProfile" (
    "userId" TEXT NOT NULL,
    "skinType" TEXT,
    "hairType" TEXT,
    "sensitivities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likedBrands" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoidBrands" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantProfile_pkey" PRIMARY KEY ("userId")
);

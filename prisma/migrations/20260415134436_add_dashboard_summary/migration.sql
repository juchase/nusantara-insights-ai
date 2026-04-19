-- CreateTable
CREATE TABLE "DashboardSummary" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "totalReviews" INTEGER NOT NULL,
    "positiveCount" INTEGER NOT NULL,
    "neutralCount" INTEGER NOT NULL,
    "negativeCount" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardSummary_pkey" PRIMARY KEY ("id")
);

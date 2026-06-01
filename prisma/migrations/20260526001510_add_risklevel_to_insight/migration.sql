/*
  Warnings:

  - Added the required column `demandGrowthPct` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `demandTrend` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dominantIssue` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riskLevel` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sentimentScore` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "demandGrowthPct" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "demandTrend" TEXT NOT NULL,
ADD COLUMN     "dominantIssue" TEXT NOT NULL,
ADD COLUMN     "llmModel" TEXT,
ADD COLUMN     "llmUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskLevel" TEXT NOT NULL,
ADD COLUMN     "sentimentScore" DOUBLE PRECISION NOT NULL;

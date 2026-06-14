-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "confidenceColor" TEXT,
ADD COLUMN     "confidenceLabel" TEXT,
ADD COLUMN     "confidenceMessage" TEXT;

/*
  Warnings:

  - You are about to drop the column `insightText` on the `Insight` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `Insight` table. All the data in the column will be lost.
  - Added the required column `healthScore` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insights` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendations` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "insightText",
DROP COLUMN "severity",
ADD COLUMN     "healthScore" INTEGER NOT NULL,
ADD COLUMN     "insights" JSONB NOT NULL,
ADD COLUMN     "recommendations" JSONB NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

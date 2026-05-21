/*
  Warnings:

  - You are about to drop the column `type` on the `Insight` table. All the data in the column will be lost.
  - Added the required column `insightType` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendation` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "type",
ADD COLUMN     "insightType" TEXT NOT NULL,
ADD COLUMN     "recommendation" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "llmResponse" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLog_pkey" PRIMARY KEY ("id")
);

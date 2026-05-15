/*
  Warnings:

  - You are about to drop the column `insightType` on the `Insight` table. All the data in the column will be lost.
  - You are about to drop the column `recommendation` on the `Insight` table. All the data in the column will be lost.
  - Added the required column `severity` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "insightType",
DROP COLUMN "recommendation",
ADD COLUMN     "severity" TEXT NOT NULL;

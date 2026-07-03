/*
  Warnings:

  - You are about to drop the column `aspect` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "freq" TEXT DEFAULT 'D';

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "aspect";

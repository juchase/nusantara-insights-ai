/*
  Warnings:

  - Added the required column `productId` to the `KeywordSummary` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "KeywordSummary_word_key";

-- AlterTable
ALTER TABLE "KeywordSummary" ADD COLUMN     "productId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "KeywordSummary" ADD CONSTRAINT "KeywordSummary_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

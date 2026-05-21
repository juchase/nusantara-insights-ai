/*
  Warnings:

  - A unique constraint covering the columns `[productId,word]` on the table `KeywordSummary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "KeywordSummary_productId_word_key" ON "KeywordSummary"("productId", "word");

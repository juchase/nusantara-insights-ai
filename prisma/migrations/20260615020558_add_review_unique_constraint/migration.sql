/*
  Warnings:

  - A unique constraint covering the columns `[productId,reviewText,reviewDate]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_reviewText_reviewDate_key" ON "Review"("productId", "reviewText", "reviewDate");

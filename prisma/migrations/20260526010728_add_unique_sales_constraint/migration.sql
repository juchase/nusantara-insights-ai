/*
  Warnings:

  - A unique constraint covering the columns `[productId,date]` on the table `Sales` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Sales_productId_date_key" ON "Sales"("productId", "date");

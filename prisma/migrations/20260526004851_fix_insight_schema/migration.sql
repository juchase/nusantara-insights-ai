-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "executiveSummary" TEXT;

-- CreateIndex
CREATE INDEX "Insight_productId_idx" ON "Insight"("productId");

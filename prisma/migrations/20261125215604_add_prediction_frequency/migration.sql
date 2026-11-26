-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "freq" TEXT NOT NULL DEFAULT 'D';

-- CreateIndex
CREATE INDEX "Prediction_productId_freq_predictionDate_idx" ON "Prediction"("productId", "freq", "predictionDate");

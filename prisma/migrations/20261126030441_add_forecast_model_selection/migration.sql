-- CreateTable
CREATE TABLE "ForecastModelSelection" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "selectedModel" TEXT NOT NULL,
    "selectionReason" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'adaptive_selection',
    "validationMae" DOUBLE PRECISION,
    "validationRmse" DOUBLE PRECISION,
    "validationWape" DOUBLE PRECISION,
    "nPredictions" INTEGER NOT NULL DEFAULT 0,
    "evaluationStatus" TEXT NOT NULL DEFAULT 'success',
    "evaluationVersion" TEXT NOT NULL DEFAULT 'v1',
    "dataPoints" INTEGER NOT NULL,
    "dataVersion" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastModelSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastModelSelection_productId_frequency_evaluatedAt_idx" ON "ForecastModelSelection"("productId", "frequency", "evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastModelSelection_productId_frequency_key" ON "ForecastModelSelection"("productId", "frequency");

-- AddForeignKey
ALTER TABLE "ForecastModelSelection" ADD CONSTRAINT "ForecastModelSelection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

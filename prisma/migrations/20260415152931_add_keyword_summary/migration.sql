-- CreateTable
CREATE TABLE "KeywordSummary" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "KeywordSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordSummary_word_key" ON "KeywordSummary"("word");

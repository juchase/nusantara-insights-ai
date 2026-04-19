import { prisma } from "../lib/prisma";

async function main() {
  console.log("🚀 Rebuilding keyword summary...");

  const reviews = await prisma.review.findMany({
    select: { reviewText: true },
  });

  const wordCount: Record<string, number> = {};

  const stopwords = ["yang", "dan", "dari", "ini", "itu"];

  reviews.forEach((r) => {
    const words = r.reviewText
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ");

    words.forEach((word) => {
      if (word.length < 4) return;
      if (stopwords.includes(word)) return;

      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });

  console.log("📊 Total unique keywords:", Object.keys(wordCount).length);

  for (const word in wordCount) {
    await prisma.keywordSummary.upsert({
      where: { word },
      update: {
        count: wordCount[word],
      },
      create: {
        word,
        count: wordCount[word],
      },
    });
  }

  console.log("✅ Keyword summary rebuilt!");
}

main()
  .catch((e) => {
    console.error("❌ ERROR:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

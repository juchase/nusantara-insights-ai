import { generateInsightAI } from "./ai-client";

export function calculateSentiment(reviews: any[]) {
  let positive = 0,
    negative = 0,
    neutral = 0;

  reviews.forEach((r) => {
    if (r.sentiment === "positive") positive++;
    else if (r.sentiment === "negative") negative++;
    else neutral++;
  });

  return { positive, negative, neutral };
}

export function calculateAvgRating(reviews: any[]) {
  const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Math.round((total / (reviews.length || 1)) * 10) / 10;
}

export function extractKeywords(reviews: any[]) {
  const wordCount: Record<string, number> = {};

  const keywords = [
    "rusak",
    "lama",
    "buruk",
    "jelek",
    "telat",
    "pecah",
    "lambat",
    "kurang",
    "pengiriman",
    "kemasan",
  ];

  reviews.forEach((r) => {
    if (!r.reviewText) return;

    const words = r.reviewText.toLowerCase().split(" ");

    words.forEach((w: string) => {
      if (keywords.includes(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    });
  });

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

export function generateChartData(reviews: any[]) {
  const grouped: Record<string, any> = {};

  reviews.forEach((r) => {
    const date = new Date(r.reviewDate || r.createdAt).toLocaleDateString(
      "id-ID",
      { day: "2-digit", month: "short" },
    );

    if (!grouped[date]) {
      grouped[date] = {
        date,
        positive: 0,
        negative: 0,
        neutral: 0,
      };
    }

    grouped[date][r.sentiment]++;
  });

  return Object.values(grouped);
}

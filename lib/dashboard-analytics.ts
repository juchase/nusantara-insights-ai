export function processDashboardData(reviews: any[]) {
  const grouped: Record<string, number> = {};
  const wordCount: Record<string, number> = {};
  const sentimentCount = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  const stopwords = [
    "yang",
    "dan",
    "dari",
    "untuk",
    "dengan",
    "ini",
    "itu",
    "saya",
    "kamu",
    "tidak",
    "ada",
    "karena",
    "jadi",
    "sudah",
    "produk",
    "barang",
    "sangat",
    "cukup",
    "banget",
    "sekali",
    "sesuai",
  ];

  const negativeKeywords = [
    "rusak",
    "lama",
    "buruk",
    "jelek",
    "telat",
    "pecah",
    "lambat",
    "kurang",
  ];

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  };

  for (const r of reviews) {
    // 📊 chart
    const date = formatDate(r.reviewDate || r.createdAt);
    grouped[date] = (grouped[date] || 0) + 1;

    // 😊 sentiment
    if (r.sentiment in sentimentCount) {
      sentimentCount[r.sentiment as keyof typeof sentimentCount]++;
    }

    // 🧠 keyword
    if (r.reviewText) {
      const words = r.reviewText
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(" ");

      for (const word of words) {
        if (word.length < 4) continue;
        if (stopwords.includes(word)) continue;
        if (!negativeKeywords.includes(word)) continue;

        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }
  }

  const total = reviews.length || 1;

  const sentimentStats = {
    positive: Math.round((sentimentCount.positive / total) * 100),
    neutral: Math.round((sentimentCount.neutral / total) * 100),
    negative: Math.round((sentimentCount.negative / total) * 100),
  };

  const topKeywords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chartData = Object.keys(grouped)
    .map((date) => ({
      date,
      total: grouped[date],
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    sentimentStats,
    topKeywords,
    chartData,
  };
}

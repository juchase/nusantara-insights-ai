import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [summary, totalProducts] = await Promise.all([
    prisma.dashboardSummary.findUnique({
      where: { id: "main" },
    }),
    prisma.product.count(), // 🔥 ini tambahan
  ]);

  if (!summary) {
    return NextResponse.json({
      totalReviews: 0,
      avgRating: 0,
      sentimentStats: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
    });
  }

  const avgRating =
    summary.totalReviews > 0 ? summary.totalRating / summary.totalReviews : 0;

  const sentimentStats = {
    positive: Math.round((summary.positiveCount / summary.totalReviews) * 100),
    neutral: Math.round((summary.neutralCount / summary.totalReviews) * 100),
    negative: Math.round((summary.negativeCount / summary.totalReviews) * 100),
  };

  const daily = await prisma.dailyReviewSummary.findMany({
    orderBy: { date: "asc" },
  });

  const chartData = daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
    total: d.total,
  }));

  const keywords = await prisma.keywordSummary.findMany({
    orderBy: { count: "desc" },
    take: 10,
  });

  const topKeywords = keywords.map((k) => [k.word, k.count]);

  return NextResponse.json({
    totalReviews: summary.totalReviews,
    avgRating,
    totalProducts,
    sentimentStats,
    chartData,
    topKeywords,
  });
}

// app/api/insights/[productId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  const userPayload = getUserFromRequest(req);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await context.params;

    const product = await prisma.product.findFirst({
      where: { id: productId, userId: userPayload.userId },
    });

    if (!product) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil insight terbaru dari DB — tidak memanggil AI service
    const insight = await prisma.insight.findFirst({
      where: { productId, product: { userId: userPayload.userId } },
      orderBy: { createdAt: "desc" },
    });

    if (!insight) {
      return NextResponse.json(null, { status: 200 });
    }

    // ── Ambil data tambahan untuk metrics dan sentiment_trend dari DB ───────
    const [reviewStats, predictions] = await Promise.all([
      // Hitung metrics sentimen langsung dari tabel Review
      prisma.review.groupBy({
        by: ["sentiment"],
        where: { productId },
        _count: { sentiment: true },
      }),
      // Ambil prediksi terbaru untuk growth dan confidence
      prisma.prediction.findMany({
        where: { productId },
        orderBy: { predictionDate: "asc" },
        take: 7,
      }),
    ]);

    const totalReviews = reviewStats.reduce(
      (sum, r) => sum + r._count.sentiment,
      0,
    );
    const positiveCount =
      reviewStats.find((r) => r.sentiment === "positive")?._count.sentiment ??
      0;
    const negativeCount =
      reviewStats.find((r) => r.sentiment === "negative")?._count.sentiment ??
      0;
    const neutralCount =
      reviewStats.find((r) => r.sentiment === "neutral")?._count.sentiment ?? 0;

    const positivePercentage =
      totalReviews > 0 ? (positiveCount / totalReviews) * 100 : 0;
    const negativePercentage =
      totalReviews > 0 ? (negativeCount / totalReviews) * 100 : 0;
    const neutralPercentage =
      totalReviews > 0 ? (neutralCount / totalReviews) * 100 : 0;

    // ── Map field DB (camelCase Prisma) ke format yang diharapkan frontend ──
    return NextResponse.json({
      executive_summary: insight.executiveSummary ?? "",
      summary: insight.summary ?? "",
      health_score: insight.healthScore ?? 0,
      health_label: getHealthLabel(insight.healthScore ?? 0),
      insights: insight.insights ?? [],
      recommendations: insight.recommendations ?? [],
      dominant_issue: insight.dominantIssue ?? "—",
      risk_level: insight.riskLevel ?? "low",
      llm_used: insight.llmUsed ?? false,
      metrics: {
        positive_percentage: Math.round(positivePercentage * 10) / 10,
        negative_percentage: Math.round(negativePercentage * 10) / 10,
        neutral_percentage: Math.round(neutralPercentage * 10) / 10,
        total_reviews: totalReviews,
        growth_percentage: Number(insight.demandGrowthPct ?? 0),
        forecast_trend: insight.demandTrend ?? "stable",
        top_keyword: insight.dominantIssue ?? "",
      },
      // forecastSummary dari data prediksi di DB
      forecastSummary:
        predictions.length > 0
          ? {
              avg: Math.round(
                predictions.reduce((s, p) => s + p.predictedSales, 0) /
                  predictions.length,
              ),
              min: Math.min(...predictions.map((p) => p.predictedSales)),
              max: Math.max(...predictions.map((p) => p.predictedSales)),
              lower: Math.min(
                ...predictions.map(
                  (p) => (p as any).lowerBound ?? p.predictedSales,
                ),
              ),
              upper: Math.max(
                ...predictions.map(
                  (p) => (p as any).upperBound ?? p.predictedSales,
                ),
              ),
            }
          : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

function getHealthLabel(score: number): string {
  if (score >= 75) return "Sangat Baik";
  if (score >= 55) return "Baik";
  if (score >= 35) return "Perlu Perhatian";
  return "Kritis";
}

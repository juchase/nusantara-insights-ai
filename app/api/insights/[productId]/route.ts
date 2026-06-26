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

    // 1. Validasi kepemilikan produk
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: userPayload.userId },
    });

    if (!product) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Ambil insight terbaru
    const insight = await prisma.insight.findFirst({
      where: { productId, product: { userId: userPayload.userId } },
      orderBy: { createdAt: "desc" },
    });

    if (!insight) {
      return NextResponse.json(null, { status: 200 });
    }

    // 3. Tentukan frekuensi prediksi dari tabel Prediction
    const latestPrediction = await prisma.prediction.findFirst({
      where: { productId },
      orderBy: { predictionDate: "desc" },
      select: { modelVersion: true },
    });

    let freq: "D" | "W" = "D";
    let modelVersion = latestPrediction?.modelVersion ?? "prophet";

    if (
      modelVersion &&
      (modelVersion.toLowerCase().includes("weekly") ||
        modelVersion.toLowerCase().includes("moving_average") ||
        modelVersion.toLowerCase().includes("week"))
    ) {
      freq = "W";
    }

    const takeCount = freq === "W" ? 4 : 7;
    const predictions = await prisma.prediction.findMany({
      where: { productId },
      orderBy: { predictionDate: "asc" },
      take: takeCount,
    });

    // 4. Ambil data review untuk sentimen
    const [reviewStats, allReviews] = await Promise.all([
      prisma.review.groupBy({
        by: ["sentiment"],
        where: { productId },
        _count: { sentiment: true },
      }),
      prisma.review.findMany({
        where: { productId },
        select: { sentiment: true, reviewDate: true },
        orderBy: { reviewDate: "asc" },
      }),
    ]);

    // ── Hitung persentase sentimen global ──
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

    // ── Hitung tren sentimen (periode) ──
    let sentimentTrendResponse;

    if (allReviews.length < 10) {
      sentimentTrendResponse = {
        status: "insufficient_data",
        first_period_positive: 0,
        second_period_positive: 0,
        delta: 0,
        trend: "insufficient_data",
        label: "Data belum cukup",
        message: "Minimal 10 ulasan diperlukan untuk analisis tren",
      };
    } else {
      const mid = Math.floor(allReviews.length / 2);
      const firstPeriod = allReviews.slice(0, mid);
      const secondPeriod = allReviews.slice(mid);

      const calcPosPct = (reviewsArray: typeof allReviews) => {
        if (reviewsArray.length === 0) return 0;
        const pos = reviewsArray.filter(
          (r) => r.sentiment === "positive",
        ).length;
        return Math.round((pos / reviewsArray.length) * 1000) / 10;
      };

      const firstPos = calcPosPct(firstPeriod);
      const secondPos = calcPosPct(secondPeriod);
      const delta = Math.round((secondPos - firstPos) * 10) / 10;

      const formatDate = (dateInput: any) => {
        if (!dateInput) return "—";
        const d = new Date(dateInput);
        return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
      };

      const firstStart = formatDate(firstPeriod[0]?.reviewDate);
      const firstEnd = formatDate(
        firstPeriod[firstPeriod.length - 1]?.reviewDate,
      );
      const secondStart = formatDate(secondPeriod[0]?.reviewDate);
      const secondEnd = formatDate(
        secondPeriod[secondPeriod.length - 1]?.reviewDate,
      );

      let trend = "stable";
      let label = "Stabil";
      let message = "Sentimen pelanggan relatif konsisten antar periode";

      if (delta > 5) {
        trend = "improving";
        label = "Membaik";
        message = `Sentimen positif naik ${delta.toFixed(1)}% pada periode akhir`;
      } else if (delta < -5) {
        trend = "declining";
        label = "Menurun";
        message = `Sentimen positif turun ${Math.abs(delta).toFixed(1)}% pada periode akhir`;
      }

      sentimentTrendResponse = {
        status: "ok",
        trend,
        label,
        message,
        delta,
        first_period_positive: firstPos,
        second_period_positive: secondPos,
        first_period_range: `${firstStart} — ${firstEnd}`,
        second_period_range: `${secondStart} — ${secondEnd}`,
        first_period_count: firstPeriod.length,
        second_period_count: secondPeriod.length,
      };
    }

    // 6. Siapkan forecastSummary dari prediksi
    const forecastSummary =
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
        : null;

    // ── HITUNG GROWTH DAN DETEKSI LOW-VOLUME ──────────────────────────────
    const rawGrowth = Number(insight.demandGrowthPct ?? 0);
    const avgPred = forecastSummary?.avg ?? 0;
    const isLowVolume = avgPred < 10 && Math.abs(rawGrowth) > 50;

    let growthPercentage = rawGrowth;
    let forecastTrend = insight.demandTrend ?? "stable";

    if (isLowVolume) {
      // Set growth ke 0 agar rekomendasi tidak menulis angka gila
      growthPercentage = 0;
      // Tapi trend tetap mengikuti arah asli
      if (rawGrowth > 0) forecastTrend = "up";
      else if (rawGrowth < 0) forecastTrend = "down";
      else forecastTrend = "stable";
    }

    // 7. Return JSON lengkap
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
      freq,
      modelVersion,
      metrics: {
        positive_percentage: Math.round(positivePercentage * 10) / 10,
        negative_percentage: Math.round(negativePercentage * 10) / 10,
        neutral_percentage: Math.round(neutralPercentage * 10) / 10,
        total_reviews: totalReviews,
        growth_percentage: growthPercentage,
        forecast_trend: forecastTrend,
        top_keyword: insight.dominantIssue ?? "",
      },
      sentiment_trend: sentimentTrendResponse,
      confidence: (insight as any).confidence ?? 0,
      confidence_context: (insight as any).confidence
        ? {
            label: (insight as any).confidenceLabel ?? "Akurasi Rendah",
            message: (insight as any).confidenceMessage ?? "",
            color:
              ((insight as any).confidenceColor as "green" | "amber" | "red") ??
              "red",
          }
        : null,
      forecastSummary,
    });
  } catch (error) {
    console.error("Error inside GET insights route:", error);
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

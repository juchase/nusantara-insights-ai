import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await context.params;
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: session.user.id },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insight = await prisma.insight.findFirst({
      where: { productId, product: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
    });
    if (!insight) return NextResponse.json(null, { status: 200 });

    const freq = insight.freq === "W" ? "W" : "D";
    const [predictions, reviewStats, allReviews, selection] = await Promise.all([
      prisma.prediction.findMany({
        where: { productId, freq },
        orderBy: { predictionDate: "asc" },
        take: freq === "W" ? 4 : 7,
      }),
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
      prisma.forecastModelSelection.findUnique({
        where: { productId_frequency: { productId, frequency: freq } },
      }),
    ]);

    const totalReviews = reviewStats.reduce((sum, row) => sum + row._count.sentiment, 0);
    const countFor = (sentiment: string) =>
      reviewStats.find((row) => row.sentiment === sentiment)?._count.sentiment ?? 0;
    const positiveCount = countFor("positive");
    const negativeCount = countFor("negative");
    const neutralCount = countFor("neutral");
    const percentage = (count: number) => totalReviews ? Math.round((count / totalReviews) * 1000) / 10 : 0;

    let sentimentTrendResponse: Record<string, unknown>;
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
      const midpoint = Math.floor(allReviews.length / 2);
      const first = allReviews.slice(0, midpoint);
      const second = allReviews.slice(midpoint);
      const positiveRate = (items: typeof allReviews) =>
        items.length ? Math.round((items.filter((item) => item.sentiment === "positive").length / items.length) * 1000) / 10 : 0;
      const firstPositive = positiveRate(first);
      const secondPositive = positiveRate(second);
      const delta = Math.round((secondPositive - firstPositive) * 10) / 10;
      const dateLabel = (value?: Date) => value ? new Date(value).toISOString().slice(0, 10) : "—";
      let trend = "stable", label = "Stabil", message = "Sentimen pelanggan relatif konsisten antar periode";
      if (delta > 5) {
        trend = "improving"; label = "Membaik";
        message = `Sentimen positif naik ${delta.toFixed(1)}% pada periode akhir`;
      } else if (delta < -5) {
        trend = "declining"; label = "Menurun";
        message = `Sentimen positif turun ${Math.abs(delta).toFixed(1)}% pada periode akhir`;
      }
      sentimentTrendResponse = {
        status: "ok", trend, label, message, delta,
        first_period_positive: firstPositive,
        second_period_positive: secondPositive,
        first_period_range: `${dateLabel(first[0]?.reviewDate)} — ${dateLabel(first[first.length - 1]?.reviewDate)}`,
        second_period_range: `${dateLabel(second[0]?.reviewDate)} — ${dateLabel(second[second.length - 1]?.reviewDate)}`,
        first_period_count: first.length,
        second_period_count: second.length,
      };
    }

    const forecastSummary = predictions.length ? {
      avg: Math.round(predictions.reduce((sum, item) => sum + item.predictedSales, 0) / predictions.length * 100) / 100,
      min: Math.min(...predictions.map((item) => item.predictedSales)),
      max: Math.max(...predictions.map((item) => item.predictedSales)),
    } : null;

    const rawGrowth = Number(insight.demandGrowthPct ?? 0);
    const averageForecast = forecastSummary?.avg ?? 0;
    const lowVolume = averageForecast < 10 && Math.abs(rawGrowth) > 50;
    let growthPercentage = rawGrowth;
    let forecastTrend = insight.demandTrend ?? "stable";
    if (lowVolume) {
      growthPercentage = 0;
      forecastTrend = rawGrowth > 0 ? "up" : rawGrowth < 0 ? "down" : "stable";
    }

    // Nilai 0 adalah confidence valid; hanya null berarti belum tersedia.
    const confidence = insight.confidence == null ? null : Number(insight.confidence);
    const confidenceAvailable = confidence !== null && Number.isFinite(confidence);
    const confidenceColor = ["green", "yellow", "red", "gray"].includes(insight.confidenceColor ?? "")
      ? insight.confidenceColor!
      : confidenceAvailable ? "red" : "gray";

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
      modelVersion: insight.modelVersion ?? "unavailable",
      metrics: {
        positive_percentage: percentage(positiveCount),
        negative_percentage: percentage(negativeCount),
        neutral_percentage: percentage(neutralCount),
        total_reviews: totalReviews,
        growth_percentage: growthPercentage,
        forecast_trend: forecastTrend,
        top_keyword: insight.dominantIssue ?? "",
      },
      sentiment_trend: sentimentTrendResponse,
      confidence,
      confidence_context: {
        status: confidenceAvailable ? "available" : "unavailable",
        reason: confidenceAvailable ? null : "confidence_not_available",
        label: insight.confidenceLabel ?? (confidenceAvailable ? "Reliabilitas terukur" : "Belum tersedia"),
        message: insight.confidenceMessage ?? (confidenceAvailable
          ? "Skor dihitung dari Validation WAPE pada data validasi."
          : "Confidence belum tersedia karena evaluasi belum memenuhi persyaratan."),
        color: confidenceColor,
      },
      validation: selection ? {
        wape: selection.validationWape,
        mae: selection.validationMae,
        rmse: selection.validationRmse,
        n_predictions: selection.nPredictions,
        evaluation_status: selection.evaluationStatus,
      } : null,
      forecastSummary,
    });
  } catch (error) {
    console.error("Error inside GET insights route:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

function getHealthLabel(score: number): string {
  if (score >= 75) return "Sangat Baik";
  if (score >= 55) return "Baik";
  if (score >= 35) return "Perlu Perhatian";
  return "Kritis";
}


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await context.params;
  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.user.id },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET belum dikonfigurasi" },
      { status: 503 },
    );
  }

  let body: { frequency?: "D" | "W" } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const frequency = body.frequency ?? "D";
  if (frequency !== "D" && frequency !== "W") {
    return NextResponse.json({ error: "frequency harus D atau W" }, { status: 400 });
  }

  const aiServiceUrl =
    process.env.AI_SERVICE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000";

  try {
    const response = await fetch(
      `${aiServiceUrl}/generate-insight/${encodeURIComponent(productId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-api-secret": internalSecret,
        },
        body: JSON.stringify({ frequency }),
        cache: "no-store",
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.detail || payload?.error || "Gagal membuat Insight", detail: payload },
        { status: response.status === 409 ? 409 : response.status === 422 ? 422 : 502 },
      );
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error("AI Service Insight tidak dapat dijangkau:", error);
    return NextResponse.json({ error: "AI service tidak dapat dijangkau" }, { status: 503 });
  }
}

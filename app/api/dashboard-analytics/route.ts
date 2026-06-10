import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userPayload = getUserFromRequest(req);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // products milik user
  const products = await prisma.product.findMany({
    where: {
      userId: userPayload.userId,
    },
    select: {
      id: true,
    },
  });

  const productIds = products.map((p) => p.id);

  // semua review user
  const reviews = await prisma.review.findMany({
    where: {
      productId: {
        in: productIds,
      },
    },
    orderBy: {
      reviewDate: "asc",
    },
  });

  // keyword summary
  const keywords = await prisma.keywordSummary.findMany({
    where: {
      productId: {
        in: productIds,
      },
    },
    orderBy: {
      count: "desc",
    },
    take: 10,
  });

  const totalReviews = reviews.length;

  const positiveCount = reviews.filter(
    (r) => r.sentiment === "positive",
  ).length;

  const neutralCount = reviews.filter((r) => r.sentiment === "neutral").length;

  const negativeCount = reviews.filter(
    (r) => r.sentiment === "negative",
  ).length;

  const totalRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0);

  const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  const sentimentStats = {
    positive:
      totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0,

    neutral:
      totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0,

    negative:
      totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0,
  };

  // chart reviews per hari
  const chartMap = new Map<string, number>();

  reviews.forEach((r) => {
    const key = new Date(r.reviewDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });

    chartMap.set(key, (chartMap.get(key) || 0) + 1);
  });

  const chartData = Array.from(chartMap).map(([date, total]) => ({
    date,
    total,
  }));

  const topKeywords = keywords.map((k) => [k.word, k.count]);

  return NextResponse.json({
    totalReviews,
    avgRating: Number(avgRating.toFixed(1)),
    totalProducts: products.length,
    sentimentStats,
    chartData,
    topKeywords,
  });
}

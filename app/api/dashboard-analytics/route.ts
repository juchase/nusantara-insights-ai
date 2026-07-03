import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userPayload = getUserFromRequest(req);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: userPayload.userId,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      productId,
    },
    orderBy: {
      reviewDate: "asc",
    },
  });

  const keywords = await prisma.keywordSummary.findMany({
    where: {
      productId,
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

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);

  const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  const sentimentStats = {
    positive:
      totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0,

    neutral:
      totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0,

    negative:
      totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0,
  };

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

  return NextResponse.json({
    totalReviews,
    avgRating,
    sentimentStats,
    chartData,
    topKeywords: keywords.map((k) => [k.word, k.count]),
  });
}

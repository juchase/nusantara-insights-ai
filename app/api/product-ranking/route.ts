// app/api/product-ranking/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const userPayload = getUserFromRequest(request);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: {
      id: userPayload.userId,
    },
    include: {
      reviews: {
        select: { sentiment: true, rating: true },
      },
      insights: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          healthScore: true,
          riskLevel: true,
          dominantIssue: true,
        },
      },
      _count: {
        select: { reviews: true, sales: true },
      },
    },
  });

  const ranked = products
    .filter((p) => p._count.reviews > 0)
    .map((p) => {
      const total = p.reviews.length;
      const positive = p.reviews.filter(
        (r) => r.sentiment === "positive",
      ).length;
      const negative = p.reviews.filter(
        (r) => r.sentiment === "negative",
      ).length;
      const avgRating =
        p.reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total;

      const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0;
      const negativeRate = total > 0 ? Math.round((negative / total) * 100) : 0;
      const latestInsight = p.insights[0];

      // Health score — dari insight kalau ada, fallback hitung manual
      const healthScore =
        latestInsight?.healthScore ??
        Math.round(50 + positiveRate * 0.3 - negativeRate * 0.2);

      return {
        id: p.id,
        name: p.name,
        totalReviews: total,
        positiveRate,
        negativeRate,
        avgRating: Math.round(avgRating * 10) / 10,
        healthScore: Math.min(100, Math.max(0, healthScore)),
        riskLevel: latestInsight?.riskLevel ?? "unknown",
        dominantIssue: latestInsight?.dominantIssue ?? "—",
        negativeCount: negative,
      };
    });

  // Sort untuk tiap kategori
  const byHealth = [...ranked].sort((a, b) => b.healthScore - a.healthScore);
  const byNegative = [...ranked].sort(
    (a, b) => b.negativeCount - a.negativeCount,
  );

  return NextResponse.json({
    best: byHealth[0] ?? null,
    worst: byHealth[byHealth.length - 1] ?? null,
    mostComplaints: byNegative[0] ?? null,
    all: byHealth, // semua produk sudah sorted by health
    total: ranked.length,
  });
}

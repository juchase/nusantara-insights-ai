// app/api/product-ranking/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        userId: userPayload.userId, // perbaikan utama
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
      },
    });

    // Filter produk yang punya review > 0
    const ranked = products
      .filter((p) => p.reviews.length > 0) // lebih aman daripada _count
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
        const positiveRate =
          total > 0 ? Math.round((positive / total) * 100) : 0;
        const negativeRate =
          total > 0 ? Math.round((negative / total) * 100) : 0;
        const latestInsight = p.insights[0];

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

    if (ranked.length === 0) {
      return NextResponse.json({
        best: null,
        worst: null,
        mostComplaints: null,
        all: [],
        total: 0,
      });
    }

    const byHealth = [...ranked].sort((a, b) => b.healthScore - a.healthScore);
    const byNegative = [...ranked].sort(
      (a, b) => b.negativeCount - a.negativeCount,
    );

    return NextResponse.json({
      best: byHealth[0],
      worst: byHealth[byHealth.length - 1],
      mostComplaints: byNegative[0],
      all: byHealth,
      total: ranked.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

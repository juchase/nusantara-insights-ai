import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            sales: true,
            predictions: true,
          },
        },
        insights: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            healthScore: true,
            riskLevel: true,
            dominantIssue: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

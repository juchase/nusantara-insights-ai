import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const userPayload = getUserFromRequest(request);

  if (!userPayload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: {
      userId: userPayload.userId,
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

  return Response.json(products);
}

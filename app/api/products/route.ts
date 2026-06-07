import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
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

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      productId: string;
    }>;
  },
) {
  try {
    const { productId } = await context.params;

    const insight = await prisma.insight.findFirst({
      where: {
        productId,
      },
    });

    if (!insight) {
      return NextResponse.json(
        {
          message: "Insight not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(insight);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

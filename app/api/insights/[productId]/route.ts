import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      productId: string;
    }>;
  },
) {
  const userPayload = getUserFromRequest(req);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: userPayload.userId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insight = await prisma.insight.findFirst({
      where: {
        productId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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

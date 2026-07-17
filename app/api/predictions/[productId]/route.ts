import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const userPayload = getUserFromRequest(req);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: userPayload.userId,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sales = await prisma.sales.findMany({
    where: { productId },
    orderBy: { date: "asc" },
  });

  const predictions = await prisma.prediction.findMany({
    where: { productId },
    orderBy: { predictionDate: "asc" },
  });

  return NextResponse.json({
    sales,
    predictions,
  });
}

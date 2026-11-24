import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: session.user.id,
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

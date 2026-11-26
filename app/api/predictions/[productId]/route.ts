import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const requestedFreq = req.nextUrl.searchParams.get("freq");
  if (requestedFreq && requestedFreq !== "D" && requestedFreq !== "W") {
    return NextResponse.json({ error: "freq harus D atau W" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.user.id },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [sales, predictions] = await Promise.all([
    prisma.sales.findMany({
      where: { productId },
      orderBy: { date: "asc" },
      select: { date: true, quantity: true },
    }),
    prisma.prediction.findMany({
      where: { productId, ...(requestedFreq ? { freq: requestedFreq } : {}) },
      orderBy: { predictionDate: "asc" },
    }),
  ]);

  return NextResponse.json({ sales, predictions });
}

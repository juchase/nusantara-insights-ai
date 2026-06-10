// app/api/complaints/[productId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }, // ← tambah Promise
) {
  const userPayload = getUserFromRequest(req);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params; // ← await dulu

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: userPayload.userId,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keywords = await prisma.keywordSummary.findMany({
    where: { productId },
    orderBy: { count: "desc" },
    take: 5,
  });

  const topKeywords = keywords.map((k) => [k.word, k.count]);

  return NextResponse.json({ topKeywords });
}

// app/api/complaints/[productId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }, // ← tambah Promise
) {
  const { productId } = await params; // ← await dulu

  const keywords = await prisma.keywordSummary.findMany({
    where: { productId },
    orderBy: { count: "desc" },
    take: 5,
  });

  const topKeywords = keywords.map((k) => [k.word, k.count]);

  return NextResponse.json({ topKeywords });
}

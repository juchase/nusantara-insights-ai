import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
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

  // GROUP BY Category & SUM count untuk hilangkan duplikasi
  const groupedKeywords = await prisma.keywordSummary.groupBy({
    by: ["category"],
    where: { productId },
    _sum: { count: true },
  });

  // Sorting manual untuk ambil 5 teratas
  const sorted = groupedKeywords
    .map((item) => ({
      category: item.category,
      totalCount: item._sum.count ?? 0,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  // Kembalikan format [category, count] seperti yang diharapkan frontend
  const topKeywords = sorted
    .slice(0, 5)
    .map((item) => [item.category, item.totalCount]);

  return NextResponse.json({ topKeywords });
}

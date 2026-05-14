import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } },
) {
  const { productId } = await params;

  const sales = await prisma.sales.findMany({
    where: { productId },
    orderBy: { date: "asc" },
  });

  const predictions = await prisma.prediction.findMany({
    where: { productId },
    orderBy: { predictionDate: "asc" },
  });

  return Response.json({
    sales,
    predictions,
  });
}

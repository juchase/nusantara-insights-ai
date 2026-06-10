import { prisma } from "@/lib/prisma";
import { predictDemand } from "@/lib/ai-client";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { productId } = await req.json();

  const userPayload = getUserFromRequest(req);

  if (!userPayload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. ambil sales dari DB
  const salesData = await prisma.sales.findMany({
    where: { productId },
    orderBy: { date: "asc" },
  });

  if (salesData.length < 3) {
    return Response.json(
      {
        error: "Not enough data for prediction",
      },
      { status: 400 },
    );
  }

  const sales = salesData.map((s) => s.quantity);

  // 2. call AI service
  const aiResult = await predictDemand(sales);

  const lastActual = sales[sales.length - 1];

  const avgPrediction =
    aiResult.predictions.reduce((sum: number, p: any) => {
      return sum + p.predictedSales;
    }, 0) / aiResult.predictions.length;

  const growth = ((avgPrediction - lastActual) / lastActual) * 100;

  // 3. simpan ke DB
  await prisma.prediction.createMany({
    data: aiResult.predictions.map((p: any) => ({
      productId,
      userId: userPayload.userId,
      predictedSales: p.predictedSales,
      predictionDate: new Date(p.date),
      modelVersion: "v1-linear",
    })),
  });

  return Response.json({
    success: true,
    predictions: aiResult.predictions,
    growth: Number(growth.toFixed(1)),
  });
}

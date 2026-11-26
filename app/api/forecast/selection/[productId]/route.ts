import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const MIN_CONFIDENCE_PREDICTIONS = 2;

export async function GET(request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await context.params;
  const frequency = request.nextUrl.searchParams.get("frequency") ?? "D";
  if (frequency !== "D" && frequency !== "W") return NextResponse.json({ error: "frequency harus D atau W" }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { id: productId, userId: session.user.id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  const [selection, latestPrediction] = await Promise.all([
    prisma.forecastModelSelection.findUnique({ where: { productId_frequency: { productId, frequency } } }),
    prisma.prediction.findFirst({ where: { productId, freq: frequency }, orderBy: [{ createdAt: "desc" }, { predictionDate: "desc" }] }),
  ]);

  if (!selection) {
    return NextResponse.json({
      status: "unavailable", model_selected: null, model_used: latestPrediction?.modelVersion?.split(":").pop() ?? null,
      fallback_used: false, validation: null, confidence: { score: null, status: "unavailable", reason: "selection_not_persisted", label: "Belum tersedia", message: "Belum ada hasil evaluasi Adaptive Model Selection yang tersimpan untuk frekuensi ini.", color: "gray" },
    });
  }

  const storedModel = latestPrediction?.modelVersion?.split(":").pop() ?? selection.selectedModel;
  const fallbackUsed = storedModel.toLowerCase() !== selection.selectedModel.toLowerCase();
  const wape = selection.validationWape == null ? null : Number(selection.validationWape);
  const nPredictions = Number(selection.nPredictions ?? 0);
  let confidence: { score: number | null; status: "available" | "unavailable"; reason: string | null; label: string; message: string; color: string };
  if (fallbackUsed) {
    confidence = { score: null, status: "unavailable", reason: "runtime_fallback", label: "Belum tersedia", message: "Model yang digunakan merupakan fallback; metrik model terpilih tidak mewakili hasil fallback.", color: "gray" };
  } else if (selection.evaluationStatus !== "success" || nPredictions < MIN_CONFIDENCE_PREDICTIONS || wape == null || !Number.isFinite(wape) || wape < 0) {
    const reason = selection.evaluationStatus !== "success" ? "evaluation_failed" : nPredictions < MIN_CONFIDENCE_PREDICTIONS ? "insufficient_validation_predictions" : "wape_undefined";
    confidence = { score: null, status: "unavailable", reason, label: "Belum tersedia", message: "Confidence belum tersedia karena evaluasi atau data validasi belum memenuhi persyaratan.", color: "gray" };
  } else {
    const score = Math.max(0, Math.min(100, 100 - wape));
    const quality = score >= 80
      ? { label: "Reliabilitas tinggi", message: "Kesalahan relatif pada data validasi tergolong rendah.", color: "green" }
      : score >= 60
        ? { label: "Reliabilitas sedang", message: "Kesalahan relatif pada data validasi masih perlu diperhatikan.", color: "yellow" }
        : { label: "Reliabilitas rendah", message: "Kesalahan relatif pada data validasi cukup tinggi.", color: "red" };
    confidence = { score: Number(score.toFixed(2)), status: "available", reason: null, ...quality };
  }

  return NextResponse.json({
    status: selection.evaluationStatus,
    model_selected: selection.selectedModel,
    model_used: storedModel,
    strategy: selection.strategy,
    fallback_used: fallbackUsed,
    data_points: selection.dataPoints,
    validation: { mae: selection.validationMae, rmse: selection.validationRmse, wape, n_predictions: nPredictions },
    confidence,
  });
}

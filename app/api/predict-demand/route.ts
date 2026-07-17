import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const userPayload = getUserFromRequest(req);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  // ── 1. Panggil Python AI Service ────────────────────────────────────────
  // demand_service.py sudah menangani:
  //   - Ambil data dari DB
  //   - Train Prophet
  //   - Simpan prediksi + upperBound + lowerBound ke tabel Prediction
  //   - Return forecast_summary, confidence, growth, dll
  let aiResult: any;
  try {
    const aiRes = await fetch(`${AI_SERVICE_URL}/predict-demand/${productId}`, {
      method: "POST",
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Service error:", errText);
      return NextResponse.json(
        { error: "AI service gagal memproses prediksi", detail: errText },
        { status: 502 },
      );
    }

    aiResult = await aiRes.json();
  } catch (err) {
    console.error("Gagal menghubungi AI service:", err);
    return NextResponse.json(
      { error: "AI service tidak dapat dijangkau" },
      { status: 503 },
    );
  }

  // ── 2. Tangani error dari Python ────────────────────────────────────────
  if (aiResult.error) {
    return NextResponse.json({ error: aiResult.error }, { status: 500 });
  }

  if (aiResult.status === "insufficient_data") {
    return NextResponse.json(
      { error: aiResult.message, status: "insufficient_data" },
      { status: 422 },
    );
  }

  // ── 3. Return ke frontend ────────────────────────────────────────────────
  // demand_service.py sudah menyimpan ke DB — tidak perlu simpan ulang di sini.
  // Cukup teruskan response ke client.
  return NextResponse.json({
    success: true,
    growth: aiResult.growth ?? 0,
    confidence: aiResult.confidence ?? 0,
    confidence_context: aiResult.confidence_context ?? null,
    model_used: aiResult.model_used ?? "prophet",
    data_points: aiResult.data_points ?? 0,
    // forecast_summary berisi { avg, min, max, lower, upper }
    // digunakan oleh ForecastChart untuk menampilkan uncertainty interval
    forecastSummary: aiResult.forecast_summary ?? null,
  });
}

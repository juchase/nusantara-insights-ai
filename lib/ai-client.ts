// lib/ai-client.ts

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// DEMAND FORECASTING
// Memanggil Python AI Service dengan product_id sebagai path parameter.
// demand_service.py mengambil data langsung dari DB, melatih Prophet,
// menyimpan prediksi, dan mengembalikan forecast_summary + confidence.
// ─────────────────────────────────────────────────────────────────────────────
export async function predictDemand(productId: string) {
  const res = await fetch(`${AI_SERVICE_URL}/predict-demand/${productId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI service error (${res.status}): ${detail}`);
  }

  return res.json();
  // Response shape dari demand_service.py:
  // {
  //   status:             "success" | "insufficient_data"
  //   totalInserted:      number
  //   growth:             number
  //   confidence:         number
  //   confidence_context: { label, message, color }
  //   model_used:         "prophet"
  //   data_points:        number
  //   forecast_summary:   { avg, min, max, lower, upper }
  // }
}

// ─────────────────────────────────────────────────────────────────────────────
// SENTIMENT ANALYSIS
// Kirim array teks ulasan, terima hasil label + confidence per ulasan.
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeSentiment(texts: string[]) {
  const res = await fetch(`${AI_SERVICE_URL}/analyze-sentiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI service error (${res.status}): ${detail}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT GENERATOR
// Ambil insight + narasi LLM untuk product_id tertentu.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateInsight(productId: string) {
  const res = await fetch(`${AI_SERVICE_URL}/generate-insight/${productId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI service error (${res.status}): ${detail}`);
  }

  return res.json();
}

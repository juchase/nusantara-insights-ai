"use client";

import { useEffect, useState } from "react";
import { PackageSearch, RefreshCcw } from "lucide-react";

import ForecastChart from "@/components/dashboard/ForecastChart";
import SalesChart from "@/components/dashboard/SalesChart";
import { mergeForecastData } from "@/lib/mergeForecastData";
import { safeFetch } from "@/lib/safe-fetch";

type Product = { id: string; name: string };
type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
};
type SalesPoint = {
  date: string;
  quantity: number;
};
type PredictionPoint = {
  predictionDate: string;
  predictedSales: number;
};
type ConfidenceContext = {
  label: string;
  message: string;
  color: "green" | "amber" | "red";
};

// ── TAMBAHKAN TIPE UNTUK RESPON DARI FASTAPI ──
type PredictDemandResponse = {
  confidence: number;
  confidence_context?: ConfidenceContext;
  model_used?: string;
  freq?: "D" | "W"; // ← FASTAPI MENGEMBALIKAN INI
  forecast_summary?: {
    // ← FASTAPI MENGEMBALIKAN INI
    avg: number;
    min: number;
    max: number;
    lower: number;
    upper: number;
  };
};

function calculateGrowth(data: ForecastPoint[]): number {
  const actual = data
    .filter((item) => item.actual)
    .map((item) => item.actual ?? 0);
  const predicted = data
    .filter((item) => item.predicted)
    .map((item) => item.predicted ?? 0);

  if (!actual.length || !predicted.length) return 0;

  const lastActual = actual[actual.length - 1];
  const avgPredicted =
    predicted.reduce((total, value) => total + value, 0) / predicted.length;

  if (lastActual === 0) return 0;
  return parseFloat(
    (((avgPredicted - lastActual) / lastActual) * 100).toFixed(1),
  );
}

export default function ForecastPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [growth, setGrowth] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [confidenceContext, setConfidenceContext] =
    useState<ConfidenceContext | null>(null);
  const [modelUsed, setModelUsed] = useState("");
  const [loading, setLoading] = useState(true);

  // ── TAMBAHKAN STATE UNTUK FORECASTSUMMARY DAN FREQ ──
  const [forecastSummary, setForecastSummary] = useState<any>(null);
  const [freq, setFreq] = useState<"D" | "W">("D");

  // Muat daftar produk saat komponen mount
  useEffect(() => {
    const loadProducts = async () => {
      const data = await safeFetch<Product[]>("/api/products", []);
      setProducts(data);
      if (data.length > 0) setSelectedProduct(data[0].id);
    };
    loadProducts();
  }, []);

  // Fungsi untuk melakukan refresh/load forecast
  const handleRefresh = async (productId: string) => {
    if (!productId) return;
    setLoading(true);

    try {
      const predictData = await safeFetch<PredictDemandResponse>(
        `http://localhost:8000/predict-demand/${productId}`,
        { confidence: 0 },
        { method: "POST" },
      );

      setConfidence(predictData.confidence || 0);
      setConfidenceContext(predictData.confidence_context || null);
      setModelUsed(predictData.model_used || "");

      // ── AMBIL FREQ DAN FORECAST_SUMMARY DARI RESPON ──
      setFreq(predictData.freq || "D");
      setForecastSummary(predictData.forecast_summary || null);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const result = await safeFetch<{
        sales: SalesPoint[];
        predictions: PredictionPoint[];
      }>(`/api/predictions/${productId}`, { sales: [], predictions: [] });

      const merged = mergeForecastData(
        result.sales,
        result.predictions,
      ) as ForecastPoint[];

      setForecastData(merged);
      setGrowth(calculateGrowth(merged));
    } catch (error) {
      console.error("Gagal load forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  // Saat produk berubah (pertama kali dipilih atau ganti produk), refresh data otomatis 1x
  useEffect(() => {
    if (selectedProduct) {
      handleRefresh(selectedProduct);
    }
  }, [selectedProduct]);

  const selectedName =
    products.find((product) => product.id === selectedProduct)?.name ?? "-";

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
            Demand Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Forecast
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Prediksi permintaan berbasis data penjualan historis untuk produk
            aktif.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
            <PackageSearch size={16} className="text-gray-400" />
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="w-full min-w-64 bg-transparent text-sm text-gray-800 outline-none"
            >
              {products.length === 0 ? (
                <option value="">Tidak ada produk</option>
              ) : (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))
              )}
            </select>
          </label>

          {/* Tombol Refresh: memicu handleRefresh secara manual */}
          <button
            type="button"
            onClick={() => handleRefresh(selectedProduct)}
            disabled={!selectedProduct || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p className="text-sm font-medium text-gray-950">{selectedName}</p>
        <p className="mt-1 text-xs text-gray-500">
          {loading
            ? "Memuat prediksi terbaru..."
            : `${forecastData.length} titik data aktual dan prediksi tersedia`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        {/* ── SEKARANG PROPS INI SUDAH VALID ── */}
        <ForecastChart
          data={forecastData}
          growth={growth}
          confidence={confidence}
          confidenceContext={confidenceContext}
          modelUsed={modelUsed}
          forecastSummary={forecastSummary}
          freq={freq}
          loading={loading}
        />
        <SalesChart
          data={forecastData}
          modelUsed={modelUsed}
          loading={loading}
        />
      </div>

      {/* Tabel prediksi 7 hari */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
          marginTop: 16,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
          Detail Prediksi 7 Hari
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tanggal", "Prediksi (unit)", "Keterangan"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    color: "#9ca3af",
                    fontWeight: 500,
                    padding: "6px 8px",
                    borderBottom: "1px solid #f3f4f6",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecastData
              .filter((d) => d.predicted)
              .map((d, i) => (
                <tr key={i}>
                  <td
                    style={{
                      fontSize: 12,
                      color: "#374151",
                      padding: "8px 8px",
                      borderBottom: "1px solid #f9fafb",
                    }}
                  >
                    {d.date}
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#111827",
                      padding: "8px 8px",
                      borderBottom: "1px solid #f9fafb",
                    }}
                  >
                    {Math.round(d.predicted ?? 0)} unit
                  </td>
                  <td
                    style={{
                      padding: "8px 8px",
                      borderBottom: "1px solid #f9fafb",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "#eef2ff",
                        color: "#4f46e5",
                      }}
                    >
                      Prediksi AI
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

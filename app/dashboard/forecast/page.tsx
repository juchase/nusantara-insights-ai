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

type PredictDemandResponse = {
  confidence: number;
  confidence_context?: ConfidenceContext;
  model_used?: string;
  freq?: "D" | "W";
  forecast_summary?: {
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

  const [forecastSummary, setForecastSummary] = useState<any>(null);
  const [freq, setFreq] = useState<"D" | "W">("D");

  // Ambil daftar produk saat pertama kali
  useEffect(() => {
    const loadProducts = async () => {
      const data = await safeFetch<Product[]>("/api/products", []);
      setProducts(data);
      if (data.length > 0) setSelectedProduct(data[0].id);
    };
    loadProducts();
  }, []);

  // Fungsi untuk mengambil data prediksi dari DB (tidak generate)
  const fetchForecastData = async (productId: string) => {
    if (!productId) return;
    try {
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
    }
  };

  // Load initial saat produk dipilih (hanya ambil dari DB)
  useEffect(() => {
    if (selectedProduct) {
      setLoading(true);
      fetchForecastData(selectedProduct).finally(() => setLoading(false));
    }
  }, [selectedProduct]);

  // Fungsi refresh: generate baru + ambil data terbaru
  const handleRefresh = async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    try {
      // 1. Panggil endpoint untuk generate forecasting baru
      const ai_url =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const predictData = await safeFetch<PredictDemandResponse>(
        `${ai_url}/predict-demand/${productId}`,
        { confidence: 0 },
        { method: "POST" },
      );

      setConfidence(predictData.confidence || 0);
      setConfidenceContext(predictData.confidence_context || null);
      setModelUsed(predictData.model_used || "");
      setFreq(predictData.freq || "D");
      setForecastSummary(predictData.forecast_summary || null);

      // 2. Tunggu sebentar agar database selesai menulis
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 3. Ambil data terbaru dari database
      await fetchForecastData(productId);
    } catch (error) {
      console.error("Gagal refresh forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedName =
    products.find((product) => product.id === selectedProduct)?.name ?? "-";

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6 bg-background text-foreground">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Demand Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Forecast</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Prediksi permintaan berbasis data penjualan historis untuk produk
            aktif.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-10 items-center gap-2 rounded-lg bg-card/60 border border-border px-3 focus-within:border-primary">
            <PackageSearch size={16} className="text-muted" />
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="w-full min-w-64 bg-transparent text-sm text-foreground outline-none"
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

          <button
            type="button"
            onClick={() => handleRefresh(selectedProduct)}
            disabled={!selectedProduct || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="glass-card border border-border p-5">
        <p className="text-sm font-medium text-foreground">{selectedName}</p>
        <p className="mt-1 text-xs text-muted">
          {loading
            ? "Memuat prediksi terbaru..."
            : `${forecastData.length} titik data aktual dan prediksi tersedia`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
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

      {/* Tabel Detail Prediksi 7 Hari */}
      <div className="glass-card border border-border p-5 mt-4">
        <p className="text-sm font-medium text-foreground mb-4">
          Detail Prediksi 7 Hari
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Tanggal", "Prediksi (unit)", "Keterangan"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-medium uppercase tracking-wider text-muted py-2 px-2 border-b border-border"
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
                  <tr
                    key={i}
                    className="border-b border-border/10 last:border-0"
                  >
                    <td className="text-sm text-muted py-3 px-2">{d.date}</td>
                    <td className="text-sm font-medium text-foreground py-3 px-2">
                      {Math.round(d.predicted ?? 0)} unit
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/20">
                        Prediksi AI
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

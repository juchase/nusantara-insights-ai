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

  useEffect(() => {
    const loadProducts = async () => {
      const data = await safeFetch<Product[]>("/api/products", []);
      setProducts(data);
      if (data.length > 0) setSelectedProduct(data[0].id);
    };
    loadProducts();
  }, []);

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
          <p className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            Demand Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Forecast</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Prediksi permintaan berbasis data penjualan historis untuk produk
            aktif.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-10 items-center gap-2 rounded-lg bg-[#1e293b]/60 border border-border px-3 focus-within:border-[#F59E0B]">
            <PackageSearch size={16} className="text-slate-400" />
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="w-full min-w-64 bg-transparent text-sm text-white outline-none"
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-4 text-sm font-bold text-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D97706] transition-colors"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="glass-card border border-border p-5">
        <p className="text-sm font-medium text-white">{selectedName}</p>
        <p className="mt-1 text-xs text-slate-400">
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
        <p className="text-sm font-medium text-white mb-4">
          Detail Prediksi 7 Hari
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Tanggal", "Prediksi (unit)", "Keterangan"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-medium uppercase tracking-wider text-slate-400 py-2 px-2 border-b border-border"
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
                    className="border-b border-[rgba(255,255,255,0.04)] last:border-0"
                  >
                    <td className="text-sm text-slate-300 py-3 px-2">
                      {d.date}
                    </td>
                    <td className="text-sm font-medium text-white py-3 px-2">
                      {Math.round(d.predicted ?? 0)} unit
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#7F77DD]/15 text-[#7F77DD] border border-[#7F77DD]/20">
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

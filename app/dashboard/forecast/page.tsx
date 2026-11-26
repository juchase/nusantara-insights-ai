"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageSearch, RefreshCcw } from "lucide-react";
import ForecastChart from "@/components/dashboard/ForecastChart";
import SalesChart from "@/components/dashboard/SalesChart";
import { mergeForecastData } from "@/lib/mergeForecastData";
import { safeFetch } from "@/lib/safe-fetch";
import { getSelectedProductId, setSelectedProductId } from "@/lib/product-selection";

type Product = { id: string; name: string };
type ForecastPoint = { date: string; actual?: number | null; predicted?: number | null };
type SalesPoint = { date: string; quantity: number };
type PredictionPoint = { predictionDate: string; predictedSales: number; freq?: string; modelVersion?: string | null };
type Confidence = { score: number | null; status: "available" | "unavailable"; reason?: string | null; label: string; message: string; color: "green" | "yellow" | "red" | "gray" };
type Validation = { mae: number | null; rmse: number | null; wape: number | null; n_predictions: number };
type ForecastResponse = {
  status: string; product_id: string; freq: "D" | "W"; model_selected: string; model_used: string;
  strategy: string; fallback_used: boolean; data_points: number; totalInserted: number;
  validation: Validation; confidence: Confidence;
  forecast_summary: { avg: number; min: number; max: number };
};

function weekStartingMonday(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function aggregateWeeklySales(sales: SalesPoint[]): SalesPoint[] {
  const totals = new Map<string, number>();
  for (const sale of sales) {
    const monday = weekStartingMonday(sale.date);
    totals.set(monday, (totals.get(monday) ?? 0) + sale.quantity);
  }
  return Array.from(totals, ([date, quantity]) => ({ date, quantity })).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateGrowth(data: ForecastPoint[], frequency: "D" | "W"): number {
  const actual = data
    .filter((point) => point.actual != null)
    .map((point) => Number(point.actual))
    .slice(-(frequency === "W" ? 4 : 7));
  const predicted = data
    .filter((point) => point.predicted != null)
    .map((point) => Number(point.predicted));
  if (!actual.length || !predicted.length) return 0;
  const baseline = actual.reduce((sum, value) => sum + value, 0) / actual.length;
  const forecastAverage = predicted.reduce((sum, value) => sum + value, 0) / predicted.length;
  if (baseline <= 0) return forecastAverage <= 0 ? 0 : 100;
  return Number((((forecastAverage - baseline) / baseline) * 100).toFixed(2));
}

const unavailableConfidence: Confidence = {
  score: null, status: "unavailable", reason: "not_loaded", label: "Belum tersedia",
  message: "Jalankan Forecasting V2 untuk memperoleh hasil validasi.", color: "gray",
};

export default function ForecastPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [growth, setGrowth] = useState(0);
  const [modelUsed, setModelUsed] = useState("");
  const [strategy, setStrategy] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [dataPoints, setDataPoints] = useState(0);
  const [lastActualDate, setLastActualDate] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence>(unavailableConfidence);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [freq, setFreq] = useState<"D" | "W">("D");

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      const data = await safeFetch<Product[]>("/api/products", []);
      if (!active) return;
      setProducts(data);
      if (data.length) {
        const savedProductId = getSelectedProductId();
        const initialProduct = data.find((item) => item.id === savedProductId) ?? data[0];
        setSelectedProduct(initialProduct.id);
      }
      else setLoading(false);
    };
    void loadProducts();
    return () => { active = false; };
  }, []);

  const fetchForecastData = useCallback(async (productId: string, frequency: "D" | "W") => {
    const response = await fetch(`/api/predictions/${encodeURIComponent(productId)}?freq=${frequency}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Gagal mengambil histori dan prediksi dari database.");
    const result = await response.json() as { sales: SalesPoint[]; predictions: PredictionPoint[]; lastActualDate?: string | null };
    setLastActualDate(result.lastActualDate ?? (result.sales.length ? result.sales[result.sales.length - 1].date.slice(0, 10) : null));
    const sales = frequency === "W" ? aggregateWeeklySales(result.sales) : result.sales;
    const predictions = result.predictions.filter((point) => !point.freq || point.freq === frequency);
    const latestModel = [...predictions].reverse().find((point) => point.modelVersion)?.modelVersion;
    if (latestModel) setModelUsed(latestModel.split(":").pop() ?? latestModel);
    const merged = mergeForecastData(sales, predictions) as ForecastPoint[];
    setForecastData(merged);
    setGrowth(calculateGrowth(merged, frequency));
  }, []);

  const fetchSavedSelection = useCallback(async (productId: string, frequency: "D" | "W") => {
    const response = await fetch(`/api/forecast/selection/${encodeURIComponent(productId)}?frequency=${frequency}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Gagal mengambil status confidence dari database.");
    const result = await response.json() as ForecastResponse;
    setConfidence(result.confidence ?? unavailableConfidence);
    setValidation(result.validation ?? null);
    setModelUsed(result.model_used ?? result.model_selected ?? "");
    setStrategy(result.strategy ?? "");
    setFallbackUsed(Boolean(result.fallback_used));
    setDataPoints(Number(result.data_points ?? 0));
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    let active = true;
    setLoading(true); setError("");
    Promise.all([fetchForecastData(selectedProduct, freq), fetchSavedSelection(selectedProduct, freq)])
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat forecast."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedProduct, freq, fetchForecastData, fetchSavedSelection]);

  const handleRefresh = async () => {
    if (!selectedProduct || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/forecast/v2/${encodeURIComponent(selectedProduct)}?frequency=${freq}`, { method: "POST" });
      const result = await response.json() as ForecastResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Forecasting V2 gagal dijalankan.");
      setConfidence(result.confidence ?? unavailableConfidence);
      setValidation(result.validation ?? null);
      setModelUsed(result.model_used ?? "");
      setStrategy(result.strategy ?? "");
      setFallbackUsed(Boolean(result.fallback_used));
      setDataPoints(Number(result.data_points ?? 0));
      await fetchForecastData(selectedProduct, freq);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjalankan Forecasting V2.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) setSelectedProductId(selectedProduct);
  }, [selectedProduct]);

  const dataAgeDays = lastActualDate
    ? Math.floor((Date.now() - new Date(`${lastActualDate}T00:00:00`).getTime()) / 86400000)
    : null;
  const selectedName = products.find((product) => product.id === selectedProduct)?.name ?? "-";
  const horizonLabel = freq === "W" ? "4 minggu" : "7 hari";

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6 bg-background text-foreground">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Demand Intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Forecast</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">Prediksi permintaan dari Forecasting V2 dengan confidence berbasis Validation WAPE.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-10 items-center gap-2 rounded-lg bg-card/60 border border-border px-3 focus-within:border-primary">
            <PackageSearch size={16} className="text-muted" />
            <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} className="w-full min-w-64 bg-transparent text-sm text-foreground outline-none">
              {products.length === 0 ? <option value="">Tidak ada produk</option> : products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          <div className="inline-flex h-10 rounded-lg border border-border bg-card/60 p-1">
            {(["D", "W"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFreq(value)} className={`rounded-md px-3 text-xs font-semibold transition-colors ${freq === value ? "bg-primary text-background" : "text-muted hover:text-foreground"}`}>
                {value === "D" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleRefresh} disabled={!selectedProduct || loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors">
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} /> Generate {freq === "D" ? "Daily" : "Weekly"}
          </button>
        </div>
      </div>

      {dataAgeDays !== null && dataAgeDays > 30 && (
        <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Data penjualan terakhir {lastActualDate} (sekitar {dataAgeDays.toLocaleString("id-ID")} hari lalu). Tanggal forecast mengikuti tanggal histori terakhir, bukan tanggal hari ini. Perbarui dataset untuk prediksi operasional terkini.
        </div>
      )}

      <div className="glass-card border border-border p-5">
        <p className="text-sm font-medium text-foreground">{selectedName}</p>
        <p className="mt-1 text-xs text-muted">{loading ? "Memuat prediksi..." : `${forecastData.length} titik data · horizon ${horizonLabel}`}</p>
        {modelUsed && <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-secondary">Model: {modelUsed}</span>
          {strategy && <span className="rounded-full bg-card px-2.5 py-1 text-muted">Strategi: {strategy}</span>}
          <span className={`rounded-full px-2.5 py-1 ${fallbackUsed ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>{fallbackUsed ? "Fallback digunakan" : "Model selection berhasil"}</span>
          {dataPoints > 0 && <span className="rounded-full bg-card px-2.5 py-1 text-muted">{dataPoints} data historis</span>}
        </div>}
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ForecastChart data={forecastData} growth={growth} confidence={confidence.score} confidenceContext={confidence} validation={validation} fallbackUsed={fallbackUsed} modelUsed={modelUsed} forecastSummary={null} freq={freq} loading={loading} />
        <SalesChart data={forecastData} modelUsed={modelUsed} loading={loading} />
      </div>

      <div className="glass-card border border-border p-5 mt-4">
        <p className="text-sm font-medium text-foreground mb-4">Detail Prediksi {freq === "D" ? "7 Hari" : "4 Minggu"}</p>
        <div className="overflow-x-auto"><table className="w-full border-collapse">
          <thead><tr>{["Tanggal", "Prediksi (unit)", "Keterangan"].map((heading) => <th key={heading} className="text-left text-[11px] font-medium uppercase tracking-wider text-muted py-2 px-2 border-b border-border">{heading}</th>)}</tr></thead>
          <tbody>{forecastData.filter((point) => point.predicted != null).map((point) => <tr key={point.date} className="border-b border-border/10 last:border-0">
            <td className="text-sm text-muted py-3 px-2">{point.date}</td>
            <td className="text-sm font-medium text-foreground py-3 px-2">{Number(point.predicted ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} unit</td>
            <td className="py-3 px-2"><span className="inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/20">Forecasting V2</span></td>
          </tr>)}</tbody>
        </table>
        {!loading && forecastData.every((point) => point.predicted == null) && <p className="py-4 text-center text-sm text-muted">Belum ada prediksi. Klik Generate untuk menjalankan Forecasting V2.</p>}</div>
      </div>
    </div>
  );
}

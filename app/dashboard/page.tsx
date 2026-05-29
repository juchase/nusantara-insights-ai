// app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InsightResponse } from "@/types/insight";

import { safeFetch } from "@/lib/safe-fetch";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import SalesChart from "@/components/dashboard/SalesChart";
import ForecastChart from "@/components/dashboard/ForecastChart";
import InsightCard from "@/components/dashboard/InsightCard";
import InsightPanel from "@/components/dashboard/InsightPanel";
import SentimentDistribution from "@/components/dashboard/SentimentDistribution";
import ProductRanking from "@/components/dashboard/ProductRanking";
import RiskOverview from "@/components/dashboard/RiskOverview";
import SentimentTrendCard from "@/components/dashboard/SentimentTrendCard";
import { mergeForecastData } from "@/lib/mergeForecastData";

type Product = { id: string; name: string };
type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
};
type SentimentTimelinePoint = { date: string; total: number };
type DashboardAnalyticsResponse = {
  topKeywords?: [string, number][];
  chartData?: SentimentTimelinePoint[];
  totalReviews?: number;
  totalProducts?: number;
  avgRating?: number;
  sentimentStats?: { positive: number; neutral: number; negative: number };
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<SentimentTimelinePoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [growth, setGrowth] = useState<number>(0);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    sentimentStats: { positive: 0, neutral: 0, negative: 0 },
  });
  const [complaints, setComplaints] = useState<[string, number][]>([]);
  const [confidenceContext, setConfidenceContext] = useState<{
    label: string;
    message: string;
    color: "green" | "amber" | "red";
  } | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("");

  const router = useRouter();

  // AUTH
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return router.push("/login");
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // PRODUCTS
  // ── PRODUCTS ──────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await safeFetch<Product[]>("/api/products", []);
        setProducts(data);
        if (data.length > 0) setSelectedProduct(data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // ── ANALYTICS ─────────────────────────────────────────
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await safeFetch<DashboardAnalyticsResponse>(
          "/api/dashboard-analytics",
          {
            topKeywords: [],
            chartData: [],
            totalReviews: 0,
            totalProducts: 0,
            avgRating: 0,
            sentimentStats: { positive: 0, neutral: 0, negative: 0 },
          },
        );

        setTopKeywords(data.topKeywords || []);
        setChartData(data.chartData || []);
        setStats({
          totalReviews: data.totalReviews || 0,
          totalProducts: data.totalProducts || 0,
          avgRating: Math.round((data.avgRating || 0) * 10) / 10,
          sentimentStats: data.sentimentStats || {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // ── FORECAST ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const fetchForecast = async () => {
      try {
        // Trigger AI predict — pakai safeFetch dengan fallback kosong
        const predictData = await safeFetch<{
          confidence: number;
          confidence_context?: {
            label: string;
            message: string;
            color: "green" | "amber" | "red";
          };
          model_used?: string;
        }>(
          `http://localhost:8000/predict-demand/${selectedProduct}`,
          { confidence: 0 },
          { method: "POST" }, // ← safeFetch perlu support options
        );

        setConfidence(predictData.confidence || 0);
        setConfidenceContext(predictData.confidence_context || null);
        setModelUsed(predictData.model_used || "");

        await new Promise((r) => setTimeout(r, 300));

        // Ambil hasil prediksi dari DB
        const result = await safeFetch<{ sales: any[]; predictions: any[] }>(
          `/api/predictions/${selectedProduct}`,
          { sales: [], predictions: [] },
        );

        const merged = mergeForecastData(
          result.sales,
          result.predictions,
        ) as ForecastPoint[];
        setForecastData(merged);
        setGrowth(calculateGrowth(merged));
      } catch (err) {
        console.error(err);
        setForecastData([]);
        setGrowth(0);
      }
    };

    fetchForecast();
  }, [selectedProduct]);

  // ── INSIGHT ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const fetchInsight = async () => {
      try {
        setInsightLoading(true);

        const data = await safeFetch<InsightResponse>(
          `http://127.0.0.1:8000/generate-insight/${selectedProduct}`,
          {
            executive_summary: "",
            summary: "",
            health_score: 0,
            health_label: "",
            insights: [],
            recommendations: [],
            dominant_issue: "",
            risk_level: "low",
            llm_used: false,
            metrics: undefined,
          },
        );

        // Hanya set kalau ada data bermakna
        if (data.summary) setInsight(data);
      } catch (err) {
        console.error(err);
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsight();
  }, [selectedProduct]);

  // ── COMPLAINTS ────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const fetchComplaints = async () => {
      const data = await safeFetch<{ topKeywords: [string, number][] }>(
        `/api/complaints/${selectedProduct}`,
        { topKeywords: [] },
      );
      setComplaints(data.topKeywords || []);
    };

    fetchComplaints();
  }, [selectedProduct]);

  // ✅ FIX di DashboardPage
  function calculateGrowth(data: ForecastPoint[]): number {
    const actual = data.filter((d) => d.actual).map((d) => d.actual ?? 0);
    const predicted = data
      .filter((d) => d.predicted)
      .map((d) => d.predicted ?? 0);
    if (!actual.length || !predicted.length) return 0;

    const lastActual = actual[actual.length - 1];
    const avgPredicted =
      predicted.reduce((a, b) => a + b, 0) / predicted.length;
    // ↑ rata-rata, bukan total

    if (lastActual === 0) return 0;
    return parseFloat(
      (((avgPredicted - lastActual) / lastActual) * 100).toFixed(1),
    );
  }

  if (authLoading || dataLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-gray-400">Memuat dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 px-6 pb-10 max-w-[1200px] mx-auto">
        {/* AI INSIGHT CARD — dark, full width */}
        <InsightCard
          insight={insight}
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          loading={insightLoading}
        />

        <ProductRanking />

        {/* METRICS */}
        <InsightPanel
          insight={insight}
          stats={stats}
          loading={insightLoading}
        />

        {/* ROW A: Sentiment Distribution + Demand Forecast */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <SentimentDistribution
              positive={stats.sentimentStats.positive}
              neutral={stats.sentimentStats.neutral}
              negative={stats.sentimentStats.negative}
            />
            <SentimentTrendCard
              data={insight?.sentiment_trend}
              loading={insightLoading}
            />
          </div>
          <ForecastChart
            data={forecastData}
            growth={growth}
            confidence={confidence}
            confidenceContext={confidenceContext}
            modelUsed={modelUsed}
          />
        </div>

        {/* ROW B: Sentiment Timeline (full width) */}
        <SalesChart data={forecastData} modelUsed={modelUsed} />

        {/* ROW C: Complaints + Risk Overview */}
        <div className="grid grid-cols-2 gap-4">
          <ComplaintsCard data={complaints} />
          <RiskOverview insight={insight} loading={insightLoading} />
        </div>
      </div>
    </>
  );
}

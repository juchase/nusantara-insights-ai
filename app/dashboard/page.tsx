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
  upper?: number | null;
  lower?: number | null;
};

// Tipe forecast_summary dari Prophet
type ForecastSummary = {
  avg: number;
  min: number;
  max: number;
  lower: number;
  upper: number;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [insight, setInsight] = useState<InsightResponse | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(true);

  const [confidence, setConfidence] = useState(0);
  const [forecastSummary, setForecastSummary] =
    useState<ForecastSummary | null>(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
  });
  const [complaints, setComplaints] = useState<[string, number][]>([]);
  const [confidenceContext, setConfidenceContext] = useState<{
    label: string;
    message: string;
    color: "green" | "amber" | "red";
  } | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("");

  const router = useRouter();

  // ── AUTH ──────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    // Jika auth sudah selesai dan array produk dipastikan kosong (User Baru)
    if (!authLoading && products.length === 0) {
      setAnalyticsLoading(false);
      setForecastLoading(false);
      setInsightLoading(false);
      setComplaintsLoading(false);
    }
  }, [authLoading, products.length]);

  // ── PRODUCTS ──────────────────────────────────────────────────────────────
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

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);

        const analytics = await safeFetch<DashboardAnalyticsResponse>(
          `/api/dashboard-analytics?productId=${selectedProduct}`,
          {
            topKeywords: [],
            chartData: [],
            totalReviews: 0,
            avgRating: 0,
            sentimentStats: { positive: 0, neutral: 0, negative: 0 },
          },
        );

        setTopKeywords(analytics.topKeywords || []);
        setChartData(analytics.chartData || []);
        setStats({
          totalReviews: analytics.totalReviews || 0,
          avgRating: Math.round((analytics.avgRating || 0) * 10) / 10,
          totalProducts: products.length,
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedProduct, products.length]);

  // ── FORECAST ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const loadForecast = async () => {
      try {
        setForecastLoading(true);

        // Panggil lewat Next.js API route (bukan langsung ke localhost:8000)
        const predictData = await safeFetch<any>(
          "/api/predict-demand",
          {
            confidence: 0,
            growth: 0,
            forecastSummary: null,
          },
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: selectedProduct }),
          },
        );

        setConfidence(predictData.confidence || 0);
        setConfidenceContext(predictData.confidence_context || null);
        setModelUsed(predictData.model_used || "");
        setGrowth(predictData.growth || 0);

        // Simpan forecast_summary dari Prophet (berisi avg, min, max, lower, upper)
        setForecastSummary(predictData.forecastSummary || null);

        // Ambil data chart (aktual + prediksi) dari DB
        const forecast = await safeFetch(
          `/api/predictions/${selectedProduct}`,
          { sales: [], predictions: [] },
        );

        setForecastData(
          mergeForecastData(
            forecast.sales,
            forecast.predictions,
          ) as ForecastPoint[],
        );
      } finally {
        setForecastLoading(false);
      }
    };

    loadForecast();
  }, [selectedProduct]);

  // ── INSIGHT ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const loadInsight = async () => {
      try {
        setInsightLoading(true);

        const insightData = await safeFetch<InsightResponse>(
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

        setInsight({
          executive_summary:
            insightData.executive_summary ||
            "Belum ada ringkasan yang tersedia.",
          summary: insightData.summary || "Belum ada insight AI yang tersedia.",
          health_score: insightData.health_score ?? 0,
          health_label: insightData.health_label || "Belum dianalisis",
          insights: insightData.insights || [],
          recommendations: insightData.recommendations || [],
          dominant_issue: insightData.dominant_issue || "—",
          risk_level: insightData.risk_level || "low",
          llm_used: insightData.llm_used ?? false,
          metrics: insightData.metrics,
          sentiment_trend: insightData.sentiment_trend,
        });
      } finally {
        setInsightLoading(false);
      }
    };

    loadInsight();
  }, [selectedProduct]);

  // ── COMPLAINTS ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const loadComplaints = async () => {
      try {
        setComplaintsLoading(true);
        const complaintsData = await safeFetch(
          `/api/complaints/${selectedProduct}`,
          { topKeywords: [] },
        );
        setComplaints(complaintsData.topKeywords || []);
      } finally {
        setComplaintsLoading(false);
      }
    };

    loadComplaints();
  }, [selectedProduct]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mx-auto max-w-[1200px] space-y-4 pb-8 sm:space-y-5 lg:space-y-6 lg:pb-10">
        <InsightCard
          insight={insight}
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          loading={insightLoading}
        />

        <ProductRanking />

        <InsightPanel
          insight={insight}
          totalReviews={stats.totalReviews}
          avgRating={stats.avgRating}
          totalProducts={stats.totalProducts}
          loading={insightLoading}
        />

        {/* ROW A: Sentiment Distribution + Forecast */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 overflow-hidden">
            <SentimentDistribution
              positive={Math.round(insight?.metrics?.positive_percentage ?? 0)}
              neutral={Math.round(insight?.metrics?.neutral_percentage ?? 0)}
              negative={Math.round(insight?.metrics?.negative_percentage ?? 0)}
              loading={insightLoading}
            />
            <SentimentTrendCard
              data={insight?.sentiment_trend}
              loading={insightLoading}
            />
          </div>

          {/* ForecastChart sekarang menerima forecastSummary dari Prophet */}
          <ForecastChart
            data={forecastData}
            growth={growth}
            confidence={confidence}
            confidenceContext={confidenceContext}
            modelUsed={modelUsed}
            forecastSummary={forecastSummary}
            loading={forecastLoading}
          />
        </div>

        {/* ROW B: Sales + Forecast Chart */}
        <SalesChart
          data={forecastData}
          modelUsed={modelUsed}
          loading={forecastLoading}
        />

        {/* ROW C: Complaints + Risk Overview */}
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <ComplaintsCard data={complaints} loading={complaintsLoading} />
          <RiskOverview insight={insight} loading={insightLoading} />
        </div>
      </div>
    </>
  );
}

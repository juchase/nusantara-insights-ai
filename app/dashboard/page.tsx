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
  const [productsLoaded, setProductsLoaded] = useState(false);
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

  // ── PRODUCTS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await safeFetch<Product[]>("/api/products", []);
        setProducts(data);
        if (data.length > 0) {
          setSelectedProduct(data[0].id);
        } else {
          // ── FIX: user baru tanpa produk sama sekali ────────────────────
          // Tanpa selectedProduct, semua useEffect lain (analytics, insight,
          // forecast, complaints) TIDAK PERNAH jalan karena early-return
          // `if (!selectedProduct) return;`. Akibatnya setXxxLoading(false)
          // di blok finally masing-masing juga tidak pernah terpanggil, dan
          // semua komponen anak STUCK selamanya di skeleton loading.
          // Set semua loading ke false secara eksplisit di sini supaya
          // komponen-komponen itu lanjut ke pengecekan empty state (null).
          setAnalyticsLoading(false);
          setForecastLoading(false);
          setInsightLoading(false);
          setComplaintsLoading(false);
        }
      } catch (err) {
        console.error(err);
        // Fetch produk gagal -> jangan biarkan UI nyangkut loading selamanya
        setAnalyticsLoading(false);
        setForecastLoading(false);
        setInsightLoading(false);
        setComplaintsLoading(false);
      } finally {
        setProductsLoaded(true);
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

  // ── INSIGHT — baca dari DB saja, tidak call AI service ───────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const loadInsight = async () => {
      try {
        setInsightLoading(true);

        const insightData = await safeFetch<any>(
          `/api/insights/${selectedProduct}`,
          null,
        );

        if (!insightData) {
          setInsight(null);
          return;
        }

        setInsight({
          executive_summary:
            insightData.executive_summary || "Belum ada ringkasan.",
          summary: insightData.summary || "Belum ada insight AI.",
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

        if (insightData.forecastSummary) {
          setForecastSummary(insightData.forecastSummary);
        }

        const growthPct = insightData.metrics?.growth_percentage ?? 0;
        setGrowth(growthPct);

        setConfidence(insightData.confidence ?? 0);
        setConfidenceContext(insightData.confidence_context ?? null);
      } finally {
        setInsightLoading(false);
      }
    };

    loadInsight();
  }, [selectedProduct]);

  // ── FORECAST — baca prediksi dari DB saja ────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;

    const loadForecast = async () => {
      try {
        setForecastLoading(true);

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

        setModelUsed("prophet");
      } finally {
        setForecastLoading(false);
      }
    };

    loadForecast();
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
          loading={!productsLoaded || insightLoading}
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
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Mengapus xl:grid-cols-2 agar pembungkus luar tetap 1 kolom penuh */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 overflow-hidden">
              {/* Layout 2 kolom ini sekarang akan bertahan dari ukuran 'sm' hingga layar paling besar */}
              <SentimentDistribution
                positive={Math.round(
                  insight?.metrics?.positive_percentage ?? 0,
                )}
                neutral={Math.round(insight?.metrics?.neutral_percentage ?? 0)}
                negative={Math.round(
                  insight?.metrics?.negative_percentage ?? 0,
                )}
                loading={insightLoading}
              />
              <SentimentTrendCard
                data={insight?.sentiment_trend}
                loading={insightLoading}
              />
            </div>
          </div>

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

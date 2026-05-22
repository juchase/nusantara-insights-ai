"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ChevronDown, Radio, Sparkles } from "lucide-react";
import { InsightResponse } from "@/types/insight";

import Topbar from "@/components/dashboard/Topbar";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";
import ChartSection from "@/components/dashboard/ChartSection";
import ForecastChart from "@/components/dashboard/ForecastChart";
import InsightPanel from "@/components/dashboard/InsightPanel";
import InsightCard from "@/components/dashboard/InsightCard";

import { mergeForecastData } from "@/lib/mergeForecastData";

type Product = {
  id: string;
  name: string;
};

type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
};

type SentimentTimelinePoint = {
  date: string;
  total: number;
};

type DashboardAnalyticsResponse = {
  topKeywords?: [string, number][];
  chartData?: SentimentTimelinePoint[];
  totalReviews?: number;
  totalProducts?: number;
  avgRating?: number;
  sentimentStats?: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

export default function DashboardPage() {
  // =============================
  // STATES
  // =============================

  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<SentimentTimelinePoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);

  const [growth, setGrowth] = useState(0);

  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);

  const [authLoading, setAuthLoading] = useState(true);

  const [dataLoading, setDataLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);

  // SINGLE SOURCE OF TRUTH
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // INSIGHT
  const [insight, setInsight] = useState<InsightResponse | null>(null);

  const [insightLoading, setInsightLoading] = useState(false);

  const [confidence, setConfidence] = useState(0);

  // STATS
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    sentimentStats: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
  });

  const router = useRouter();

  // =============================
  // AUTH
  // =============================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");

        if (!res.ok) {
          return router.push("/login");
        }

        const data = await res.json();

        setUser(data.user);
        await res.json();
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // =============================
  // FETCH PRODUCTS
  // =============================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");

        const data = (await res.json()) as Product[];

        setProducts(data);

        // AUTO SELECT FIRST PRODUCT
        if (data.length > 0) {
          setSelectedProduct(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  // =============================
  // FETCH ANALYTICS
  // =============================

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/dashboard-analytics");

        const data = (await res.json()) as DashboardAnalyticsResponse;

        setTopKeywords(data.topKeywords || []);

        setChartData(data.chartData || []);

        setStats({
          totalReviews: data.totalReviews || 0,

          totalProducts: data.totalProducts || 0,

          sentimentStats: data.sentimentStats || {
            positive: 0,
            neutral: 0,
            negative: 0,
          },

          avgRating: Math.round((data.avgRating || 0) * 10) / 10,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // =============================
  // FORECAST FLOW
  // =============================

  useEffect(() => {
    if (!selectedProduct) return;

    const fetchForecast = async () => {
      try {
        // TRIGGER AI
        const predictRes = await fetch(
          `http://localhost:8000/predict-demand/${selectedProduct}`,
          {
            method: "POST",
          },
        );

        const predictData = await predictRes.json();

        setConfidence(predictData.confidence || 0);

        // delay kecil agar DB selesai commit
        await new Promise((resolve) => setTimeout(resolve, 300));

        // FETCH FROM DB
        const res = await fetch(`/api/predictions/${selectedProduct}`);

        const result = await res.json();

        const merged = mergeForecastData(
          result.sales,
          result.predictions,
        ) as ForecastPoint[];

        setForecastData(merged);

        setGrowth(calculateGrowth(merged));
      } catch (err) {
        console.error(err);
      }
    };

    fetchForecast();
  }, [selectedProduct]);

  // =============================
  // FETCH INSIGHT
  // =============================

  useEffect(() => {
    if (!selectedProduct) return;

    const fetchInsight = async () => {
      try {
        setInsightLoading(true);

        const res = await fetch(
          `http://127.0.0.1:8000/generate-insight/${selectedProduct}`,
        );

        const data = (await res.json()) as InsightResponse;

        setInsight(data);
      } catch (err) {
        console.error(err);
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsight();
  }, [selectedProduct]);

  // =============================
  // GROWTH
  // =============================

  function calculateGrowth(data: ForecastPoint[]) {
    const actual = data.filter((d) => d.actual).map((d) => d.actual);

    const predicted = data.filter((d) => d.predicted).map((d) => d.predicted);

    if (!actual.length || !predicted.length) {
      return 0;
    }

    const lastActual = actual[actual.length - 1];
    const safeLastActual = lastActual ?? 0;

    const totalPredicted = (predicted ?? []).reduce(
      (a, b) => (a ?? 0) + (b ?? 0),
      0,
    );

    return Number(
      (((totalPredicted ?? 0) - safeLastActual) / safeLastActual) * 100,
    ).toFixed(1);
  }

  // =============================
  // LOADING
  // =============================

  if (authLoading || dataLoading) {
    return (
      <>
        <Topbar />
        <div className="space-y-8 min-h-screen flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  // =============================
  // UI
  // =============================

  return (
    <>
      <Topbar />

      <div className="space-y-8">
        {/* INSIGHT */}
        <InsightCard
          insight={insight}
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          loading={insightLoading}
        />

        <InsightPanel
          insight={insight}
          stats={stats}
          loading={insightLoading}
        />

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CHART */}
          <div className="lg:col-span-8">
            <ChartSection data={chartData} />
          </div>

          {/* FORECAST */}
          <div className="lg:col-span-4">
            <ForecastChart
              data={forecastData}
              growth={growth}
              confidence={confidence}
            />
          </div>

          {/* COMPLAINTS */}
          <div className="lg:col-span-5">
            <ComplaintsCard data={topKeywords.slice(0, 5)} />
          </div>

          {/* KEYWORD MAP */}
          <div className="lg:col-span-7">
            <KeywordMap data={topKeywords.slice(0, 5)} />
          </div>
        </div>
      </div>
    </>
  );
}
